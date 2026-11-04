import { RotateCw, Copy, Trash2, SlidersHorizontal, X } from "lucide-react";
import { StandObject } from "../types";
export default function QuickActions({
  object,
  onRotate,
  onDuplicate,
  onRemove,
  onDetails,
  onClose,
}: {
  object: StandObject;
  onRotate: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onDetails: () => void;
  onClose: () => void;
}) {
  return (
    <section className="quick-actions" aria-label="Selected item actions">
      <div className="quick-item-name">
        <strong>{object.name}</strong>
        <small>
          {object.width} × {object.depth} m{object.locked ? " · Locked" : ""}
        </small>
      </div>
      <div className="quick-buttons">
        <button disabled={object.locked} onClick={onRotate}>
          <RotateCw size={20} />
          <span>Rotate</span>
        </button>
        <button onClick={onDuplicate}>
          <Copy size={20} />
          <span>Duplicate</span>
        </button>
        <button onClick={onRemove}>
          <Trash2 size={20} />
          <span>Remove</span>
        </button>
        <button onClick={onDetails}>
          <SlidersHorizontal size={20} />
          <span>Details</span>
        </button>
        <button aria-label="Deselect item" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
    </section>
  );
}
