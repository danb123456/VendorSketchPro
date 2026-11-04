import { useEffect, useRef, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Download,
  FileImage,
  FileText,
  ExternalLink,
  Share2,
} from "lucide-react";
import { Plan } from "../types";
import { PlanScene, sceneBounds } from "./PlanScene";
import { capacity, issuesFor } from "../lib/model";
import { filename, backupPlan } from "../lib/storage";
import Modal from "./Modal";
import { mapBounds, mapSvg, mapDxf, mappingData } from "../lib/mapping";
import { renderSvgCanvas, canvasPng } from "../lib/raster";
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
export async function reportCanvas(plan: Plan): Promise<HTMLCanvasElement> {
  const markup = renderToStaticMarkup(<ExportSheet plan={plan} />);
  const height =
    1040 +
    Math.ceil(plan.objects.length / 2) * 62 +
    wrapped(plan.notes || "No additional notes.", 115).length * 20;
  return renderSvgCanvas(markup, 1200, height);
}
type Format = "png" | "pdf" | "svg" | "overlay" | "map-svg" | "dxf" | "data";
export default function Export({
  plan,
  onClose,
}: {
  plan: Plan;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState<string>("png"),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [ready, setReady] = useState<{
      url: string;
      name: string;
      blob: Blob;
    } | null>(null),
    [canShare, setCanShare] = useState(false);
  const cache = useRef(new Map<Format, Blob>()),
    urlRef = useRef<string | null>(null),
    mounted = useRef(true);
  const issues = issuesFor(plan),
    onboarding = (import.meta.env.VITE_ONBOARDING_URL || "") as string,
    uploadUrl = onboarding.startsWith("https://") ? onboarding : "";
  const nameFor = (format: Format) =>
    `${filename(plan)}${format === "overlay" ? "-map-overlay.png" : format === "map-svg" ? "-scaled-map.svg" : format === "data" ? "-map-data.json" : "." + format}`;
  function expose(blob: Blob, format: Format) {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    const url = URL.createObjectURL(blob);
    urlRef.current = url;
    const name = nameFor(format);
    setReady({ url, name, blob });
    const file = new File([blob], name, { type: blob.type });
    setCanShare(Boolean(navigator.canShare?.({ files: [file] })));
    return { url, name };
  }
  useEffect(() => {
    mounted.current = true;
    reportCanvas(plan)
      .then(canvasPng)
      .then((blob) => {
        if (!mounted.current) return;
        cache.current.set("png", blob);
        expose(blob, "png");
        setBusy("");
      })
      .catch((e) => {
        if (mounted.current) {
          setBusy("");
          setError(
            e instanceof Error
              ? e.message
              : "Could not prepare the PNG. Try another format.",
          );
        }
      });
    return () => {
      mounted.current = false;
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, [plan]);
  async function generate(format: Format): Promise<Blob> {
    const cached = cache.current.get(format);
    if (cached) return cached;
    let blob: Blob;
    if (format === "png") blob = await canvasPng(await reportCanvas(plan));
    else if (format === "overlay") {
      const b = mapBounds(plan);
      blob = await canvasPng(
        await renderSvgCanvas(mapSvg(plan), b.width, b.height, true),
      );
    } else if (format === "svg")
      blob = new Blob([renderToStaticMarkup(<ExportSheet plan={plan} />)], {
        type: "image/svg+xml",
      });
    else if (format === "map-svg")
      blob = new Blob([mapSvg(plan)], { type: "image/svg+xml" });
    else if (format === "dxf")
      blob = new Blob([mapDxf(plan)], { type: "application/dxf" });
    else if (format === "data")
      blob = new Blob([JSON.stringify(mappingData(plan), null, 2)], {
        type: "application/json",
      });
    else {
      const { jsPDF } = await import("jspdf"),
        canvas = await reportCanvas(plan),
        doc = new jsPDF({ unit: "mm", format: "a4" }),
        pageHeight = Math.floor((canvas.width * 277) / 190);
      for (let y = 0, index = 0; y < canvas.height; y += pageHeight, index++) {
        if (index) doc.addPage();
        const slice = document.createElement("canvas");
        slice.width = canvas.width;
        slice.height = Math.min(pageHeight, canvas.height - y);
        const ctx = slice.getContext("2d");
        if (!ctx) throw Error("Could not create a PDF page. Try PNG.");
        ctx.drawImage(
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
      }
      blob = doc.output("blob");
    }
    if (!blob.size) throw Error("The download was empty. Please try again.");
    cache.current.set(format, blob);
    return blob;
  }
  function save(url: string, name: string) {
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
  async function download(format: Format) {
    setError("");
    setMessage("");
    const cached = cache.current.get(format);
    if (cached) {
      const file = expose(cached, format);
      save(file.url, file.name);
      setMessage(
        "Download requested. If it does not start, use Save file below.",
      );
      return;
    }
    setBusy(format);
    try {
      const blob = await generate(format);
      if (!mounted.current) return;
      const file = expose(blob, format);
      save(file.url, file.name);
      setMessage(
        "Download requested. If it does not start, use Save file below.",
      );
    } catch (e) {
      if (mounted.current)
        setError(
          e instanceof Error
            ? e.message
            : "Download preparation failed. Please retry.",
        );
    } finally {
      if (mounted.current) setBusy("");
    }
  }
  async function share() {
    if (!ready) return;
    try {
      await navigator.share({
        files: [new File([ready.blob], ready.name, { type: ready.blob.type })],
        title: "Savour stand plan",
      });
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError"))
        setError("Sharing is unavailable here. Use Save file instead.");
    }
  }
  return (
    <Modal title="Finish your stand plan" onClose={onClose} wide>
      <div className="export-layout">
        <div className="export-preview">
          <ExportSheet plan={plan} />
        </div>
        <div className="export-options">
          <span className="eyebrow">YOUR STAND, READY TO SHARE</span>
          <h3>One last look. Then download.</h3>
          <p>
            Check your sizes and service flow. Your PNG includes your vendor
            details, measurements and equipment list.
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
            <FileImage size={19} />
            {busy === "png" ? "Preparing your PNG…" : "Download PNG"}
          </button>
          <button
            className="secondary full"
            disabled={!!busy}
            onClick={() => download("pdf")}
          >
            <FileText size={18} />
            {busy === "pdf" ? "Preparing PDF…" : "Download PDF"}
          </button>
          {ready && (
            <div className="ready-download">
              <span className="field-label">Your file is ready</span>
              <a
                href={ready.url}
                download={ready.name}
                className="secondary full"
              >
                Save file
                <Download size={17} />
              </a>
              <small>{ready.name}</small>
              {canShare && (
                <button className="secondary full" onClick={share}>
                  <Share2 size={17} />
                  Share / save to Files
                </button>
              )}
            </div>
          )}
          {error && (
            <p role="alert" className="field-error">
              {error}
              <button
                className="subtle"
                disabled={!!busy}
                onClick={() => download("png")}
              >
                Retry PNG
              </button>
            </p>
          )}
          {message && (
            <p role="status" className="success-message">
              {message}
            </p>
          )}
          <details className="mapping-downloads">
            <summary>For event mapping & CAD</summary>
            <p className="hint">
              Use the clean overlay for your event map. It has no title block.
              Set the scale from the pitch frontage ({plan.width} m). Files use
              local stand coordinates; place and rotate them in your master
              plan.
            </p>
            <button
              className="secondary full"
              disabled={!!busy}
              onClick={() => download("overlay")}
            >
              {busy === "overlay" ? "Preparing overlay…" : "Map overlay PNG"}
            </button>
            <button
              className="secondary full"
              disabled={!!busy}
              onClick={() => download("map-svg")}
            >
              Scaled map SVG
            </button>
            <button
              className="secondary full"
              disabled={!!busy}
              onClick={() => download("dxf")}
            >
              CAD drawing (.dxf)
            </button>
            <button
              className="secondary full"
              disabled={!!busy}
              onClick={() => download("data")}
            >
              Map data (.json)
            </button>
            <button
              className="subtle full"
              disabled={!!busy}
              onClick={() => download("svg")}
            >
              Report SVG
            </button>
          </details>
          <button className="subtle full" onClick={() => backupPlan(plan)}>
            Save editable backup (.json)
          </button>
          <div className="notice">
            Downloading does not submit your plan. Upload your PNG in vendor
            onboarding.
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
        </div>
      </div>
    </Modal>
  );
}
