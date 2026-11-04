import { useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Download, FileImage, FileText, ExternalLink } from "lucide-react";
import { Plan } from "../types";
import { PlanScene, sceneBounds } from "./PlanScene";
import { capacity, issuesFor } from "../lib/model";
import { downloadBlob, filename, backupPlan } from "../lib/storage";
import Modal from "./Modal";
function wrapped(text: string, width: number): string[] {
  const words = text
      .split(/\s+/)
      .flatMap((word) => word.match(new RegExp(`.{1,${width}}`, "gu")) || []),
    lines: string[] = [];
  let line = "";
  for (const word of words) {
    if ((line + " " + word).length > width) {
      if (line) lines.push(line);
      line = word;
    } else line += (line ? " " : "") + word;
  }
  if (line) lines.push(line);
  return lines;
}
export function ExportSheet({ plan: p }: { plan: Plan }) {
  const b = sceneBounds(p, true),
    rows = Math.ceil(p.objects.length / 2),
    notes = wrapped(p.notes || "No additional notes.", 115),
    height = 1040 + rows * 62 + notes.length * 20;
  const issues = issuesFor(p),
    errors = issues.filter((i) => i.severity === "error").length;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1200"
      height={height}
      viewBox={`0 0 1200 ${height}`}
      style={{
        fontFamily: "Arial, Helvetica, sans-serif",
        background: "white",
      }}
      role="img"
      aria-label="Export preview with measured plan and equipment schedule"
    >
      <rect width="1200" height={height} fill="white" />
      <rect width="1200" height="9" fill="#df702a" />
      <text
        x="48"
        y="56"
        fill="#df702a"
        fontSize="17"
        fontWeight="700"
        letterSpacing="3"
      >
        SAVOUR / VENDOR STAND PLAN
      </text>
      <text x="48" y="102" fill="#1d211e" fontSize="30" fontWeight="700">
        {p.traderName.slice(0, 65)}
      </text>
      <text x="48" y="133" fill="#625e58" fontSize="16">
        Vendor {p.vendorId} · Revision {p.revision} ·{" "}
        {new Date(p.updatedAt).toLocaleDateString("en-GB")}
      </text>
      <text x="1152" y="63" textAnchor="end" fill="#625e58" fontSize="16">
        {p.width} m frontage × {p.depth} m depth
      </text>
      <text x="1152" y="91" textAnchor="end" fill="#625e58" fontSize="15">
        Queue estimate: {capacity(p)} / target {p.queue.target} people
      </text>
      <text
        x="1152"
        y="120"
        textAnchor="end"
        fill={errors ? "#a44537" : "#625e58"}
        fontSize="14"
      >
        {errors
          ? `${errors} layout issue(s) require review`
          : "Draft for organiser review · not an approval"}
      </text>
      <line x1="48" x2="1152" y1="156" y2="156" stroke="#d9d1c5" />
      <svg
        x="48"
        y="175"
        width="1104"
        height="660"
        viewBox={`${b.x} ${b.y} ${b.width} ${b.height}`}
      >
        <PlanScene plan={p} print />
      </svg>
      <text x="48" y="865" fill="#625e58" fontSize="13">
        All measurements in metres. Grid = 1 m. Equipment clearances shown as
        dashed outlines where specified.
      </text>
      <text x="48" y="888" fill="#625e58" fontSize="13">
        Queue: {p.queue.laneWidth} m lane width; {p.queue.personSpacing} m
        spacing per person. Capacity is an estimate, not a safety assessment.
      </text>
      <text x="48" y="934" fill="#1d211e" fontSize="20" fontWeight="700">
        Equipment schedule
      </text>
      {!p.objects.length && (
        <text x="48" y="966" fill="#625e58" fontSize="16">
          No equipment added.
        </text>
      )}
      {p.objects.map((o, i) => {
        const x = i % 2 ? 620 : 48,
          y = 965 + Math.floor(i / 2) * 62;
        return (
          <g key={o.id}>
            <circle cx={x + 10} cy={y} r="10" fill={o.color} />
            <text
              x={x + 10}
              y={y + 4}
              textAnchor="middle"
              fill="white"
              fontSize="11"
              fontWeight="700"
            >
              {i + 1}
            </text>
            <text
              x={x + 29}
              y={y + 4}
              fontSize="15"
              fill="#1d211e"
              fontWeight="600"
            >
              {o.name.slice(0, 35)} · {o.width} × {o.depth} m ·{" "}
              {Math.round(o.rotation)}°
            </text>
            <text x={x + 29} y={y + 25} fontSize="12" fill="#625e58">
              {o.notes
                ? o.notes.slice(0, 70)
                : `${o.type} · ${o.clearance ? `${o.clearance} m working clearance` : "Verify actual dimensions"}`}
            </text>
          </g>
        );
      })}
      <text
        x="48"
        y={990 + rows * 62}
        fill="#1d211e"
        fontSize="18"
        fontWeight="700"
      >
        Plan notes
      </text>
      {notes.map((line, i) => (
        <text
          key={i}
          x="48"
          y={1017 + rows * 62 + i * 20}
          fill="#625e58"
          fontSize="14"
        >
          {line}
        </text>
      ))}
    </svg>
  );
}
async function toImage(p: Plan): Promise<HTMLCanvasElement> {
  const markup = renderToStaticMarkup(<ExportSheet plan={p} />),
    blob = new Blob([markup], { type: "image/svg+xml;charset=utf-8" }),
    url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () =>
        reject(
          Error(
            "Could not render the plan image. Try downloading the SVG instead.",
          ),
        );
      img.src = url;
    });
    const scale = Math.min(2, 15000 / img.height),
      canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw Error("Your browser could not create the image. Try SVG.");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}
export default function Export({
  plan,
  onClose,
}: {
  plan: Plan;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(""),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  const issues = issuesFor(plan);
  const onboarding = (import.meta.env.VITE_ONBOARDING_URL || "") as string;
  const uploadUrl = onboarding.startsWith("https://") ? onboarding : "";
  async function download(format: "png" | "pdf" | "svg") {
    setBusy(format);
    setError("");
    setMessage("");
    try {
      if (format === "svg")
        downloadBlob(
          new Blob([renderToStaticMarkup(<ExportSheet plan={plan} />)], {
            type: "image/svg+xml",
          }),
          `${filename(plan)}.svg`,
        );
      else {
        const canvas = await toImage(plan);
        if (format === "png") {
          const blob = await new Promise<Blob>((resolve, reject) =>
            canvas.toBlob(
              (b) =>
                b
                  ? resolve(b)
                  : reject(Error("The image could not be created. Try SVG.")),
              "image/png",
            ),
          );
          downloadBlob(blob, `${filename(plan)}.png`);
        } else {
          const { jsPDF } = await import("jspdf");
          const doc = new jsPDF({ unit: "mm", format: "a4" });
          const pageHeight = Math.floor(canvas.width * (277 / 190));
          let y = 0,
            index = 0;
          while (y < canvas.height) {
            if (index++) doc.addPage();
            const slice = document.createElement("canvas");
            slice.width = canvas.width;
            slice.height = Math.min(pageHeight, canvas.height - y);
            slice
              .getContext("2d")!
              .drawImage(
                canvas,
                0,
                y,
                canvas.width,
                slice.height,
                0,
                0,
                slice.width,
                slice.height,
              );
            doc.addImage(
              slice.toDataURL("image/png"),
              "PNG",
              10,
              10,
              190,
              (slice.height / slice.width) * 190,
            );
            y += slice.height;
          }
          doc.save(`${filename(plan)}.pdf`);
        }
      }
      setMessage(
        format === "png"
          ? "PNG download started. Upload it in your vendor onboarding form to send it to the organiser."
          : `${format.toUpperCase()} download started. For your onboarding form, use the PNG download.`,
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Export failed. Please try again.",
      );
    } finally {
      setBusy("");
    }
  }
  return (
    <Modal title="Download your stand plan" onClose={onClose} wide>
      <div className="export-layout">
        <div className="export-preview">
          <ExportSheet plan={plan} />
        </div>
        <div className="export-options">
          <span className="eyebrow">READY FOR ONBOARDING</span>
          <h3>Check. Download. Upload.</h3>
          <p>
            Your plan includes vendor details, dimensions, queue assumptions and
            a numbered equipment schedule.
          </p>
          {issues.length > 0 && (
            <div className="notice warning">
              {issues.filter((i) => i.severity === "error").length} layout
              issues · {issues.filter((i) => i.severity === "warning").length}{" "}
              checks to review. You can still download a draft.
            </div>
          )}
          <button
            className="primary full"
            disabled={!!busy}
            onClick={() => download("png")}
          >
            <FileImage size={18} />
            {busy === "png" ? "Preparing PNG…" : "Download PNG"}
          </button>
          <p className="hint">
            High-resolution image for your onboarding upload.
          </p>
          <button
            className="secondary full"
            disabled={!!busy}
            onClick={() => download("pdf")}
          >
            <FileText size={17} />
            {busy === "pdf" ? "Preparing PDF…" : "Download PDF"}
          </button>
          <button
            className="secondary full"
            disabled={!!busy}
            onClick={() => download("svg")}
          >
            <Download size={17} />
            {busy === "svg" ? "Preparing SVG…" : "Download SVG"}
          </button>
          <button className="subtle full" onClick={() => backupPlan(plan)}>
            Save editable backup (.json)
          </button>
          <div className="notice">
            Downloading does not submit your plan. Upload it in your vendor
            onboarding flow.
          </div>
          {uploadUrl && (
            <a
              className="secondary full"
              href={uploadUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open vendor onboarding
              <ExternalLink size={15} />
            </a>
          )}
          {message && (
            <p role="status" className="success-message">
              {message}
            </p>
          )}
          {error && (
            <p role="alert" className="field-error">
              {error}
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
