defmodule Mokaid.Knowledge.Workers.IngestionWorker do
  @moduledoc """
  Sends a knowledge item to the AI worker for text extraction (binary files),
  chunking and embedding. Items with an inline `body` are sent as text; items
  linked to a stored file (PDF, DOCX, XLSX, PPTX…) are sent as a presigned
  URL that the worker downloads and extracts. The worker posts the embedded
  chunks back to `/api/worker/knowledge/:id/chunks` (or marks the item failed
  via `/api/worker/knowledge/:id/failed`).
  """

  use Oban.Worker, queue: :ingestion, max_attempts: 3

  alias Mokaid.Knowledge
  alias Mokaid.Repo

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"knowledge_item_id" => item_id, "workspace_id" => workspace_id}}) do
    config = Application.fetch_env!(:mokaid, :ai_worker)

    case Knowledge.get_item(workspace_id, item_id) do
      nil ->
        {:cancel, :item_not_found}

      item ->
        case build_payload(item) do
          {:ok, payload} ->
            dispatch(config[:dispatch], payload, config, item)

          {:error, :nothing_to_ingest} ->
            {:cancel, :no_text_to_ingest}

          {:error, reason} ->
            Knowledge.mark_failed(item, "could not access stored file: #{inspect(reason)}")
            {:cancel, reason}
        end
    end
  end

  defp build_payload(item) do
    base = %{
      knowledge_item_id: item.id,
      workspace_id: item.workspace_id,
      title: item.title
    }

    cond do
      item.body not in [nil, ""] ->
        {:ok, Map.put(base, :text, item.body)}

      storage = file_storage(item) ->
        case Mokaid.Storage.download_url(storage.storage_key) do
          {:ok, url} ->
            {:ok,
             Map.merge(base, %{
               file_url: url,
               filename: storage.filename,
               mime_type: storage.mime_type
             })}

          {:error, reason} ->
            {:error, reason}
        end

      true ->
        {:error, :nothing_to_ingest}
    end
  end

  # Resolve the stored blob behind the item: direct file upload or drive item.
  defp file_storage(item) do
    item = Repo.preload(item, [:file, :drive_item])

    cond do
      item.file && item.file.storage_key ->
        %{
          storage_key: item.file.storage_key,
          filename: item.file.file_name || item.title,
          mime_type: item.file.mime_type
        }

      item.drive_item && item.drive_item.storage_key ->
        %{
          storage_key: item.drive_item.storage_key,
          filename: item.drive_item.name || item.title,
          mime_type: item.drive_item.mime_type
        }

      true ->
        nil
    end
  end

  # Tests / offline mode: do not hit the network; leave the item untouched.
  defp dispatch(:none, _payload, _config, _item), do: {:cancel, :ai_worker_disabled}

  defp dispatch(:sqs, payload, config, item) do
    queue_url = config[:sqs_queue_url]

    if blank?(queue_url) do
      Knowledge.mark_failed(item, "AI worker SQS queue URL is not configured")
      {:cancel, :sqs_not_configured}
    else
      queue_url
      |> ExAws.SQS.send_message(Jason.encode!(Map.put(payload, :type, "ingest")))
      |> ExAws.request()
      |> case do
        {:ok, _} -> :ok
        {:error, reason} -> {:error, inspect(reason)}
      end
    end
  end

  defp dispatch(:http, payload, config, item) do
    url = config[:url]

    if blank?(url) or not String.contains?(to_string(url), "://") do
      Knowledge.mark_failed(item, "AI worker URL is not configured")
      {:cancel, :ai_worker_url_missing}
    else
      case Req.post(
             url: "#{url}/ingest",
             json: payload,
             headers: [{"authorization", "Bearer #{config[:token]}"}],
             receive_timeout: 120_000,
             retry: false
           ) do
        {:ok, %{status: status}} when status in 200..299 ->
          :ok

        {:ok, %{status: status}} ->
          {:error, "ai worker returned #{status}"}

        {:error, reason} ->
          {:error, inspect(reason)}
      end
    end
  end

  # Unknown dispatch values fall back to HTTP (legacy).
  defp dispatch(_other, payload, config, item), do: dispatch(:http, payload, config, item)

  defp blank?(nil), do: true
  defp blank?(""), do: true
  defp blank?(_), do: false
end
