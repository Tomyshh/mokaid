from app.memory import ingestion
from app.memory.ingestion import chunk_text, contextualize, ingest_document
from tests.test_extractors import make_docx, make_xlsx


def test_chunk_text_empty():
    assert chunk_text("") == []


def test_chunk_text_respects_size():
    text = "phrase courte. " * 500
    chunks = chunk_text(text, size=1200, overlap=150)
    assert len(chunks) > 1
    assert all(len(c) <= 1200 for c in chunks)
    # Recursive splitter cuts on sentence boundaries, not mid-word.
    assert all(c.strip() for c in chunks)


def test_chunk_text_splits_on_markdown_headings():
    sections = [f"## Section {i}\n\n" + ("contenu de la section. " * 30) for i in range(5)]
    chunks = chunk_text("\n\n".join(sections), size=800, overlap=100)
    # Structure-aware: heading markers survive at chunk starts.
    heading_starts = [c for c in chunks if c.lstrip().startswith("## Section")]
    assert len(heading_starts) >= 3


def test_contextualize_prefixes_title():
    chunks = ["premier fragment", "second fragment"]
    enriched = contextualize(chunks, "Comptes Q3 2026")
    assert enriched[0].startswith("[Document: Comptes Q3 2026]\n")
    assert enriched[1].endswith("second fragment")
    # No title: unchanged.
    assert contextualize(chunks, None) == chunks
    assert contextualize(chunks, "  ") == chunks


async def test_ingest_document_returns_stats():
    result = await ingest_document({"knowledge_item_id": "k-1", "text": "hello " * 500})
    assert result["knowledge_item_id"] == "k-1"
    assert result["chunk_count"] > 0
    assert result["status"] == "chunked"


class RecordingPhoenix:
    def __init__(self) -> None:
        self.failed: list[tuple[str, str]] = []
        self.chunks: list[dict] = []

    async def mark_knowledge_failed(self, item_id, workspace_id, error):
        self.failed.append((item_id, error))
        return True

    async def post_knowledge_chunks(self, item_id, workspace_id, chunks):
        self.chunks.append({"item_id": item_id, "chunks": chunks})
        return True


async def test_ingest_document_from_file_url_docx(monkeypatch):
    """Binary knowledge item: download from presigned URL, extract, chunk."""
    docx_bytes = make_docx()

    async def fake_download(url: str) -> bytes:
        assert url == "https://s3/presigned/contrat.docx"
        return docx_bytes

    monkeypatch.setattr(ingestion, "_download", fake_download)
    result = await ingest_document(
        {
            "knowledge_item_id": "k-docx",
            "workspace_id": "ws-1",
            "file_url": "https://s3/presigned/contrat.docx",
            "filename": "contrat.docx",
            "title": "Contrat de prestation",
        }
    )
    assert result["status"] == "chunked"  # offline: embeddings skipped
    assert result["chunk_count"] >= 1


async def test_ingest_document_from_file_url_xlsx(monkeypatch):
    xlsx_bytes = make_xlsx()

    async def fake_download(url: str) -> bytes:
        return xlsx_bytes

    monkeypatch.setattr(ingestion, "_download", fake_download)
    result = await ingest_document(
        {
            "knowledge_item_id": "k-xlsx",
            "workspace_id": "ws-1",
            "file_url": "https://s3/presigned/comptes.xlsx",
            "filename": "comptes.xlsx",
        }
    )
    assert result["status"] == "chunked"
    assert result["chunk_count"] >= 1


async def test_ingest_document_marks_failed_on_unreadable_file(monkeypatch):
    async def fake_download(url: str) -> bytes:
        return b"\x89PNG\r\n\x1a\n" + bytes(range(256)) * 4

    monkeypatch.setattr(ingestion, "_download", fake_download)
    phoenix = RecordingPhoenix()
    result = await ingest_document(
        {
            "knowledge_item_id": "k-bad",
            "workspace_id": "ws-1",
            "file_url": "https://s3/presigned/image.png",
            "filename": "image.png",
        },
        phoenix=phoenix,
    )
    assert result["status"] == "failed"
    assert phoenix.failed and phoenix.failed[0][0] == "k-bad"


async def test_ingest_document_marks_failed_on_download_error(monkeypatch):
    async def fake_download(url: str) -> bytes:
        raise RuntimeError("403 Forbidden")

    monkeypatch.setattr(ingestion, "_download", fake_download)
    phoenix = RecordingPhoenix()
    result = await ingest_document(
        {
            "knowledge_item_id": "k-403",
            "workspace_id": "ws-1",
            "file_url": "https://s3/expired",
            "filename": "doc.pdf",
        },
        phoenix=phoenix,
    )
    assert result["status"] == "failed"
    assert "download failed" in result["error"]
    assert phoenix.failed
