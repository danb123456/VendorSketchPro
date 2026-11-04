import { ArrowRight } from "lucide-react";
import { Plan } from "../types";
import { Setup, starterPlan } from "../lib/builder";
import { Symbol } from "./Symbol";
import Modal from "./Modal";
export default function SetupPicker({
  plan,
  onChoose,
  onClose,
}: {
  plan: Plan;
  onChoose: (p: Plan) => void;
  onClose: () => void;
}) {
  return (
    <Modal title="Choose your starting point" onClose={onClose}>
      <p className="panel-description">
        Your {plan.width} × {plan.depth} m pitch is ready. Pick a setup, then
        make it yours.
      </p>
      <div className="setup-cards">
        {(
          [
            {
              key: "pergola",
              name: "Pergola 3 × 3 m",
              symbol: "tent",
              detail: "Start with a 3 × 3 m pergola",
            },
            {
              key: "pergola-4x3",
              name: "Pergola 4 × 3 m",
              symbol: "tent",
              detail: "Start with a 4 × 3 m pergola",
            },
            {
              key: "pergola-5x3",
              name: "Pergola 5 × 3 m",
              symbol: "tent",
              detail: "Start with a 5 × 3 m pergola",
            },
            {
              key: "truck",
              name: "Food truck",
              symbol: "truck",
              detail: "Start with a 2.5 × 6 m truck",
            },
            {
              key: "blank",
              name: "Build from scratch",
              symbol: "box",
              detail: "An empty pitch, ready for your ideas",
            },
          ] as const
        ).map((item) => (
          <button
            key={item.key}
            onClick={() => onChoose(starterPlan(plan, item.key as Setup))}
          >
            <span className="setup-illustration">
              <Symbol name={item.symbol} />
            </span>
            <span>
              <strong>{item.name}</strong>
              <small>{item.detail}</small>
            </span>
            <ArrowRight size={20} />
          </button>
        ))}
      </div>
      <p className="hint">
        These are editable starting sizes. Check your actual structure and
        equipment measurements before finishing.
      </p>
    </Modal>
  );
}
