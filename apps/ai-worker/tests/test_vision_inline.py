"""Vision URL rewriting: private MinIO hosts become data URLs."""

import asyncio

from app.llm import _as_vision_image_url, _is_private_image_host
from app.agents.direct_chat import _pdf_pages_needing_vision


def test_private_hosts_detected():
    assert _is_private_image_host("http://localhost:9000/bucket/key")
    assert _is_private_image_host("http://127.0.0.1:9000/x")
    assert _is_private_image_host("http://minio:9000/x")
    assert _is_private_image_host("http://10.0.0.5/x")
    assert not _is_private_image_host("https://cdn.openai.com/image.png")
    assert not _is_private_image_host("https://s3.amazonaws.com/bucket/key")


def test_as_vision_image_url_from_bytes():
    png = (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01"
        b"\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00"
        b"\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18"
        b"\xd8N\x00\x00\x00\x00IEND\xaeB`\x82"
    )

    async def run():
        url = await _as_vision_image_url(
            "http://localhost:9000/x.png",
            image_bytes=png,
            mime_type="image/png",
        )
        assert url.startswith("data:image/png;base64,")
        assert len(url) > 40

    asyncio.run(run())


def test_pdf_pages_needing_vision_empty_pdf():
    # Minimal empty-ish PDF with no images → no vision pages
    from tests.test_extractors import make_pdf

    data = make_pdf(["Hello world page without images."])
    assert _pdf_pages_needing_vision(data) == []
