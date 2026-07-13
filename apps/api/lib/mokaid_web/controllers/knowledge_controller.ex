defmodule MokaidWeb.KnowledgeController do
  use MokaidWeb, :controller

  alias Mokaid.Knowledge
  alias MokaidWeb.JSON, as: Serializer

  def index(conn, params) do
    with :ok <- Permissions.authorize(current_member(conn), "knowledge.view") do
      items = Knowledge.list_items(workspace_id(conn), params)
      counts = Knowledge.counts(workspace_id(conn))

      json(conn, %{data: Enum.map(items, &Serializer.knowledge_item/1), meta: %{counts: counts}})
    end
  end

  def categories(conn, _params) do
    with :ok <- Permissions.authorize(current_member(conn), "knowledge.view") do
      categories = Knowledge.list_categories(workspace_id(conn))
      json(conn, %{data: Enum.map(categories, &Serializer.knowledge_category/1)})
    end
  end

  def create(conn, params) do
    with :ok <- Permissions.authorize(current_member(conn), "knowledge.upload"),
         {:ok, item} <- Knowledge.create_item(workspace_id(conn), params, current_member(conn)) do
      conn
      |> put_status(:created)
      |> json(%{data: Serializer.knowledge_item(item)})
    end
  end

  @doc """
  Multipart file upload into the knowledge base. Each file is stored
  (S3/MinIO) and indexed: text formats inline, binary formats (PDF, DOCX,
  XLSX, PPTX…) asynchronously via the AI worker's extractors. Falls back to
  a plain JSON create when no file is attached.
  """
  def upload(conn, params) do
    uploads =
      (List.wrap(params["files"] || params["file"]))
      |> Enum.filter(&match?(%Plug.Upload{}, &1))

    if uploads == [] do
      create(conn, params)
    else
      with :ok <- Permissions.authorize(current_member(conn), "knowledge.upload") do
        items =
          uploads
          |> Enum.flat_map(fn upload ->
            case Knowledge.create_from_upload(
                   workspace_id(conn),
                   upload,
                   current_member(conn),
                   agent_id: presence(params["agent_id"]),
                   project_id: presence(params["project_id"]),
                   category_id: presence(params["category_id"])
                 ) do
              {:ok, item} -> [Serializer.knowledge_item(item)]
              _ -> []
            end
          end)

        conn
        |> put_status(:created)
        |> json(%{data: items})
      end
    end
  end

  defp presence(value) when is_binary(value) and value != "", do: value
  defp presence(_), do: nil

  def show(conn, %{"id" => id}) do
    with :ok <- Permissions.authorize(current_member(conn), "knowledge.view"),
         %{} = item <- Knowledge.get_item(workspace_id(conn), id) do
      json(conn, %{data: Serializer.knowledge_item(item)})
    end
  end

  def update(conn, %{"id" => id} = params) do
    with :ok <- Permissions.authorize(current_member(conn), "knowledge.update"),
         %{} = item <- Knowledge.get_item(workspace_id(conn), id),
         {:ok, updated} <- Knowledge.update_item(item, params) do
      json(conn, %{data: Serializer.knowledge_item(updated)})
    end
  end
end
