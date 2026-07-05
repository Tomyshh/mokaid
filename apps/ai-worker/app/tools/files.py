"""File processing tools: image modification, analysis, audio transcription, document extraction.

These tools download attached files from their presigned URLs, process them
using OpenAI APIs + Pillow, and upload the results back to the Phoenix API
as task output files.
"""

import base64
import io
import re
from typing import Any

import httpx
import structlog
from PIL import Image, ImageEnhance, ImageFilter

from app import llm
from app.tools.registry import RunContext, tool

log = structlog.get_logger()


async def _download(url: str) -> bytes:
    """Download a file from a presigned URL."""
    async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        return resp.content


@tool("analyze_file")
async def analyze_file(params: dict[str, Any], ctx: RunContext) -> Any:
    """Analyze any file (image, document) using GPT-4 Vision and return a text description."""
    question = params.get("question") or ctx.task_description or "Describe this file in detail."
    file_url = params.get("file_url")

    if not file_url:
        return {"analysis": "", "error": "No file URL provided. Ensure a file is attached to the task."}

    if not llm.is_configured():
        return {"analysis": "(offline mode — cannot analyze file)", "note": "offline fallback"}

    analysis = await llm.vision(
        system="You are a helpful assistant. Analyze the provided file/image and answer the user's question thoroughly. Reply in the same language as the question.",
        user_text=question,
        image_url=file_url,
        usage=ctx.usage,
        max_tokens=1500,
    )
    return {"analysis": analysis, "file_url": file_url}


@tool("transform_image")
async def transform_image(params: dict[str, Any], ctx: RunContext) -> Any:
    """Transform/modify an image based on instructions. Supports color changes, filters,
    adjustments, format conversion, and creative modifications via DALL-E."""
    instruction = params.get("instruction") or ctx.task_description or ""
    file_url = params.get("file_url")

    if not file_url:
        return {"error": "No image URL provided. Ensure an image file is attached to the task."}

    if not llm.is_configured():
        return {"error": "OpenAI API key required for image processing.", "note": "offline fallback"}

    try:
        image_bytes = await _download(file_url)
    except Exception as exc:
        return {"error": f"Could not download the image: {exc}"}

    img = Image.open(io.BytesIO(image_bytes))
    original_format = img.format or "PNG"

    plan = await llm.chat_json(
        system="""You decide HOW to process an image. Given the user instruction, respond with a JSON object:
{"method": "pillow"|"dalle", "pillow_ops": [...], "dalle_prompt": "...", "output_format": "PNG"|"JPEG"}

pillow_ops is an array of operations (only when method=pillow):
- {"op": "colorize", "hue_shift": int} — shift hue by degrees (0-360)
- {"op": "tint", "color": "#RRGGBB"} — apply a color tint/overlay
- {"op": "grayscale"}
- {"op": "brightness", "factor": float} — 1.0 = original, >1 brighter
- {"op": "contrast", "factor": float}
- {"op": "blur", "radius": int}
- {"op": "sharpen"}
- {"op": "resize", "width": int, "height": int}
- {"op": "rotate", "degrees": int}
- {"op": "flip", "direction": "horizontal"|"vertical"}

Use method=pillow for deterministic changes (color shift, resize, rotate, filters).
Use method=dalle ONLY for creative changes that require generating new content.
For color changes like "make it green/blue/red", always use pillow with colorize or tint.""",
        user=f"Instruction: {instruction}\nImage size: {img.size}\nImage mode: {img.mode}",
        usage=ctx.usage,
        max_tokens=400,
    )

    method = plan.get("method", "pillow")
    output_format = plan.get("output_format", original_format).upper()
    if output_format not in ("PNG", "JPEG", "WEBP"):
        output_format = "PNG"

    result_bytes: bytes | None = None
    description = ""

    if method == "pillow":
        ops = plan.get("pillow_ops") or []
        processed = img.copy()
        if processed.mode not in ("RGB", "RGBA"):
            processed = processed.convert("RGBA")

        applied: list[str] = []
        for op_spec in ops:
            op = op_spec.get("op", "")
            try:
                if op in ("colorize", "tint"):
                    color_hex = op_spec.get("color", "#00FF00")
                    hue_shift = op_spec.get("hue_shift", 0)

                    if hue_shift and not op_spec.get("color"):
                        hsv = processed.convert("HSV")
                        h, s, v = hsv.split()
                        h = h.point(lambda p, hs=hue_shift: (p + hs) % 256)
                        processed = Image.merge("HSV", (h, s, v)).convert(processed.mode)
                        applied.append(f"hue shifted by {hue_shift}°")
                    else:
                        if color_hex.startswith("#") and len(color_hex) >= 7:
                            r = int(color_hex[1:3], 16)
                            g = int(color_hex[3:5], 16)
                            b = int(color_hex[5:7], 16)
                        else:
                            r, g, b = 0, 255, 0
                        overlay = Image.new("RGBA", processed.size, (r, g, b, 80))
                        if processed.mode == "RGBA":
                            processed = Image.alpha_composite(processed, overlay)
                        else:
                            processed = Image.blend(
                                processed.convert("RGBA"),
                                Image.new("RGBA", processed.size, (r, g, b, 255)),
                                0.3,
                            )
                        applied.append(f"tinted with {color_hex}")

                elif op == "grayscale":
                    processed = processed.convert("L").convert(processed.mode)
                    applied.append("converted to grayscale")
                elif op == "brightness":
                    factor = float(op_spec.get("factor", 1.2))
                    processed = ImageEnhance.Brightness(processed).enhance(factor)
                    applied.append(f"brightness ×{factor}")
                elif op == "contrast":
                    factor = float(op_spec.get("factor", 1.2))
                    processed = ImageEnhance.Contrast(processed).enhance(factor)
                    applied.append(f"contrast ×{factor}")
                elif op == "blur":
                    radius = int(op_spec.get("radius", 2))
                    processed = processed.filter(ImageFilter.GaussianBlur(radius))
                    applied.append(f"blur radius {radius}")
                elif op == "sharpen":
                    processed = processed.filter(ImageFilter.SHARPEN)
                    applied.append("sharpened")
                elif op == "resize":
                    w = int(op_spec.get("width", processed.width))
                    h = int(op_spec.get("height", processed.height))
                    processed = processed.resize((w, h), Image.LANCZOS)
                    applied.append(f"resized to {w}×{h}")
                elif op == "rotate":
                    degrees = int(op_spec.get("degrees", 90))
                    processed = processed.rotate(degrees, expand=True)
                    applied.append(f"rotated {degrees}°")
                elif op == "flip":
                    direction = op_spec.get("direction", "horizontal")
                    if direction == "horizontal":
                        processed = processed.transpose(Image.FLIP_LEFT_RIGHT)
                    else:
                        processed = processed.transpose(Image.FLIP_TOP_BOTTOM)
                    applied.append(f"flipped {direction}")
            except Exception as e:
                log.warning("pillow_op_failed", op=op, error=str(e))

        buf = io.BytesIO()
        save_mode = "RGB" if output_format == "JPEG" else processed.mode
        processed.convert(save_mode).save(buf, format=output_format)
        result_bytes = buf.getvalue()
        description = f"Applied: {', '.join(applied) if applied else 'no changes'}."

    elif method == "dalle":
        dalle_prompt = plan.get("dalle_prompt") or f"Based on the original image: {instruction}"
        url = await llm.generate_image(dalle_prompt, usage=ctx.usage)
        if url:
            result_bytes = await _download(url)
            description = f"Generated new image via DALL-E: {dalle_prompt[:100]}"
        else:
            return {"error": "DALL-E image generation failed. Try rephrasing the instruction."}

    if result_bytes is None:
        return {"error": "Image processing produced no output."}

    ext = output_format.lower()
    mime = f"image/{ext}"
    original_name = params.get("original_filename") or "image"
    clean_name = re.sub(r"\.[^.]+$", "", original_name)
    filename = f"{clean_name}-modified.{ext}"

    if ctx.phoenix:
        saved = await ctx.phoenix.save_task_output(
            ctx.workspace_id,
            ctx.task_id,
            filename,
            base64.b64encode(result_bytes).decode(),
            mime_type=mime,
            encoding="base64",
        )
        if saved:
            return {"filename": filename, "description": description, "size_bytes": len(result_bytes)}

    return {"error": "Could not save the processed image."}


@tool("transcribe_audio")
async def transcribe_audio(params: dict[str, Any], ctx: RunContext) -> Any:
    """Transcribe an audio file using OpenAI Whisper."""
    file_url = params.get("file_url")

    if not file_url:
        return {"error": "No audio file URL provided."}

    if not llm.is_configured():
        return {"transcript": "", "error": "OpenAI API key required.", "note": "offline fallback"}

    try:
        audio_bytes = await _download(file_url)
    except Exception as exc:
        return {"error": f"Could not download the audio: {exc}"}

    filename = params.get("original_filename") or "audio.mp3"
    transcript = await llm.transcribe_audio_data(audio_bytes, filename, usage=ctx.usage)

    if ctx.phoenix and transcript:
        clean_name = re.sub(r"\.[^.]+$", "", filename)
        out_filename = f"{clean_name}-transcript.txt"
        await ctx.phoenix.save_task_output(
            ctx.workspace_id,
            ctx.task_id,
            out_filename,
            transcript,
            mime_type="text/plain",
        )

    return {"transcript": transcript, "filename": filename}


@tool("extract_document_text")
async def extract_document_text(params: dict[str, Any], ctx: RunContext) -> Any:
    """Extract text content from a document (PDF, etc.) for further processing."""
    file_url = params.get("file_url")

    if not file_url:
        return {"error": "No document URL provided."}

    try:
        doc_bytes = await _download(file_url)
    except Exception as exc:
        return {"error": f"Could not download the document: {exc}"}

    filename = params.get("original_filename") or "document"
    text = ""

    try:
        import fitz  # PyMuPDF — optional dependency

        doc = fitz.open(stream=doc_bytes, filetype="pdf")
        pages = []
        for page in doc:
            pages.append(page.get_text())
        text = "\n\n".join(pages)
        doc.close()
    except ImportError:
        try:
            text = doc_bytes.decode("utf-8", errors="replace")
        except Exception:
            if llm.is_configured():
                img_url = f"data:application/octet-stream;base64,{base64.b64encode(doc_bytes).decode()}"
                text = await llm.vision(
                    system="Extract all visible text from this document image.",
                    user_text="Extract all text from this document.",
                    image_url=img_url,
                    usage=ctx.usage,
                )
    except Exception:
        try:
            text = doc_bytes.decode("utf-8", errors="replace")
        except Exception:
            return {"error": "Could not extract text from the document."}

    return {"text": text[:10000], "filename": filename, "char_count": len(text)}
