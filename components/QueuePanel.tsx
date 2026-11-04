import {
  ArrowUp,
  CornerDownRight,
  Trash2,
  Plus,
  MousePointer2,
} from "lucide-react";
import { Plan } from "../types";
import { capacity, queueLength, queueTemplate, round } from "../lib/model";
import { NumberField } from "./Inspector";
export default function QueuePanel({
  plan,
  onChange,
  routeEdit,
  setRouteEdit,
}: {
  plan: Plan;
  onChange: (p: Plan) => void;
  routeEdit: boolean;
  setRouteEdit: (v: boolean) => void;
}) {
  const p = plan,
    q = p.queue;
  const update = (patch: Partial<typeof q>) =>
    onChange({ ...p, queue: { ...q, ...patch } });
  const template = (
    type: "straight" | "serpentine" | "serpentine-horizontal",
  ) => {
    update({ points: queueTemplate(p, type), template: type });
    setRouteEdit(false);
  };
  return (
    <div className="inspector-content">
      <span className="eyebrow">STEP 03</span>
      <h2>Plan the queue</h2>
      <p className="panel-description">
        Keep customers in the shaded zone in front of your stand, within your
        frontage.
      </p>
      <div className="notice">
        Queue space is a planning request. The organiser will confirm available
        space.
      </div>
      <div className="field-grid">
        <NumberField
          label="Queue zone depth (m)"
          value={q.depth}
          onChange={(depth) => update({ depth })}
        />
        <NumberField
          label="Lane width (m)"
          value={q.laneWidth}
          onChange={(laneWidth) => update({ laneWidth })}
        />
      </div>
      <span className="field-label">Start with a route</span>
      <div className="template-grid">
        <button
          className={q.template === "straight" ? "template active" : "template"}
          onClick={() => template("straight")}
        >
          <ArrowUp size={28} />
          <strong>Straight</strong>
          <small>One clear line</small>
        </button>
        <button
          className={
            q.template === "serpentine" ? "template active" : "template"
          }
          onClick={() => template("serpentine")}
        >
          <CornerDownRight size={28} />
          <strong>Serpentine</strong>
          <small>Front-to-back lanes</small>
        </button>
        <button
          className={
            q.template === "serpentine-horizontal"
              ? "template active"
              : "template"
          }
          onClick={() => template("serpentine-horizontal")}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 23h17a3 3 0 0 0 0-6H7a3 3 0 0 1 0-6h17M20 7l4 4-4 4" />
          </svg>
          <strong>Left to right</strong>
          <small>Serpentine lanes</small>
        </button>
      </div>
      <button
        className={`secondary full ${routeEdit ? "active" : ""}`}
        onClick={() => setRouteEdit(!routeEdit)}
      >
        <MousePointer2 size={16} />
        {routeEdit ? "Finish editing route" : "Draw / edit route"}
      </button>
      {routeEdit && (
        <p className="hint">
          Click the queue zone to append a point. Drag the numbered points to
          adjust. Use the fields below for precise, drag-free editing.
        </p>
      )}
      <div className="capacity-card">
        <span>Estimated waiting capacity</span>
        <strong>
          {capacity(p)} <small>people</small>
        </strong>
        <div>
          {round(queueLength(q.points))} m route · target {q.target}
        </div>
      </div>
      <details className="settings-details">
        <summary>Capacity assumptions</summary>
        <NumberField
          label="Planning target (people waiting)"
          min={1}
          max={10000}
          step={1}
          value={q.target}
          onChange={(target) => update({ target: Math.round(target) })}
        />
        <NumberField
          label="Spacing along route (m / person)"
          value={q.personSpacing}
          onChange={(personSpacing) => update({ personSpacing })}
        />
        <p className="hint">
          Estimate = route length ÷ spacing. This does not assess crowd flow or
          confirm safe capacity. Adjust with your organiser.
        </p>
      </details>
      {q.points.length > 0 && (
        <details className="settings-details">
          <summary>Edit route coordinates ({q.points.length} points)</summary>
          {q.points.map((point, i) => (
            <div className="route-point" key={i}>
              <span>{i + 1}</span>
              <NumberField
                label="Left (m)"
                min={0}
                value={point.x}
                onChange={(x) =>
                  update({
                    template: "custom",
                    points: q.points.map((v, j) => (j === i ? { ...v, x } : v)),
                  })
                }
              />
              <NumberField
                label="Back (m)"
                min={0}
                value={point.y}
                onChange={(y) =>
                  update({
                    template: "custom",
                    points: q.points.map((v, j) => (j === i ? { ...v, y } : v)),
                  })
                }
              />
              <button
                className="icon-button"
                aria-label={`Remove route point ${i + 1}`}
                onClick={() =>
                  update({
                    template: "custom",
                    points: q.points.filter((_, j) => j !== i),
                  })
                }
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </details>
      )}
      <button
        className="secondary full"
        disabled={q.points.length >= 200}
        onClick={() => {
          update({
            template: "custom",
            points: [...q.points, { x: p.width / 2, y: p.depth + q.depth / 2 }],
          });
          setRouteEdit(true);
        }}
      >
        <Plus size={16} />
        Add route point
      </button>
      <button
        className="subtle full"
        disabled={!q.points.length}
        onClick={() => update({ points: [], template: "none" })}
      >
        <Trash2 size={16} />
        Clear route
      </button>
      <p className="hint">
        Route arrows point towards service. Use the item library to add physical
        barriers and collection points.
      </p>
    </div>
  );
}
