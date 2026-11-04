import React, { useEffect, useRef, useState } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Scan,
  Magnet,
  Grid2X2,
  ChevronDown,
} from "lucide-react";
import { CatalogItem, Plan, Point, StandObject } from "../types";
import { round } from "../lib/model";
import { pinchView, View } from "../lib/builder";
import { PlanScene, sceneBounds } from "./PlanScene";
interface Props {
  plan: Plan;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onCommit: (p: Plan) => void;
  errorIds: Set<string>;
  routeEdit: boolean;
  onRouteClick?: (p: Point) => void;
  focusWhole?: boolean;
  placing?: CatalogItem | null;
  onPlace?: (p: Point) => void;
}
type Gesture = {
  type: "move" | "resize" | "rotate" | "pan" | "place" | "route-add" | "route";
  start: Point;
  screen: Point;
  original: Plan;
  object?: StandObject;
  pointIndex?: number;
  view: View;
  moved: boolean;
};
export default function Canvas({
  plan,
  selectedId,
  onSelect,
  onCommit,
  errorIds,
  routeEdit,
  onRouteClick,
  placing,
  focusWhole = false,
  onPlace,
}: Props) {
  const host = useRef<HTMLDivElement>(null),
    svg = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: 800, h: 600 }),
    [view, setView] = useState<View | null>(null),
    [snap, setSnap] = useState(true),
    [grid, setGrid] = useState(true),
    [draft, setDraft] = useState<Plan | null>(null),
    [advanced, setAdvanced] = useState(false),
    [hover, setHover] = useState<Point | null>(null);
  const gesture = useRef<Gesture | null>(null),
    draftRef = useRef<Plan | null>(null),
    pointers = useRef(new Map<number, Point>()),
    pinch = useRef<{ view: View; a: Point; b: Point } | null>(null),
    blocked = useRef(false);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      setSize({ w: entry.contentRect.width, h: entry.contentRect.height });
      setView(null);
    });
    if (host.current) observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    gesture.current = null;
    pointers.current.clear();
    pinch.current = null;
    blocked.current = false;
    draftRef.current = null;
    setDraft(null);
  }, [plan.id]);
  const fit = (whole: boolean): View => {
    const b = sceneBounds(plan, whole),
      ratio = size.w / Math.max(1, size.h);
    if (b.width / b.height < ratio) {
      const width = b.height * ratio;
      return { ...b, x: b.x - (width - b.width) / 2, width };
    }
    const height = b.width / ratio;
    return { ...b, y: b.y - (height - b.height) / 2, height };
  };
  useEffect(() => setView(null), [focusWhole]);
  const current = view || fit(focusWhole),
    shown = draft || plan;
  const screen = (e: React.PointerEvent<SVGSVGElement>): Point => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const world = (s: Point, v = current): Point => ({
    x: v.x + (s.x / size.w) * v.width,
    y: v.y + (s.y / size.h) * v.height,
  });
  function begin(e: React.PointerEvent<SVGSVGElement>) {
    if (e.pointerType !== "touch" && e.button !== 0) return;
    const s = screen(e);
    pointers.current.set(e.pointerId, s);
    e.currentTarget.setPointerCapture(e.pointerId);
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { view: current, a, b };
      gesture.current = null;
      draftRef.current = null;
      setDraft(null);
      return;
    }
    if (pointers.current.size > 2 || blocked.current) return;
    const start = world(s),
      target = e.target as Element,
      id = target.closest("[data-object]")?.getAttribute("data-object"),
      handle = target.getAttribute("data-handle"),
      routePoint = target.getAttribute("data-route-point");
    let type: Gesture["type"] = "pan",
      object: StandObject | undefined;
    if (placing) type = "place";
    else if (routePoint !== null) type = "route";
    else if (id && !e.altKey) {
      onSelect(id);
      object = plan.objects.find((o) => o.id === id);
      if (!object || object.locked) return;
      type =
        handle === "resize"
          ? "resize"
          : handle === "rotate"
            ? "rotate"
            : "move";
    } else if (routeEdit && onRouteClick && !e.altKey) type = "route-add";
    gesture.current = {
      type,
      start,
      screen: s,
      original: plan,
      object,
      pointIndex: routePoint !== null ? Number(routePoint) : undefined,
      view: current,
      moved: false,
    };
  }
  function move(e: React.PointerEvent<SVGSVGElement>) {
    const s = screen(e);
    if (placing && e.pointerType === "mouse") setHover(world(s));
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, s);
    if (pinch.current && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()],
        p = pinch.current;
      setView(
        pinchView(p.view, p.a, p.b, a, b, { width: size.w, height: size.h }),
      );
      return;
    }
    if (blocked.current) return;
    const g = gesture.current;
    if (!g) return;
    if (!g.moved && Math.hypot(s.x - g.screen.x, s.y - g.screen.y) < 6) return;
    g.moved = true;
    const dx = ((s.x - g.screen.x) / size.w) * g.view.width,
      dy = ((s.y - g.screen.y) / size.h) * g.view.height;
    if (g.type === "pan" || g.type === "place" || g.type === "route-add") {
      setView({ ...g.view, x: g.view.x - dx, y: g.view.y - dy });
      return;
    }
    const now = world(s, g.view),
      p = structuredClone(g.original),
      o = p.objects.find((o) => o.id === g.object?.id);
    if (g.type === "route" && g.pointIndex !== undefined) {
      p.queue.points[g.pointIndex] = {
        x: round(
          Math.max(
            p.queue.laneWidth / 2,
            Math.min(p.width - p.queue.laneWidth / 2, now.x),
          ),
        ),
        y: round(
          Math.max(
            p.depth + p.queue.laneWidth / 2,
            Math.min(p.depth + p.queue.depth - p.queue.laneWidth / 2, now.y),
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
          const targets = {
            x: [0, p.width / 2, p.width],
            y: [0, p.depth / 2, p.depth],
          };
          p.objects
            .filter((b) => b.id !== o.id && b.kind !== "structure")
            .forEach((b) => {
              targets.x.push(b.x, b.x + b.width, b.x + b.width / 2);
              targets.y.push(b.y, b.y + b.depth, b.y + b.depth / 2);
            });
          for (const axis of ["x", "y"] as const) {
            const length = axis === "x" ? o.width : o.depth;
            let closest = 0.07,
              delta = 0;
            for (const offset of [0, length / 2, length])
              for (const target of targets[axis]) {
                const diff = target - o[axis] - offset;
                if (Math.abs(diff) < closest) {
                  closest = Math.abs(diff);
                  delta = diff;
                }
              }
            o[axis] = round(o[axis] + delta);
          }
        }
      }
      if (g.type === "rotate") {
        const angle =
          (Math.atan2(
            now.y - (o.y + o.depth / 2),
            now.x - (o.x + o.width / 2),
          ) *
            180) /
            Math.PI +
          90;
        o.rotation = round(
          snap && !e.shiftKey ? Math.round(angle / 15) * 15 : angle,
        );
      }
      if (g.type === "resize") {
        const angle = (o.rotation * Math.PI) / 180,
          rx = dx * Math.cos(angle) + dy * Math.sin(angle),
          ry = -dx * Math.sin(angle) + dy * Math.cos(angle),
          width = round(Math.min(100, Math.max(0.1, g.object.width + rx))),
          depth = round(Math.min(100, Math.max(0.1, g.object.depth + ry))),
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
    draftRef.current = p;
    setDraft(p);
  }
  function end(e: React.PointerEvent<SVGSVGElement>, cancel = false) {
    pointers.current.delete(e.pointerId);
    if (pinch.current || blocked.current) {
      pinch.current = null;
      blocked.current = pointers.current.size > 0;
      gesture.current = null;
      draftRef.current = null;
      setDraft(null);
    } else {
      const g = gesture.current;
      if (!cancel && g) {
        if (g.moved && draftRef.current) onCommit(draftRef.current);
        else if (!g.moved) {
          if (g.type === "place") onPlace?.(g.start);
          else if (g.type === "route-add") onRouteClick?.(g.start);
          else if (g.type === "pan") onSelect(null);
        }
      }
      gesture.current = null;
      draftRef.current = null;
      setDraft(null);
    }
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
  }
  const zoom = (factor: number) => {
    const width = Math.min(250, Math.max(2, current.width * factor)),
      height = (width * size.h) / size.w;
    setView({
      x: current.x + (current.width - width) / 2,
      y: current.y + (current.height - height) / 2,
      width,
      height,
    });
  };
  return (
    <div className={`canvas-host ${placing ? "placing" : ""}`} ref={host}>
      <div className="canvas-tip">
        {placing
          ? `Tap to place ${placing.type.toLowerCase()}`
          : routeEdit
            ? "Tap to add queue points · drag a point to adjust"
            : "Drag to move · pinch to zoom"}
      </div>
      <svg
        ref={svg}
        className="drawing"
        viewBox={`${current.x} ${current.y} ${current.width} ${current.height}`}
        aria-label="Stand and customer queue plan"
        onPointerDown={begin}
        onPointerMove={move}
        onPointerUp={(e) => end(e)}
        onPointerCancel={(e) => end(e, true)}
        onPointerLeave={() => setHover(null)}
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
            const amount = e.shiftKey ? 1 : 0.1;
            onCommit({
              ...plan,
              objects: plan.objects.map((o) =>
                o.id !== id || o.locked
                  ? o
                  : {
                      ...o,
                      x: round(
                        o.x +
                          (e.key === "ArrowRight"
                            ? amount
                            : e.key === "ArrowLeft"
                              ? -amount
                              : 0),
                      ),
                      y: round(
                        o.y +
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
        }}
      >
        <PlanScene
          plan={shown}
          selectedId={selectedId}
          errorIds={errorIds}
          showGrid={grid}
          routeEdit={routeEdit}
        />
        {placing && hover && (
          <rect
            x={Math.round((hover.x - placing.width / 2) * 10) / 10}
            y={Math.round((hover.y - placing.depth / 2) * 10) / 10}
            width={placing.width}
            height={placing.depth}
            fill={placing.color + "44"}
            stroke="#df702a"
            strokeWidth=".05"
            strokeDasharray=".12 .08"
            pointerEvents="none"
          />
        )}
      </svg>
      <div
        className="canvas-toolbar"
        role="toolbar"
        aria-label="Canvas controls"
      >
        <button aria-label="Zoom out" onClick={() => zoom(1.25)}>
          <ZoomOut size={20} />
        </button>
        <button aria-label="Zoom in" onClick={() => zoom(0.8)}>
          <ZoomIn size={20} />
        </button>
        <button aria-label="Fit whole plan" onClick={() => setView(fit(true))}>
          <Maximize size={20} />
        </button>
        <button
          aria-label="More canvas controls"
          aria-expanded={advanced}
          onClick={() => setAdvanced(!advanced)}
        >
          <ChevronDown size={20} />
        </button>
        {advanced && (
          <div className="extra-canvas-controls">
            <button aria-label="Fit pitch" onClick={() => setView(fit(false))}>
              <Scan size={20} />
              <span>Fit pitch</span>
            </button>
            <button
              aria-label="Snap to grid and items"
              aria-pressed={snap}
              onClick={() => setSnap(!snap)}
            >
              <Magnet size={20} />
              <span>Snap</span>
            </button>
            <button
              aria-label="Show grid"
              aria-pressed={grid}
              onClick={() => setGrid(!grid)}
            >
              <Grid2X2 size={20} />
              <span>Grid</span>
            </button>
          </div>
        )}
      </div>
      <div className="canvas-scale">1 square = 1 metre</div>
    </div>
  );
}
