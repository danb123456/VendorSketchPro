import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Plan, PITCH_STORAGE_NOTE } from "../types";
import { validDimension } from "../lib/model";
import Modal from "./Modal";
export default function PitchSetup({
  plan,
  onSave,
  onClose,
}: {
  plan: Plan;
  onSave: (p: Plan) => void;
  onClose: () => void;
}) {
  const [width, setWidth] = useState(String(plan.width)),
    [depth, setDepth] = useState(String(plan.depth)),
    [confirmed, setConfirmed] = useState(plan.pitchConfirmed),
    [error, setError] = useState("");
  return (
    <Modal title="Confirm your pitch" onClose={onClose}>
      <p className="panel-description">
        Use the allocated dimensions from your Savour onboarding form. Your
        pitch is the space for your stand; the customer queue sits in front.
      </p>
      <div className="notice">
        The standard pitch is 7 m frontage × 5 m depth. Different pitch sizes
        are only available with written approval from the organiser.
      </div>
      <p className="hint">{PITCH_STORAGE_NOTE}</p>
      <div className="pitch-diagram">
        <div>
          <span>BACK OF STAND</span>
          <strong>
            {width || "—"} m × {depth || "—"} m
          </strong>
          <span>CUSTOMER-FACING FRONTAGE</span>
        </div>
        <small>Queue area is planned separately</small>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (
            !validDimension(Number(width)) ||
            !validDimension(Number(depth))
          ) {
            setError("Enter a frontage and depth between 0.1 and 100 metres.");
            return;
          }
          if (!confirmed) {
            setError("Confirm that these match your allocated pitch.");
            return;
          }
          onSave({
            ...plan,
            width: Number(width),
            depth: Number(depth),
            pitchConfirmed: true,
          });
        }}
      >
        <div className="field-grid">
          <label className="field">
            <span>Frontage / width (m)</span>
            <input
              type="number"
              min="0.1"
              max="100"
              step="0.1"
              required
              value={width}
              onChange={(e) => setWidth(e.target.value)}
            />
            <small>Side facing customers</small>
          </label>
          <label className="field">
            <span>Depth (m)</span>
            <input
              type="number"
              min="0.1"
              max="100"
              step="0.1"
              required
              value={depth}
              onChange={(e) => setDepth(e.target.value)}
            />
            <small>Front to back</small>
          </label>
        </div>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          <span>
            These dimensions match my allocated pitch. I understand this sketch
            does not guarantee space and the organiser may request changes.
          </span>
        </label>
        <p className="hint">
          Changing dimensions keeps your equipment. Anything that no longer fits
          will be highlighted.
        </p>
        {error && (
          <p role="alert" className="field-error">
            {error}
          </p>
        )}
        <button className="primary full" type="submit">
          Save pitch dimensions
          <ArrowRight size={17} />
        </button>
      </form>
    </Modal>
  );
}
