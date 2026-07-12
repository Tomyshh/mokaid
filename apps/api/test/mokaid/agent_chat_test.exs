defmodule Mokaid.AgentChatTest do
  use Mokaid.DataCase, async: true

  alias Mokaid.AgentChat
  alias Mokaid.Agents

  describe "detect_mission_kind/1" do
    test "classifies website requests" do
      assert AgentChat.detect_mission_kind("Créer un site internet pour la semaine") == "website"
      assert AgentChat.detect_mission_kind("Build a landing page") == "website"
    end

    test "classifies document and analysis requests" do
      assert AgentChat.detect_mission_kind("Rédige un rapport markdown") == "document"
      assert AgentChat.detect_mission_kind("Analyse ce fichier PDF") == "analysis"
    end

    test "falls back to general" do
      assert AgentChat.detect_mission_kind("Comment ça va ?") == "general"
    end
  end

  describe "post_agent_message/4" do
    test "persists the reply and accepts a stream_id for broadcast" do
      {workspace, _owner} = workspace_fixture()

      {:ok, agent} =
        Agents.create_agent(workspace.id, %{
          "kind" => "ai",
          "display_name" => "Alex",
          "ai_enabled" => true
        })

      assert {:ok, message} =
               AgentChat.post_agent_message(workspace.id, agent.id, "Voilà ton site",
                 stream_id: "stream-abc"
               )

      assert message.body == "Voilà ton site"
      assert message.author_kind == "agent"
    end
  end

  describe "deliver_task_output/4" do
    test "attaches drive file metadata to the chat message" do
      {workspace, _owner} = workspace_fixture()

      {:ok, agent} =
        Agents.create_agent(workspace.id, %{
          "kind" => "ai",
          "display_name" => "Alex",
          "ai_enabled" => true
        })

      outputs = [
        %{
          "drive_item_id" => Ecto.UUID.generate(),
          "name" => "landing.html",
          "mime_type" => "text/html",
          "size_bytes" => 1200
        }
      ]

      assert {:ok, message} =
               AgentChat.deliver_task_output(
                 workspace.id,
                 agent.id,
                 "Voilà ton site",
                 outputs
               )

      assert length(message.attachments) == 1
      assert hd(message.attachments)["name"] == "landing.html"
      assert hd(message.attachments)["mime_type"] == "text/html"
    end
  end
end
