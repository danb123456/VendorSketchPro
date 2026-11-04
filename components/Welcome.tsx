import { useState } from "react";
import { ArrowRight, Upload, ShieldCheck, Check } from "lucide-react";
import { Plan } from "../types";
import { createPlan, migrateLegacy } from "../lib/model";
import { readPlan, readVersions } from "../lib/storage";
export default function Welcome({
  onStart,
  onImport,
  error,
}: {
  onStart: (p: Plan) => void;
  onImport: () => void;
  error: string;
}) {
  const [id, setId] = useState(""),
    [name, setName] = useState("");
  return (
    <main className="welcome">
      <div className="welcome-story">
        <a className="wordmark" href="#">
          <span className="brand-icon" aria-hidden="true">
            S
          </span>
          SAVOUR EVENTS
        </a>
        <div>
          <span className="eyebrow">SAVOUR · VENDOR PLANNING</span>
          <h1>
            A clear plan.
            <br />A smoother
            <br />
            <em>festival day.</em>
          </h1>
          <p>
            Bring your stand to life, from the kitchen to the customer queue.
          </p>
          <div className="welcome-points">
            <span>
              <Check size={17} />
              Your equipment, to scale
            </span>
            <span>
              <Check size={17} />A queue that fits your frontage
            </span>
            <span>
              <Check size={17} />
              One clear plan for onboarding
            </span>
          </div>
        </div>
        <small>Built for the people behind the food.</small>
      </div>
      <section className="welcome-form">
        <div className="welcome-card">
          <span className="pill">YOUR STAND STARTS HERE</span>
          <h2>Let’s plan your pitch</h2>
          <p>
            Enter the details from your vendor onboarding form. No account
            needed.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (id.trim() && name.trim()) {
                let previous: Plan | null = readPlan();
                if (previous?.vendorId !== id.trim()) {
                  previous =
                    readVersions().find((v) => v.plan.vendorId === id.trim())
                      ?.plan || null;
                }
                if (!previous) {
                  try {
                    previous = migrateLegacy(
                      id.trim(),
                      name.trim(),
                      localStorage,
                    );
                  } catch {}
                }
                onStart(previous || createPlan(id, name));
              }
            }}
          >
            <label className="field">
              <span>Vendor ID</span>
              <input
                required
                maxLength={60}
                autoComplete="off"
                placeholder="Your onboarding reference"
                value={id}
                onChange={(e) => setId(e.target.value)}
              />
              <small>Use the reference supplied by the Savour team.</small>
            </label>
            <label className="field">
              <span>Trading name</span>
              <input
                required
                maxLength={70}
                autoComplete="organization"
                placeholder="e.g. The Smokehouse"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <button className="primary full" type="submit">
              Create / reopen my plan
              <ArrowRight size={18} />
            </button>
          </form>
          <button className="subtle full" onClick={onImport}>
            <Upload size={16} />
            Open an editable backup
          </button>
          {error && (
            <p role="alert" className="field-error">
              {error}
            </p>
          )}
          <div className="local-note">
            <ShieldCheck size={21} />
            <div>
              <strong>Your work stays in this browser</strong>
              <p>
                We save your progress on this device. Download an editable
                backup to move it elsewhere.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
