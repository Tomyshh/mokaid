defmodule Mokaid.Files do
  @moduledoc "Stored file blobs (S3/MinIO) with their metadata rows."

  alias Mokaid.Files.File, as: StoredFile
  alias Mokaid.Repo

  @doc """
  Uploads a `Plug.Upload` to object storage and records a `files` row.
  Returns the persisted file so callers can link it (knowledge items…).
  """
  def create_from_upload(workspace_id, %Plug.Upload{} = upload, member \\ nil) do
    with {:ok, stored} <- Mokaid.Storage.upload(workspace_id, upload) do
      %StoredFile{}
      |> StoredFile.changeset(%{
        workspace_id: workspace_id,
        storage_key: stored.storage_key,
        bucket: bucket(),
        file_name: upload.filename,
        mime_type: upload.content_type,
        size_bytes: stored.size_bytes,
        checksum: stored.checksum,
        uploaded_by_member_id: member && member.id
      })
      |> Repo.insert()
    end
  end

  defp bucket do
    Application.get_env(:mokaid, :storage, [])
    |> Keyword.get(:bucket_uploads, "mokaid-user-uploads-dev")
  end
end
