import {
  Check,
  AlertTriangle,
  ChevronRight,
  ClipboardCheck,
  FileDown,
  Plus,
} from "lucide-react";
import { Plan, Issue } from "../types";
import { capacity } from "../lib/model";
export default function ReviewPanel({
  plan,
  issues,
  step,
  onStep,
  onIssue,
  onExport,
  onPitch,
  onLibrary,
  onNotes,
}: {
  plan: Plan;
  issues: Issue[];
  step: number;
  onStep: (step: number) => void;
  onIssue: (i: Issue) => void;
  onExport: () => void;
  onPitch: () => void;
  onLibrary: () => void;
  onNotes: (s: string) => void;
}) {
  const checks = [
    {
      step: 1,
      label: "Confirm allocated pitch",
      done: plan.pitchConfirmed,
      detail: `${plan.width} m frontage × ${plan.depth} m depth`,
    },
    {
      step: 2,
      label: "Place equipment & access",
      done:
        plan.objects.some((o) => o.kind === "equipment") &&
        plan.objects.some((o) => o.type === "Staff access") &&
        plan.objects.some((o) => o.type === "Service counter"),
      detail: `${plan.objects.length} items on your plan`,
    },
    {
      step: 3,
      label: "Plan the customer queue",
      done: plan.queue.points.length > 1 && capacity(plan) >= plan.queue.target,
      detail: `${capacity(plan)} estimated / ${plan.queue.target} target`,
    },
  ];
  return (
    <div className="inspector-content">
      <span className="eyebrow">{step === 4 ? "STEP 03" : "YOUR PLAN"}</span>
      <h2>{step === 4 ? "Review & download" : "Make it event-ready"}</h2>
      <p className="panel-description">
        {step === 4
          ? "Check the details, download your PNG, then upload it in vendor onboarding."
          : "Work through these steps. Your progress saves as you go."}
      </p>
      <div className="checklist">
        {checks.map((c) => (
          <button
            key={c.step}
            onClick={() => (c.step === 1 ? onPitch() : onStep(c.step))}
          >
            <span className={`check-icon ${c.done ? "done" : ""}`}>
              {c.done ? <Check size={15} /> : c.step}
            </span>
            <span>
              <strong>{c.label}</strong>
              <small>{c.detail}</small>
            </span>
            <ChevronRight size={15} />
          </button>
        ))}
      </div>
      {!plan.objects.length && (
        <button className="secondary full" onClick={onLibrary}>
          <Plus size={17} />
          Add your first item
        </button>
      )}
      <div className="section-heading">
        <h3>Checks to review</h3>
        <span className="count-badge">{issues.length}</span>
      </div>
      {issues.length === 0 ? (
        <div className="notice success">
          <ClipboardCheck size={18} />
          All automated layout checks passed. Please review equipment sizes and
          access yourself.
        </div>
      ) : (
        <div className="issue-list">
          {issues.map((i) => (
            <button
              key={i.id}
              className={`issue ${i.severity}`}
              onClick={() => onIssue(i)}
            >
              <AlertTriangle size={16} />
              <span>{i.message}</span>
              <ChevronRight size={14} />
            </button>
          ))}
        </div>
      )}
      <label className="field">
        <span>Plan notes for the organiser</span>
        <textarea
          key={`${plan.id}-${plan.notes}`}
          rows={3}
          maxLength={3000}
          defaultValue={plan.notes}
          placeholder="Special requirements, queue exceptions, utilities…"
          onBlur={(e) => {
            if (e.target.value !== plan.notes) onNotes(e.target.value);
          }}
        />
      </label>
      <div className="notice">
        Automated checks flag basic layout issues. They do not approve your
        stand or assess fire safety or crowd flow.
      </div>
      <button className="primary full" onClick={onExport}>
        <FileDown size={17} />
        Preview & download
      </button>
    </div>
  );
}
