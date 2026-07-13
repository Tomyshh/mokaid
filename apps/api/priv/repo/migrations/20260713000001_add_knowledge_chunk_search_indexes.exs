defmodule Mokaid.Repo.Migrations.AddKnowledgeChunkSearchIndexes do
  @moduledoc """
  Retrieval quality indexes for the RAG pipeline:

  - HNSW index on chunk embeddings (better recall/latency than IVFFlat and
    no training step, so it works on small and growing collections alike).
  - GIN full-text expression index powering the lexical half of hybrid
    search ('simple' config: agent knowledge is multilingual, stemming for a
    single language would hurt).
  """

  use Ecto.Migration

  def up do
    execute """
    CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_hnsw_idx
    ON knowledge_chunks
    USING hnsw (embedding vector_cosine_ops)
    """

    execute """
    CREATE INDEX IF NOT EXISTS knowledge_chunks_content_fts_idx
    ON knowledge_chunks
    USING gin (to_tsvector('simple', content))
    """
  end

  def down do
    execute "DROP INDEX IF EXISTS knowledge_chunks_embedding_hnsw_idx"
    execute "DROP INDEX IF EXISTS knowledge_chunks_content_fts_idx"
  end
end
