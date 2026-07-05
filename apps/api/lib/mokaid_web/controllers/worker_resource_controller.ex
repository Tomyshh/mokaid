defmodule MokaidWeb.WorkerResourceController do
  @moduledoc """
  Workspace resources exposed to the AI worker: semantic knowledge search,
  chunk storage after embedding, and task mutations performed by agents.
  """

  use MokaidWeb, :controller

  alias Mokaid.Agents
  alias Mokaid.Drive
  alias Mokaid.Knowledge
  alias Mokaid.Realtime
  alias Mokaid.Tasks

  def search_knowledge(conn, %{"workspace_id" => workspace_id, "embedding" => embedding} = params) do
    limit = min(params["limit"] || 5, 20)
    results = Knowledge.search_chunks(workspace_id, embedding, limit)

    json(conn, %{
      data:
        Enum.map(results, fn %{chunk: chunk, item_title: title, distance: distance} ->
          %{
            knowledge_item_id: chunk.knowledge_item_id,
            title: title,
            content: chunk.content,
            chunk_index: chunk.chunk_index,
            score: 1.0 - distance
          }
        end)
    })
  end

  def knowledge_chunks(conn, %{"id" => id, "workspace_id" => workspace_id, "chunks" => chunks}) do
    with %{} = item <- Knowledge.get_item(workspace_id, id) do
      entries =
        Enum.map(chunks, fn chunk ->
          %{
            content: chunk["content"],
            embedding: chunk["embedding"],
            metadata: chunk["metadata"] || %{}
          }
        end)

      {count, _} = Knowledge.replace_chunks(item, entries)
      {:ok, _item} = Knowledge.mark_indexed(item)

      json(conn, %{data: %{knowledge_item_id: item.id, chunk_count: count}})
    else
      nil ->
        conn
        |> put_status(:not_found)
        |> json(%{error: %{code: "not_found", message: "knowledge item not found"}})
    end
  end

  def update_task(conn, %{"id" => id, "workspace_id" => workspace_id} = params) do
    attrs = Map.take(params, ["status", "progress_percent", "description"])

    with %{} = task <- Tasks.get_task(workspace_id, id),
         {:ok, updated} <- Tasks.update_task(task, attrs) do
      json(conn, %{
        data: %{
          id: updated.id,
          status: updated.status,
          progress_percent: updated.progress_percent
        }
      })
    else
      nil ->
        conn
        |> put_status(:not_found)
        |> json(%{error: %{code: "not_found", message: "task not found"}})

      error ->
        error
    end
  end

  @doc """
  Posts a comment on a task as an agent (used for the conversational
  acknowledgement when a run starts). Broadcast in realtime by the context.
  """
  def create_comment(conn, %{"id" => id, "workspace_id" => workspace_id, "body" => body} = params) do
    with %{} = task <- Tasks.get_task(workspace_id, id) do
      agent =
        case params["agent_id"] || task.assigned_agent_id do
          nil -> nil
          agent_id -> Agents.get_agent(workspace_id, agent_id)
        end

      case Tasks.create_comment(task, %{"body" => body}, agent) do
        {:ok, comment} ->
          conn
          |> put_status(:created)
          |> json(%{data: %{id: comment.id, task_id: task.id}})

        error ->
          error
      end
    else
      nil ->
        conn
        |> put_status(:not_found)
        |> json(%{error: %{code: "not_found", message: "task not found"}})
    end
  end

  @doc """
  Saves a file produced by an agent (draft, report, transformed asset…) into
  the Drive, linked to the task, so users can see and download the output.
  Content is plain text by default; pass "encoding": "base64" for binaries.
  """
  def save_output(
        conn,
        %{"id" => id, "workspace_id" => workspace_id, "filename" => filename, "content" => content} =
          params
      ) do
    with %{} = task <- Tasks.get_task(workspace_id, id),
         {:ok, binary} <- decode_content(content, params["encoding"]),
         {:ok, stored} <- Mokaid.Storage.upload_content(workspace_id, filename, binary, params["mime_type"]) do
      agent = task.assigned_agent_id && Agents.get_agent(workspace_id, task.assigned_agent_id)
      outputs_folder = Drive.ensure_system_folder(workspace_id, "Agent Outputs")

      case Drive.create_file(
             workspace_id,
             %{
               "name" => filename,
               "parent_id" => outputs_folder.id,
               "mime_type" => params["mime_type"],
               "extension" => file_extension(filename),
               "size_bytes" => stored.size_bytes,
               "storage_key" => stored.storage_key,
               "checksum" => stored.checksum,
               "linked_task_id" => task.id,
               "linked_project_id" => task.project_id,
               "is_ai_readable" => true
             },
             agent
           ) do
        {:ok, item} ->
          Realtime.broadcast_workspace(workspace_id, "task.updated", %{task_id: task.id})

          conn
          |> put_status(:created)
          |> json(%{data: %{id: item.id, name: item.name, task_id: task.id}})

        error ->
          error
      end
    else
      nil ->
        conn
        |> put_status(:not_found)
        |> json(%{error: %{code: "not_found", message: "task not found"}})

      {:error, :invalid_encoding} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: %{code: "invalid_encoding", message: "content could not be decoded"}})

      error ->
        error
    end
  end

  defp decode_content(content, "base64") when is_binary(content) do
    case Base.decode64(content) do
      {:ok, binary} -> {:ok, binary}
      :error -> {:error, :invalid_encoding}
    end
  end

  defp decode_content(content, _encoding) when is_binary(content), do: {:ok, content}
  defp decode_content(_content, _encoding), do: {:error, :invalid_encoding}

  defp file_extension(filename) do
    case Path.extname(filename) do
      "." <> ext -> String.downcase(ext)
      _ -> nil
    end
  end

  def create_subtasks(conn, %{"id" => id, "workspace_id" => workspace_id, "subtasks" => subtasks}) do
    with %{} = task <- Tasks.get_task(workspace_id, id) do
      created =
        subtasks
        |> Enum.with_index()
        |> Enum.flat_map(fn {attrs, index} ->
          case Tasks.create_subtask(task, %{"title" => attrs["title"], "position" => index}) do
            {:ok, subtask} -> [%{id: subtask.id, title: subtask.title}]
            {:error, _} -> []
          end
        end)

      conn
      |> put_status(:created)
      |> json(%{data: created})
    else
      nil ->
        conn
        |> put_status(:not_found)
        |> json(%{error: %{code: "not_found", message: "task not found"}})
    end
  end
end
