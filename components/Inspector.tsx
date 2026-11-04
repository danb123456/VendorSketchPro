import { useState } from "react";
import {
  Copy,
  Trash2,
  X,
  LockKeyhole,
  Unlock,
  RotateCw,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { StandObject, Plan } from "../types";
import { round } from "../lib/model";
function NumberField({
  label,
  value,
  min = 0.1,
  max = 100,
  step = 0.1,
  onChange,
  disabled = false,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (n: number) => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState(String(value)),
    [invalid, setInvalid] = useState(false);
  const [previous, setPrevious] = useState(value);
  if (value !== previous) {
    setPrevious(value);
    setText(String(value));
    setInvalid(false);
  }
  const submit = () => {
    const n = Number(text);
    if (text.trim() === "" || !Number.isFinite(n) || n < min || n > max) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    if (n !== value) onChange(n);
  };
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        step={step}
        min={min}
        max={max}
        value={text}
        disabled={disabled}
        aria-invalid={invalid}
        onChange={(e) => {
          setText(e.target.value);
          setInvalid(false);
        }}
        onBlur={submit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
      />
      {invalid && (
        <small className="field-error">
          Enter {min} to {max}.
        </small>
      )}
    </label>
  );
}
export { NumberField };
export default function Inspector({
  object,
  plan,
  onChange,
  onDuplicate,
  onDelete,
  onClose,
}: {
  object: StandObject;
  plan: Plan;
  onChange: (updates: Partial<StandObject>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const o = object,
    nudge = (dx: number, dy: number) =>
      onChange({ x: round(o.x + dx), y: round(o.y + dy) });
  return (
    <div className="inspector-content">
      <div className="panel-title">
        <div>
          <span className="eyebrow">
            ITEM {plan.objects.findIndex((v) => v.id === o.id) + 1}
          </span>
          <h2>Item properties</h2>
        </div>
        <button
          className="icon-button"
          aria-label="Close item properties"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>
      <label className="field">
        <span>Item name</span>
        <input
          key={`${o.id}-${o.name}`}
          maxLength={70}
          defaultValue={o.name}
          onBlur={(e) => {
            const name = e.target.value.trim();
            if (name && name !== o.name) onChange({ name });
            else e.target.value = o.name;
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
        />
      </label>
      <p className="hint">
        {o.type} · Check dimensions against your actual equipment.
      </p>
      <div className="field-grid">
        <NumberField
          key={`${o.id}-w`}
          label="Width (m)"
          value={o.width}
          onChange={(width) => onChange({ width })}
          disabled={o.locked}
        />
        <NumberField
          key={`${o.id}-d`}
          label="Depth (m)"
          value={o.depth}
          onChange={(depth) => onChange({ depth })}
          disabled={o.locked}
        />
      </div>
      <div className="field-grid">
        <NumberField
          key={`${o.id}-x`}
          label="From left edge (m)"
          value={o.x}
          min={-100}
          onChange={(x) => onChange({ x })}
          disabled={o.locked}
        />
        <NumberField
          key={`${o.id}-y`}
          label="From back edge (m)"
          value={o.y}
          min={-100}
          onChange={(y) => onChange({ y })}
          disabled={o.locked}
        />
      </div>
      <div className="rotate-row">
        <NumberField
          key={`${o.id}-r`}
          label="Rotation (°)"
          value={o.rotation}
          min={-360}
          max={360}
          step={1}
          onChange={(rotation) => onChange({ rotation })}
          disabled={o.locked}
        />
        <button
          className="secondary"
          disabled={o.locked}
          onClick={() => onChange({ rotation: (o.rotation + 90) % 360 })}
        >
          <RotateCw size={16} />
          90°
        </button>
      </div>
      <div className="nudge-row">
        <span className="field-label">Move by 0.1 m</span>
        <div>
          {[
            [ArrowLeft, -0.1, 0, "Move left"],
            [ArrowUp, 0, -0.1, "Move up"],
            [ArrowDown, 0, 0.1, "Move down"],
            [ArrowRight, 0.1, 0, "Move right"],
          ].map(([Icon, dx, dy, label]) => {
            const I = Icon as typeof ArrowLeft;
            return (
              <button
                className="icon-button"
                key={String(label)}
                aria-label={String(label)}
                disabled={o.locked}
                onClick={() => nudge(Number(dx), Number(dy))}
              >
                <I size={17} />
              </button>
            );
          })}
        </div>
      </div>
      <NumberField
        key={`${o.id}-clear`}
        label="Working clearance around item (m)"
        min={0}
        max={10}
        value={o.clearance}
        onChange={(clearance) => onChange({ clearance })}
      />
      <p className="hint">
        Optional guide for doors, staff or servicing. Use equipment-specific
        requirements.
      </p>
      <label className="field">
        <span>Equipment notes</span>
        <textarea
          key={`${o.id}-${o.notes}`}
          rows={2}
          defaultValue={o.notes}
          maxLength={1000}
          placeholder="Model, door opening, power needs…"
          onBlur={(e) => {
            if (e.target.value !== o.notes) onChange({ notes: e.target.value });
          }}
        />
      </label>
      <div className="item-actions">
        <button className="secondary" onClick={onDuplicate}>
          <Copy size={16} />
          Duplicate
        </button>
        <button
          className="secondary"
          onClick={() => onChange({ locked: !o.locked })}
        >
          {o.locked ? <LockKeyhole size={16} /> : <Unlock size={16} />}
          {o.locked ? "Unlock" : "Lock"}
        </button>
      </div>
      <button className="danger subtle full" onClick={onDelete}>
        <Trash2 size={16} />
        Remove item
      </button>
    </div>
  );
}
