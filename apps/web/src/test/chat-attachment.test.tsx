import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChatAttachmentView } from "@/components/chat/chat-attachment";

vi.mock("@/api/client", () => ({
  fetchDriveFileBlob: vi.fn(),
}));

vi.mock("@/components/modals/save-to-drive-modal", () => ({
  SaveToDriveModal: () => null,
}));

describe("ChatAttachmentView", () => {
  it("exposes an Open website action for HTML deliverables", () => {
    render(
      <ChatAttachmentView
        tone="agent"
        attachment={{
          drive_item_id: "drv-1",
          name: "landing.html",
          mime_type: "text/html",
          size_bytes: 2048,
        }}
      />,
    );

    expect(screen.getByText("landing.html")).toBeInTheDocument();
    expect(screen.getByText("Open website")).toBeInTheDocument();
    expect(screen.getByTitle("Open")).toBeInTheDocument();
  });

  it("shows file size for non-HTML attachments", () => {
    render(
      <ChatAttachmentView
        tone="agent"
        attachment={{
          drive_item_id: "drv-2",
          name: "notes.md",
          mime_type: "text/markdown",
          size_bytes: 512,
        }}
      />,
    );

    expect(screen.getByText("notes.md")).toBeInTheDocument();
    expect(screen.queryByText("Open website")).not.toBeInTheDocument();
    expect(screen.getByText("512 B")).toBeInTheDocument();
  });
});
