import React, { useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  Undo2,
  Redo2,
  Download,
  ChevronDown,
  Check,
  HardDrive,
  History,
  Upload,
  FileJson,
  Plus,
  HelpCircle,
  Settings2,
  X,
  ArrowRight,
  Trash2,
  PanelRightOpen,
} from "lucide-react";
import { Plan, CatalogItem, Issue, Version } from "./types";
import {
  createPlan,
  historyReducer,
  issuesFor,
  makeObject,
  migrateLegacy,
  parsePlan,
  round,
  uid,
} from "./lib/model";
import {
  PLAN_KEY,
  backupPlan,
  checkpoint,
  readPlan,
  readVersions,
  savePlan,
} from "./lib/storage";
import Welcome from "./components/Welcome";
import Library from "./components/Library";
import Canvas from "./components/Canvas";
import Inspector from "./components/Inspector";
import ReviewPanel from "./components/ReviewPanel";
import QueuePanel from "./components/QueuePanel";
import PitchSetup from "./components/PitchSetup";
const Export = React.lazy(() => import("./components/Export"));
import Modal from "./components/Modal";
function initialPlan() {
  const current = readPlan();
  if (current) return current;
  try {
    const old = JSON.parse(
      localStorage.getItem("vendor-sketch-pro-vendor") || "null",
    );
    if (old?.vendorId && old?.traderName)
      return migrateLegacy(old.vendorId, old.traderName, localStorage);
  } catch {}
  return readVersions()[0]?.plan || null;
}
export default function App() {
  const [initial] = useState(initialPlan),
    [active, setActive] = useState(Boolean(initial));
  const [history, dispatch] = useReducer(historyReducer, {
    past: [],
    present: initial || createPlan("", ""),
    future: [],
  });
  const plan = history.present;
  const [selected, setSelected] = useState<string | null>(null),
    [step, setStep] = useState(2),
    [dialog, setDialog] = useState<
      | "pitch"
      | "export"
      | "versions"
      | "help"
      | "new"
      | "clear"
      | "details"
      | null
    >(initial && !initial.pitchConfirmed ? "pitch" : null),
    [libraryOpen, setLibraryOpen] = useState(false),
    [panelOpen, setPanelOpen] = useState(false),
    [routeEdit, setRouteEdit] = useState(false),
    [menuOpen, setMenuOpen] = useState(false),
    [saveError, setSaveError] = useState(""),
    [saved, setSaved] = useState(""),
    [message, setMessage] = useState(""),
    [versions, setVersions] = useState<Version[]>([]),
    [fileError, setFileError] = useState(""),
    [externalPlan, setExternalPlan] = useState<Plan | null>(null);
  const input = useRef<HTMLInputElement>(null),
    clipboard = useRef<Plan["objects"][number] | null>(null),
    lastCheckpoint = useRef(Date.now());
  const commit = (p: Plan) => dispatch({ type: "commit", plan: p });
  const selectedObject = plan.objects.find((o) => o.id === selected) || null;
  const issues = useMemo(() => issuesFor(plan), [plan]);
  const errorIds = useMemo(
    () => new Set(issues.filter((i) => i.objectId).map((i) => i.objectId!)),
    [issues],
  );
  useEffect(() => {
    if (!active || externalPlan) return;
    try {
      savePlan(plan);
      setSaveError("");
      setSaved(
        new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
      if (Date.now() - lastCheckpoint.current > 120000) {
        checkpoint(plan, "Automatic checkpoint");
        lastCheckpoint.current = Date.now();
      }
    } catch {
      setSaveError(
        "Browser storage is unavailable or full. Download an editable backup to protect your work.",
      );
    }
  }, [plan, active, externalPlan]);
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== PLAN_KEY || !event.newValue || !active) return;
      try {
        const incoming = parsePlan(JSON.parse(event.newValue));
        if (JSON.stringify(incoming) !== JSON.stringify(plan))
          setExternalPlan(incoming);
      } catch {}
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [plan, active]);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 6500);
    return () => clearTimeout(timer);
  }, [message]);
  useEffect(() => {
    if (selected && !selectedObject) setSelected(null);
  }, [selected, selectedObject]);
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (
        ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) ||
        el.isContentEditable ||
        document.querySelector("dialog[open]")
      )
        return;
      const mod = e.ctrlKey || e.metaKey,
        key = e.key.toLowerCase();
      if (mod && key === "z") {
        e.preventDefault();
        dispatch({ type: e.shiftKey ? "redo" : "undo" });
      } else if (mod && key === "y") {
        e.preventDefault();
        dispatch({ type: "redo" });
      } else if (mod && key === "c" && selectedObject) {
        e.preventDefault();
        clipboard.current = structuredClone(selectedObject);
        setMessage("Item copied. Paste to duplicate it.");
      } else if (mod && key === "v" && clipboard.current) {
        e.preventDefault();
        duplicate(clipboard.current);
      } else if ((key === "delete" || key === "backspace") && selectedObject) {
        e.preventDefault();
        removeSelected();
      } else if (key === "escape") {
        setSelected(null);
        setLibraryOpen(false);
        setPanelOpen(false);
        setRouteEdit(false);
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  });
  const safeCheckpoint = (label: string) => {
    try {
      checkpoint(plan, label);
      setVersions(readVersions());
      return true;
    } catch {
      setSaveError(
        "Could not save a recovery version. Download a backup before continuing.",
      );
      return false;
    }
  };
  function start(p: Plan) {
    setExternalPlan(null);
    dispatch({ type: "load", plan: p });
    setActive(true);
    setStep(p.pitchConfirmed ? 2 : 1);
    setDialog(p.pitchConfirmed ? null : "pitch");
    setSelected(null);
    setFileError("");
  }
  function add(c: CatalogItem) {
    if (plan.objects.length >= 400) {
      setMessage("This plan has reached its 400-item limit.");
      return;
    }
    const o = makeObject(c, plan);
    commit({ ...plan, objects: [...plan.objects, o] });
    setSelected(o.id);
    setStep(2);
    setLibraryOpen(false);
    setPanelOpen(true);
  }
  function duplicate(o: Plan["objects"][number]) {
    if (plan.objects.length >= 400) return;
    const next = {
      ...o,
      id: uid(),
      x: round(o.x + 0.25),
      y: round(o.y + 0.25),
      locked: false,
    };
    commit({ ...plan, objects: [...plan.objects, next] });
    setSelected(next.id);
    setPanelOpen(true);
  }
  function removeSelected() {
    if (!selectedObject) return;
    commit({
      ...plan,
      objects: plan.objects.filter((o) => o.id !== selectedObject.id),
    });
    setSelected(null);
    setMessage("Item removed. Use Undo to restore it.");
  }
  function changeStep(s: number) {
    setStep(s);
    setSelected(null);
    setPanelOpen(true);
    setRouteEdit(false);
    if (s === 1) setDialog("pitch");
  }
  function issueClick(i: Issue) {
    setStep(i.step);
    setSelected(i.objectId || null);
    setPanelOpen(true);
    if (i.step === 1) setDialog("pitch");
  }
  function openVersions() {
    setVersions(readVersions());
    setDialog("versions");
    setMenuOpen(false);
  }
  async function importFile(file?: File) {
    if (!file) return;
    setFileError("");
    try {
      if (file.size > 2_000_000)
        throw Error("Choose a plan file smaller than 2 MB.");
      const p = parsePlan(JSON.parse(await file.text()));
      if (active && !safeCheckpoint("Before importing a backup")) return;
      start({ ...p, id: uid(), updatedAt: new Date().toISOString() });
      setMessage(
        "Backup opened. A recovery version of your previous plan was kept.",
      );
    } catch (e) {
      setFileError(
        e instanceof Error ? e.message : "Could not open that backup.",
      );
      setMessage("Could not open the backup. Your current plan is unchanged.");
    } finally {
      if (input.current) input.current.value = "";
    }
  }
  return (
    <>
      <input
        ref={input}
        type="file"
        accept=".json,application/json"
        hidden
        aria-label="Import editable plan backup"
        onChange={(e) => importFile(e.target.files?.[0])}
      />
      {!active ? (
        <Welcome
          onStart={start}
          onImport={() => input.current?.click()}
          error={fileError}
        />
      ) : (
        <div className="app-shell">
          <header className="app-header">
            <div className="header-brand">
              <span className="brand-icon" aria-hidden="true">
                S
              </span>
              <div>
                <strong>Savour Events</strong>
                <span className="brand-event">
                  VENDORSKETCH · STAND PLANNER
                </span>
              </div>
            </div>
            <div className="plan-identity">
              <strong title={plan.traderName}>{plan.traderName}</strong>
              <span>
                {plan.vendorId} <span className="identity-divider">/</span>{" "}
                Draft r{plan.revision}
              </span>
            </div>
            <div className="header-actions">
              <div className="save-status" role="status">
                <span className={`status-dot ${saveError ? "error" : ""}`} />
                <span>
                  {externalPlan
                    ? "Autosave paused"
                    : saveError
                      ? "Not saved"
                      : "Saved on this device"}
                  <small>
                    {saveError
                      ? "Download a backup"
                      : `Last saved ${saved || "just now"}`}
                  </small>
                </span>
              </div>
              <div className="history-buttons">
                <button
                  className="icon-button"
                  aria-label="Undo"
                  title="Undo (Ctrl / ⌘ Z)"
                  disabled={!history.past.length}
                  onClick={() => dispatch({ type: "undo" })}
                >
                  <Undo2 size={18} />
                </button>
                <button
                  className="icon-button"
                  aria-label="Redo"
                  title="Redo (Ctrl / ⌘ Shift Z)"
                  disabled={!history.future.length}
                  onClick={() => dispatch({ type: "redo" })}
                >
                  <Redo2 size={18} />
                </button>
              </div>
              <div className="menu-wrap">
                <button
                  className="secondary plan-menu-button"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen(!menuOpen)}
                >
                  Plan
                  <ChevronDown size={14} />
                </button>
                {menuOpen && (
                  <>
                    <button
                      className="menu-scrim"
                      aria-label="Close plan menu"
                      onClick={() => setMenuOpen(false)}
                    />
                    <div className="plan-menu">
                      <button
                        onClick={() => {
                          backupPlan(plan);
                          setMenuOpen(false);
                        }}
                      >
                        <FileJson size={16} />
                        Download editable backup
                      </button>
                      <button
                        onClick={() => {
                          input.current?.click();
                          setMenuOpen(false);
                        }}
                      >
                        <Upload size={16} />
                        Open backup
                      </button>
                      <button onClick={openVersions}>
                        <History size={16} />
                        Version history
                      </button>
                      <button
                        onClick={() => {
                          if (safeCheckpoint("Saved checkpoint"))
                            setMessage("Checkpoint saved in this browser.");
                          setMenuOpen(false);
                        }}
                      >
                        <HardDrive size={16} />
                        Save a checkpoint
                      </button>
                      <hr />
                      <button
                        onClick={() => {
                          setDialog("details");
                          setMenuOpen(false);
                        }}
                      >
                        <Settings2 size={16} />
                        Vendor details
                      </button>
                      <button
                        onClick={() => {
                          setDialog("help");
                          setMenuOpen(false);
                        }}
                      >
                        <HelpCircle size={16} />
                        Help & shortcuts
                      </button>
                      <hr />
                      <button
                        onClick={() => {
                          setDialog("new");
                          setMenuOpen(false);
                        }}
                      >
                        <Plus size={16} />
                        Start another plan
                      </button>
                      <button
                        className="danger"
                        onClick={() => {
                          setDialog("clear");
                          setMenuOpen(false);
                        }}
                      >
                        <Trash2 size={16} />
                        Clear this layout
                      </button>
                    </div>
                  </>
                )}
              </div>
              <button
                className="primary download-main"
                onClick={() => setDialog("export")}
              >
                <Download size={17} />
                <span>Download plan</span>
              </button>
            </div>
          </header>
          <nav className="steps" aria-label="Planning steps">
            {[
              "Confirm pitch",
              "Add equipment",
              "Plan queue",
              "Review & download",
            ].map((label, i) => (
              <button
                key={label}
                aria-current={step === i + 1 ? "step" : undefined}
                className={step === i + 1 ? "current" : ""}
                onClick={() => changeStep(i + 1)}
              >
                <span className="step-number">
                  {i === 0 && plan.pitchConfirmed ? (
                    <Check size={14} />
                  ) : (
                    String(i + 1).padStart(2, "0")
                  )}
                </span>
                <span>{label}</span>
                {i < 3 && <ChevronDown className="step-chevron" size={14} />}
              </button>
            ))}
            <span className="pitch-pill">
              {plan.width} × {plan.depth} m pitch
            </span>
          </nav>
          {externalPlan && (
            <div className="storage-warning" role="alert">
              Another tab saved a plan. Autosave is paused to protect both
              copies.
              <button
                onClick={() => {
                  if (!safeCheckpoint("Before loading another tab")) return;
                  dispatch({ type: "load", plan: externalPlan });
                  setExternalPlan(null);
                  setSelected(null);
                }}
              >
                Load latest
              </button>
              <button
                onClick={() => {
                  setExternalPlan(null);
                  setMessage("This tab is now the active saved plan.");
                }}
              >
                Keep this tab
              </button>
            </div>
          )}
          {saveError && (
            <div className="storage-warning" role="alert">
              {saveError}
              <button onClick={() => backupPlan(plan)}>Download backup</button>
            </div>
          )}
          {fileError && (
            <div className="storage-warning" role="alert">
              {fileError}
              <button
                aria-label="Dismiss import error"
                onClick={() => setFileError("")}
              >
                <X size={14} />
              </button>
            </div>
          )}
          <div className="workspace">
            <div className={`library-shell ${libraryOpen ? "open" : ""}`}>
              <Library onAdd={add} onClose={() => setLibraryOpen(false)} />
            </div>
            {libraryOpen && (
              <button
                className="drawer-scrim"
                aria-label="Close item library"
                onClick={() => setLibraryOpen(false)}
              />
            )}
            <main className="workspace-main">
              <div className="workspace-heading">
                <div>
                  <span className="eyebrow">YOUR WORKSPACE</span>
                  <h1>
                    {step === 3
                      ? "Give your customers a clear route"
                      : "Every detail in its place"}
                  </h1>
                </div>
                <div className="workspace-heading-actions">
                  <button
                    className="secondary mobile-only"
                    onClick={() => setLibraryOpen(true)}
                  >
                    <Plus size={16} />
                    Add item
                  </button>
                  <button className="subtle" onClick={() => setDialog("pitch")}>
                    <Settings2 size={15} />
                    <span>Edit pitch</span>
                  </button>
                  <button
                    className="secondary panel-toggle"
                    onClick={() => setPanelOpen(!panelOpen)}
                  >
                    <PanelRightOpen size={17} />
                    <span>{issues.length} checks</span>
                  </button>
                </div>
              </div>
              <Canvas
                key={plan.id}
                plan={plan}
                selectedId={selected}
                onSelect={(id) => {
                  setSelected(id);
                  if (id) setPanelOpen(true);
                }}
                onCommit={commit}
                errorIds={errorIds}
                routeEdit={routeEdit}
                onRouteClick={(point) => {
                  const q = plan.queue;
                  if (q.points.length >= 200) return;
                  if (
                    point.x < q.laneWidth / 2 ||
                    point.x > plan.width - q.laneWidth / 2 ||
                    point.y < plan.depth + q.laneWidth / 2 ||
                    point.y > plan.depth + q.depth - q.laneWidth / 2
                  ) {
                    setMessage(
                      "Place route points within the shaded queue zone, allowing space for the lane width.",
                    );
                    return;
                  }
                  commit({
                    ...plan,
                    queue: {
                      ...q,
                      template: "custom",
                      points: [...q.points, point],
                    },
                  });
                }}
              />
              <footer className="workspace-footer">
                <span>
                  <span className="legend-swatch pitch" />
                  Allocated pitch
                </span>
                <span>
                  <span className="legend-swatch queue" />
                  Proposed queue area
                </span>
                <span className="footer-note">All dimensions in metres</span>
              </footer>
            </main>
            <aside className={`right-panel ${panelOpen ? "open" : ""}`}>
              <button
                className="icon-button close-panel mobile-only"
                aria-label="Close planning panel"
                onClick={() => setPanelOpen(false)}
              >
                <X size={19} />
              </button>
              {selectedObject ? (
                <Inspector
                  key={selectedObject.id}
                  object={selectedObject}
                  plan={plan}
                  onChange={(updates) =>
                    commit({
                      ...plan,
                      objects: plan.objects.map((o) =>
                        o.id === selectedObject.id ? { ...o, ...updates } : o,
                      ),
                    })
                  }
                  onDuplicate={() => duplicate(selectedObject)}
                  onDelete={removeSelected}
                  onClose={() => setSelected(null)}
                />
              ) : step === 3 ? (
                <QueuePanel
                  plan={plan}
                  onChange={commit}
                  routeEdit={routeEdit}
                  setRouteEdit={setRouteEdit}
                />
              ) : (
                <ReviewPanel
                  plan={plan}
                  issues={issues}
                  step={step}
                  onStep={changeStep}
                  onIssue={issueClick}
                  onExport={() => setDialog("export")}
                  onPitch={() => setDialog("pitch")}
                  onLibrary={() => setLibraryOpen(true)}
                  onNotes={(notes) => commit({ ...plan, notes })}
                />
              )}
            </aside>
          </div>
        </div>
      )}
      {message && (
        <div className="toast" role="status">
          <Check size={18} />
          {message}
          <button
            aria-label="Dismiss notification"
            onClick={() => setMessage("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {dialog === "pitch" && (
        <PitchSetup
          plan={plan}
          onClose={() => setDialog(null)}
          onSave={(p) => {
            commit(p);
            setDialog(null);
            setStep(2);
            setMessage(
              "Pitch confirmed. Add your equipment and check its dimensions.",
            );
          }}
        />
      )}
      {dialog === "export" && (
        <React.Suspense
          fallback={
            <div className="toast" role="status">
              Preparing export preview…
            </div>
          }
        >
          <Export plan={plan} onClose={() => setDialog(null)} />
        </React.Suspense>
      )}{" "}
      {dialog === "versions" && (
        <Modal title="Version history" onClose={() => setDialog(null)}>
          <p className="panel-description">
            Up to 20 checkpoints are kept in this browser. A checkpoint is also
            saved automatically while you work, at most once every two minutes.
          </p>
          <button
            className="secondary full"
            onClick={() => {
              if (safeCheckpoint("Saved checkpoint"))
                setMessage("Checkpoint saved.");
            }}
          >
            <Plus size={16} />
            Save current checkpoint
          </button>
          <div className="version-list">
            {!versions.length && (
              <p className="empty">
                No checkpoints yet. Save one before making a big change.
              </p>
            )}
            {versions.map((v) => (
              <div key={v.id}>
                <div>
                  <strong>{v.label}</strong>
                  <span>
                    {v.plan.traderName} · r{v.plan.revision}
                  </span>
                  <small>{new Date(v.at).toLocaleString("en-GB")}</small>
                </div>
                <button
                  className="secondary"
                  onClick={() => {
                    if (!safeCheckpoint("Before restoring a version")) return;
                    dispatch({
                      type: "load",
                      plan: {
                        ...v.plan,
                        revision: plan.revision + 1,
                        updatedAt: new Date().toISOString(),
                      },
                    });
                    setSelected(null);
                    setDialog(null);
                    setMessage(
                      "Version restored. Your previous plan is in version history.",
                    );
                  }}
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        </Modal>
      )}
      {dialog === "help" && (
        <Modal
          title="A little help with your plan"
          onClose={() => setDialog(null)}
        >
          <div className="help-content">
            <h3>Four steps to your onboarding upload</h3>
            <ol>
              <li>
                The standard pitch is 7 × 5 m. Different pitch sizes are only
                available with written approval from the organiser. Confirm
                frontage (customer-facing width) and front-to-back depth from
                your allocation.
              </li>
              <li>
                Add your equipment, service points and staff access. Replace
                estimated sizes with real measurements.
              </li>
              <li>
                Draw the customer queue in the shaded area. Check lane width,
                direction and waiting-capacity assumptions.
              </li>
              <li>
                Review warnings, download the PNG and upload it in vendor
                onboarding.
              </li>
            </ol>
            <h3>Moving and editing</h3>
            <p>
              Click an item to edit its name, dimensions, rotation, position,
              clearance and notes. Drag it to move, or use the position fields
              and move buttons. Arrow keys move a focused item by 0.1 m; Shift +
              arrow moves it by 1 m.
            </p>
            <p>
              Drag empty space to pan. Use Fit pitch or Fit whole plan to
              recover your view. Hold Shift while dragging to bypass snapping.
            </p>
            <h3>Keyboard shortcuts</h3>
            <p>
              Ctrl / ⌘ Z: Undo · Ctrl / ⌘ Shift Z: Redo · Ctrl / ⌘ C / V: Copy /
              paste · Delete: Remove · Escape: Deselect.
            </p>
            <h3>Saving and privacy</h3>
            <p>
              No account is needed. Your plan is stored in this browser on this
              device and is not sent to Savour. Clearing browser data may remove
              it. Download editable backups regularly, and upload the finished
              PNG in onboarding.
            </p>
            <h3>Understanding checks</h3>
            <p>
              Structures can contain equipment. Solid equipment overlaps are
              flagged. Optional clearance guides are supplied by you. Queue
              capacity is route length divided by spacing; it is not a
              crowd-flow or safety assessment.
            </p>
          </div>
        </Modal>
      )}
      {dialog === "details" && (
        <VendorDetails
          plan={plan}
          onClose={() => setDialog(null)}
          onSave={(p) => {
            commit(p);
            setDialog(null);
          }}
        />
      )}
      {dialog === "new" && (
        <Modal title="Start another plan?" onClose={() => setDialog(null)}>
          <p className="panel-description">
            Your current plan will be kept in version history on this device.
            Download a backup if you want to move it to another browser.
          </p>
          <button className="secondary full" onClick={() => backupPlan(plan)}>
            <FileJson size={16} />
            Download current backup
          </button>
          <button
            className="primary full"
            onClick={() => {
              if (!safeCheckpoint("Before starting another plan")) return;
              setDialog(null);
              setActive(false);
            }}
          >
            Continue to new plan
            <ArrowRight size={17} />
          </button>
        </Modal>
      )}
      {dialog === "clear" && (
        <Modal title="Clear the layout?" onClose={() => setDialog(null)}>
          <p className="panel-description">
            This removes equipment and the queue route. Your vendor details and
            pitch dimensions stay in place. You can Undo this change, and a
            recovery checkpoint will be kept.
          </p>
          <button
            className="danger full"
            onClick={() => {
              if (!safeCheckpoint("Before clearing layout")) return;
              commit({
                ...plan,
                objects: [],
                queue: { ...plan.queue, points: [], template: "none" },
              });
              setSelected(null);
              setDialog(null);
              setMessage(
                "Layout cleared. Undo or version history can restore it.",
              );
            }}
          >
            Clear equipment & route
          </button>
        </Modal>
      )}
    </>
  );
}
function VendorDetails({
  plan,
  onClose,
  onSave,
}: {
  plan: Plan;
  onClose: () => void;
  onSave: (p: Plan) => void;
}) {
  const [name, setName] = useState(plan.traderName),
    [id, setId] = useState(plan.vendorId);
  return (
    <Modal title="Vendor details" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim() && id.trim())
            onSave({ ...plan, traderName: name.trim(), vendorId: id.trim() });
        }}
      >
        <label className="field">
          <span>Trading name</span>
          <input
            required
            maxLength={70}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="field">
          <span>Vendor ID</span>
          <input
            required
            maxLength={60}
            value={id}
            onChange={(e) => setId(e.target.value)}
          />
        </label>
        <p className="hint">
          These identify the drawing; they are not sign-in credentials.
        </p>
        <button className="primary full" type="submit">
          Save details
        </button>
      </form>
    </Modal>
  );
}
