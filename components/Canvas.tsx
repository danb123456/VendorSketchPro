import React, { useEffect, useRef, useState } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Scan,
  Hand,
  MousePointer2,
  Magnet,
  Grid2X2,
} from "lucide-react";
import { Plan, StandObject, Point } from "../types";
import { round, validDimension } from "../lib/model";
import { PlanScene, sceneBounds } from "./PlanScene";
interface Props {
  plan: Plan;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onCommit: (p: Plan) => void;
  errorIds: Set<string>;
  routeEdit: boolean;
  onRouteClick?: (point: Point) => void;
}
export default function Canvas({
  plan,
  selectedId,
  onSelect,
  onCommit,
  errorIds,
  routeEdit,
  onRouteClick,
}: Props) {
  const host = useRef<HTMLDivElement>(null),
    svg = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [view, setView] = useState<ReturnType<typeof sceneBounds> | null>(null),
    [mode, setMode] = useState<"select" | "pan">("select"),
    [snap, setSnap] = useState(true),
    [grid, setGrid] = useState(true),
    [draft, setDraft] = useState<Plan | null>(null),
    [guides, setGuides] = useState<{ axis: "x" | "y"; value: number }[]>([]);
  const gesture = useRef<{
      type: "move" | "resize" | "rotate" | "pan" | "route";
      start: Point;
      original: Plan;
      object?: StandObject;
      pointIndex?: number;
      view: ReturnType<typeof sceneBounds>;
      moved: boolean;
    } | null>(null),
    draftRef = useRef<Plan | null>(null);
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setSize({ w: r.width, h: r.height });
    });
    if (host.current) observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  const fit = (whole: boolean) => {
    const b = sceneBounds(plan, whole);
    const ratio = size.w / size.h;
    if (b.width / b.height < ratio) {
      const w = b.height * ratio;
      return { ...b, x: b.x - (w - b.width) / 2, width: w };
    }
    const h = b.width / ratio;
    return { ...b, y: b.y - (h - b.height) / 2, height: h };
  };
  const current = view || fit(true),
    shown = draft || plan;
  const point = (e: React.PointerEvent<SVGSVGElement>): Point => {
    const matrix = svg.current?.getScreenCTM()?.inverse();
    if (!matrix) return { x: 0, y: 0 };
    return new DOMPoint(e.clientX, e.clientY).matrixTransform(matrix);
  };
  function begin(e: React.PointerEvent<SVGSVGElement>) {
    if (e.button !== 0) return;
    const target = e.target as Element;
    const objectId = target
        .closest("[data-object]")
        ?.getAttribute("data-object"),
      handle = target.getAttribute("data-handle"),
      routePoint = target.getAttribute("data-route-point"),
      start = point(e);
    if (mode === "pan" || e.altKey) {
      gesture.current = {
        type: "pan",
        start,
        original: plan,
        view: current,
        moved: false,
      };
    } else if (routePoint !== null) {
      gesture.current = {
        type: "route",
        start,
        original: plan,
        pointIndex: Number(routePoint),
        view: current,
        moved: false,
      };
    } else if (objectId) {
      onSelect(objectId);
      const o = plan.objects.find((o) => o.id === objectId);
      if (!o || o.locked) return;
      gesture.current = {
        type:
          handle === "resize"
            ? "resize"
            : handle === "rotate"
              ? "rotate"
              : "move",
        start,
        original: plan,
        object: o,
        view: current,
        moved: false,
      };
    } else {
      onSelect(null);
      if (routeEdit && onRouteClick) {
        onRouteClick({ x: round(start.x), y: round(start.y) });
        return;
      }
      gesture.current = {
        type: "pan",
        start,
        original: plan,
        view: current,
        moved: false,
      };
    }
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function move(e: React.PointerEvent<SVGSVGElement>) {
    const g = gesture.current;
    if (!g) return;
    const now = point(e),
      dx = now.x - g.start.x,
      dy = now.y - g.start.y;
    if (Math.hypot(dx, dy) < 0.015 && !g.moved) return;
    g.moved = true;
    if (g.type === "pan") {
      setView({ ...g.view, x: current.x - dx, y: current.y - dy });
      return;
    }
    const p = structuredClone(g.original),
      o = p.objects.find((o) => o.id === g.object?.id),
      nextGuides: { axis: "x" | "y"; value: number }[] = [];
    if (g.type === "route" && g.pointIndex !== undefined) {
      p.queue.points[g.pointIndex] = {
        x: round(
          Math.min(
            p.width - p.queue.laneWidth / 2,
            Math.max(p.queue.laneWidth / 2, now.x),
          ),
        ),
        y: round(
          Math.min(
            p.depth + p.queue.depth - p.queue.laneWidth / 2,
            Math.max(p.depth + p.queue.laneWidth / 2, now.y),
          ),
        ),
      };
      p.queue.template = "custom";
    }
    if (o && g.object) {
      if (g.type === "move") {
        o.x = round(g.object.x + dx);
        o.y = round(g.object.y + dy);
        if (snap && !e.shiftKey) {
          o.x = round(Math.round(o.x * 10) / 10);
          o.y = round(Math.round(o.y * 10) / 10);
          const xs = [0, p.width / 2, p.width],
            ys = [0, p.depth / 2, p.depth];
          p.objects
            .filter((b) => b.id !== o.id && b.kind !== "structure")
            .forEach((b) => {
              xs.push(b.x, b.x + b.width, b.x + b.width / 2);
              ys.push(b.y, b.y + b.depth, b.y + b.depth / 2);
            });
          for (const axis of ["x", "y"] as const) {
            const dimension = axis === "x" ? o.width : o.depth,
              targets = axis === "x" ? xs : ys;
            let best = 0.075,
              adjust = 0,
              guide: number | undefined;
            for (const offset of [0, dimension / 2, dimension])
              for (const value of targets) {
                const delta = value - (o[axis] + offset);
                if (Math.abs(delta) < best) {
                  best = Math.abs(delta);
                  adjust = delta;
                  guide = value;
                }
              }
            o[axis] = round(o[axis] + adjust);
            if (guide !== undefined) nextGuides.push({ axis, value: guide });
          }
        }
      }
      if (g.type === "resize") {
        const a = (-o.rotation * Math.PI) / 180,
          rx = dx * Math.cos(a) - dy * Math.sin(a),
          ry = dx * Math.sin(a) + dy * Math.cos(a);
        const width = round(Math.min(100, Math.max(0.1, g.object.width + rx))),
          depth = round(Math.min(100, Math.max(0.1, g.object.depth + ry)));
        if (validDimension(width) && validDimension(depth)) {
          const angle = (o.rotation * Math.PI) / 180,
            dw = width - g.object.width,
            dd = depth - g.object.depth;
          o.x = round(
            g.object.x + (dw * Math.cos(angle) - dd * Math.sin(angle) - dw) / 2,
          );
          o.y = round(
            g.object.y + (dw * Math.sin(angle) + dd * Math.cos(angle) - dd) / 2,
          );
          o.width = width;
          o.depth = depth;
        }
      }
      if (g.type === "rotate") {
        const cx = o.x + o.width / 2,
          cy = o.y + o.depth / 2;
        const angle = (Math.atan2(now.y - cy, now.x - cx) * 180) / Math.PI + 90;
        o.rotation = round(
          snap && !e.shiftKey ? Math.round(angle / 15) * 15 : angle,
        );
      }
    }
    draftRef.current = p;
    setDraft(p);
    setGuides(nextGuides);
  }
  function end(e: React.PointerEvent<SVGSVGElement>, cancel = false) {
    if (gesture.current?.moved && draftRef.current && !cancel)
      onCommit(draftRef.current);
    gesture.current = null;
    draftRef.current = null;
    setDraft(null);
    setGuides([]);
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
  }
  const zoom = (factor: number) => {
    const w = Math.min(250, Math.max(2, current.width * factor)),
      h = (w * size.h) / size.w;
    setView({
      x: current.x + (current.width - w) / 2,
      y: current.y + (current.height - h) / 2,
      width: w,
      height: h,
    });
  };
  return (
    <div className="canvas-host" ref={host}>
      <div className="canvas-tip">
        {routeEdit
          ? "Click to add route points · drag numbered points to adjust"
          : mode === "pan"
            ? "Drag to pan your plan"
            : "Select an item to edit · drag empty space to pan"}
      </div>
      <svg
        ref={svg}
        className={`drawing mode-${mode}`}
        viewBox={`${current.x} ${current.y} ${current.width} ${current.height}`}
        aria-label="Stand and customer queue plan"
        onPointerDown={begin}
        onPointerMove={move}
        onPointerUp={(e) => end(e)}
        onPointerCancel={(e) => end(e, true)}
        onKeyDown={(e) => {
          const id = (e.target as Element)
            .closest("[data-object]")
            ?.getAttribute("data-object");
          if (id && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onSelect(id);
          }
          if (
            id &&
            ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)
          ) {
            e.preventDefault();
            const o = plan.objects.find((o) => o.id === id);
            if (o && !o.locked) {
              const amount = e.shiftKey ? 1 : 0.1;
              onCommit({
                ...plan,
                objects: plan.objects.map((v) =>
                  v.id !== id
                    ? v
                    : {
                        ...v,
                        x: round(
                          v.x +
                            (e.key === "ArrowRight"
                              ? amount
                              : e.key === "ArrowLeft"
                                ? -amount
                                : 0),
                        ),
                        y: round(
                          v.y +
                            (e.key === "ArrowDown"
                              ? amount
                              : e.key === "ArrowUp"
                                ? -amount
                                : 0),
                        ),
                      },
                ),
              });
            }
          }
        }}
      >
        <PlanScene
          plan={shown}
          selectedId={selectedId}
          errorIds={errorIds}
          showGrid={grid}
          routeEdit={routeEdit}
          guides={guides}
        />
      </svg>
      <div
        className="canvas-toolbar"
        role="toolbar"
        aria-label="Canvas controls"
      >
        <button
          title="Select items"
          aria-label="Select items"
          aria-pressed={mode === "select"}
          onClick={() => setMode("select")}
        >
          <MousePointer2 size={18} />
        </button>
        <button
          title="Pan canvas"
          aria-label="Pan canvas"
          aria-pressed={mode === "pan"}
          onClick={() => setMode("pan")}
        >
          <Hand size={18} />
        </button>
        <span className="toolbar-separator" />
        <button
          title="Zoom out"
          aria-label="Zoom out"
          onClick={() => zoom(1.25)}
        >
          <ZoomOut size={18} />
        </button>
        <span className="zoom-label">
          {Math.round((size.w / current.width / 40) * 100)}%
        </span>
        <button title="Zoom in" aria-label="Zoom in" onClick={() => zoom(0.8)}>
          <ZoomIn size={18} />
        </button>
        <span className="toolbar-separator" />
        <button
          title="Fit pitch"
          aria-label="Fit pitch"
          onClick={() => setView(fit(false))}
        >
          <Scan size={18} />
        </button>
        <button
          title="Fit whole plan"
          aria-label="Fit whole plan"
          onClick={() => setView(null)}
        >
          <Maximize size={18} />
        </button>
        <span className="toolbar-separator" />
        <button
          title="Snap to grid and items. Hold Shift while dragging to bypass."
          aria-label="Snap to grid and items"
          aria-pressed={snap}
          onClick={() => setSnap(!snap)}
        >
          <Magnet size={18} />
        </button>
        <button
          title="Show grid"
          aria-label="Show grid"
          aria-pressed={grid}
          onClick={() => setGrid(!grid)}
        >
          <Grid2X2 size={18} />
        </button>
      </div>
      <div className="canvas-scale">Each grid square = 1 m</div>
    </div>
  );
}
