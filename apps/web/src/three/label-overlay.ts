/** Imperatively sync label DOM nodes with projected scene coordinates. */
export function applyLabelPositions(
  labels: Map<string, HTMLButtonElement>,
  positions: Map<string, { x: number; y: number; visible: boolean }>,
) {
  for (const [id, pos] of positions) {
    const el = labels.get(id);
    if (!el) continue;

    if (pos.visible) {
      el.style.left = `${pos.x}px`;
      el.style.top = `${pos.y - 8}px`;
      el.style.display = "flex";
    } else {
      el.style.display = "none";
    }
  }
}
