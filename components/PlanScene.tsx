import { Plan } from "../types";
import { Symbol } from "./Symbol";
import { corners } from "../lib/model";
export function sceneBounds(p: Plan, whole = true) {
  const points = whole ? p.objects.flatMap((o) => corners(o)) : [];
  const x = Math.min(0, ...points.map((v) => v.x)),
    y = Math.min(0, ...points.map((v) => v.y));
  const right = Math.max(p.width, ...points.map((v) => v.x)),
    bottom = Math.max(
      p.depth + (whole ? p.queue.depth : 0),
      ...points.map((v) => v.y),
    );
  return {
    x: x - 1,
    y: y - 1.25,
    width: right - x + 2,
    height: bottom - y + 2.2,
  };
}
export function PlanScene({
  plan,
  selectedId = null,
  errorIds = new Set<string>(),
  showGrid = true,
  print = false,
  routeEdit = false,
  guides = [],
}: {
  plan: Plan;
  selectedId?: string | null;
  errorIds?: Set<string>;
  showGrid?: boolean;
  print?: boolean;
  routeEdit?: boolean;
  guides?: { axis: "x" | "y"; value: number }[];
}) {
  const p = plan,
    poly = p.queue.points.map((v) => `${v.x},${v.y}`).join(" ");
  return (
    <>
      <defs>
        <pattern id="grid" width="1" height="1" patternUnits="userSpaceOnUse">
          <path d="M1 0H0V1" fill="none" stroke="#e7dfd3" strokeWidth=".018" />
        </pattern>
        <pattern
          id="queue-hatch"
          width=".3"
          height=".3"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <path d="M0 0V.3" stroke="#f0dfc8" strokeWidth=".018" />
        </pattern>
        <marker
          id="route-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="4"
          markerHeight="4"
          orient="auto-start-reverse"
        >
          <path d="M0 0L10 5 0 10z" fill="#a75b28" />
        </marker>
      </defs>
      <rect x="0" y="0" width={p.width} height={p.depth} fill="white" />
      {showGrid && <rect width={p.width} height={p.depth} fill="url(#grid)" />}
      <rect
        x="0"
        y={p.depth}
        width={p.width}
        height={p.queue.depth}
        fill="#fcf3e6"
        stroke="#d3ab7d"
        strokeWidth=".025"
        strokeDasharray=".12 .09"
      />
      <rect
        x="0"
        y={p.depth}
        width={p.width}
        height={p.queue.depth}
        fill="url(#queue-hatch)"
      />
      <text
        x={p.width / 2}
        y={p.depth + p.queue.depth + 0.38}
        textAnchor="middle"
        fill="#936333"
        fontSize=".21"
        fontWeight="600"
      >
        CUSTOMER QUEUE ZONE · {p.width} × {p.queue.depth} m
      </text>
      <text
        x={p.width / 2}
        y={p.depth + p.queue.depth + 0.68}
        textAnchor="middle"
        fill="#8b7355"
        fontSize=".17"
      >
        Planning area only · subject to organiser confirmation
      </text>
      {poly && (
        <>
          <polyline
            points={poly}
            fill="none"
            stroke="#f2d5b1"
            strokeWidth={p.queue.laneWidth}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <polyline
            points={poly}
            fill="none"
            stroke="#a75b28"
            strokeWidth=".045"
            strokeDasharray=".14 .10"
            markerEnd="url(#route-arrow)"
          />
          <circle
            cx={p.queue.points[0].x}
            cy={p.queue.points[0].y}
            r=".12"
            fill="#a75b28"
          />
          <text
            x={p.queue.points[0].x}
            y={p.queue.points[0].y + 0.36}
            textAnchor="middle"
            fontSize=".18"
            fill="#783b18"
          >
            QUEUE START
          </text>
        </>
      )}
      {!poly && (
        <text
          x={p.width / 2}
          y={p.depth + p.queue.depth / 2}
          textAnchor="middle"
          fontSize=".24"
          fill="#7b998b"
        >
          Plan your customer queue here
        </text>
      )}
      <rect
        x="0"
        y="0"
        width={p.width}
        height={p.depth}
        fill="none"
        stroke="#1d211e"
        strokeWidth=".045"
      />
      <path
        d={`M0 -.45V-.65H${p.width}V-.45M-.45 0H-.65V${p.depth}H-.45`}
        fill="none"
        stroke="#90a39a"
        strokeWidth=".025"
      />
      <text
        x={p.width / 2}
        y="-.78"
        textAnchor="middle"
        fontSize=".22"
        fontWeight="600"
        fill="#625e58"
      >
        FRONTAGE {p.width} m
      </text>
      <text
        x="-.86"
        y={p.depth / 2}
        textAnchor="middle"
        fontSize=".2"
        fill="#625e58"
        transform={`rotate(-90 -.86 ${p.depth / 2})`}
      >
        DEPTH {p.depth} m
      </text>
      <text
        x={p.width / 2}
        y="-.15"
        textAnchor="middle"
        fontSize=".16"
        letterSpacing=".025"
        fill="#8b7355"
      >
        BACK OF STAND
      </text>
      <rect
        x={p.width / 2 - 1.3}
        y={p.depth - 0.13}
        width="2.6"
        height=".3"
        rx=".07"
        fill="#1d211e"
      />
      <text
        x={p.width / 2}
        y={p.depth + 0.075}
        textAnchor="middle"
        fontSize=".16"
        fill="white"
      >
        CUSTOMER-FACING FRONT
      </text>
      {[...p.objects]
        .sort(
          (a, b) =>
            Number(b.kind === "structure") - Number(a.kind === "structure"),
        )
        .map((o) => {
          const index = p.objects.findIndex((v) => v.id === o.id) + 1,
            selected = selectedId === o.id,
            error = errorIds.has(o.id),
            iconSize = Math.min(o.width * 0.55, o.depth * 0.5, 0.55),
            small = Math.min(o.width, o.depth) < 0.6;
          return (
            <g
              key={o.id}
              data-object={o.id}
              tabIndex={print ? undefined : 0}
              role={print ? undefined : "button"}
              aria-label={
                print
                  ? undefined
                  : `${o.name}, item ${index}, ${o.width} by ${o.depth} metres${error ? ", has an issue" : ""}${o.locked ? ", locked" : ""}`
              }
              transform={`translate(${o.x} ${o.y}) rotate(${o.rotation} ${o.width / 2} ${o.depth / 2})`}
              style={{
                cursor: print ? "default" : o.locked ? "pointer" : "move",
                outline: "none",
              }}
            >
              {o.clearance > 0 && (
                <rect
                  x={-o.clearance}
                  y={-o.clearance}
                  width={o.width + 2 * o.clearance}
                  height={o.depth + 2 * o.clearance}
                  rx=".03"
                  fill="none"
                  stroke="#c19750"
                  strokeWidth=".025"
                  strokeDasharray=".09 .07"
                />
              )}
              <rect
                width={o.width}
                height={o.depth}
                rx={o.kind === "staff" ? Math.min(o.width, o.depth) / 2 : 0.035}
                fill={o.kind === "structure" ? `${o.color}18` : o.color}
                stroke={
                  error
                    ? "#bc4d42"
                    : selected
                      ? "#df702a"
                      : o.kind === "structure"
                        ? o.color
                        : "#ffffff"
                }
                strokeWidth={selected ? 0.055 : 0.025}
                strokeDasharray={o.kind === "structure" ? ".12 .07" : undefined}
              />
              {o.kind === "structure" && o.symbol === "tent" && (
                <path
                  d={`M0 0L${o.width} ${o.depth}M${o.width} 0L0 ${o.depth}`}
                  stroke={o.color}
                  opacity=".35"
                  strokeWidth=".025"
                />
              )}
              {!small && (
                <svg
                  x={(o.width - iconSize) / 2}
                  y={Math.max(0.05, (o.depth - iconSize) / 2 - 0.1)}
                  width={iconSize}
                  height={iconSize}
                  viewBox="0 0 24 24"
                  pointerEvents="none"
                >
                  <Symbol
                    name={o.symbol}
                    color={o.kind === "structure" ? "#625e58" : "white"}
                  />
                </svg>
              )}
              <text
                x={o.width / 2}
                y={small ? o.depth / 2 + 0.055 : o.depth - 0.12}
                textAnchor="middle"
                fill={o.kind === "structure" ? "#625e58" : "white"}
                fontSize={Math.min(
                  0.18,
                  Math.max(0.12, o.width / (o.name.length * 0.58)),
                )}
                fontWeight="600"
                pointerEvents="none"
              >
                {small ? index : o.name}
              </text>
              {!small && (
                <>
                  <circle
                    cx=".12"
                    cy=".12"
                    r=".14"
                    fill="white"
                    stroke={o.color}
                    strokeWidth=".02"
                  />
                  <text
                    x=".12"
                    y=".175"
                    textAnchor="middle"
                    fill="#1d211e"
                    fontSize=".16"
                    fontWeight="700"
                    pointerEvents="none"
                  >
                    {index}
                  </text>
                </>
              )}
              {error && (
                <>
                  <circle cx={o.width} cy="0" r=".14" fill="#bc4d42" />
                  <text
                    x={o.width}
                    y=".06"
                    textAnchor="middle"
                    fill="white"
                    fontSize=".21"
                    fontWeight="700"
                  >
                    !
                  </text>
                </>
              )}
              {selected && !print && !o.locked && (
                <>
                  <circle
                    data-handle="rotate"
                    data-object={o.id}
                    cx={o.width / 2}
                    cy="-.42"
                    r=".14"
                    fill="white"
                    stroke="#df702a"
                    strokeWidth=".035"
                    style={{ cursor: "grab" }}
                  />
                  <path
                    d={`M${o.width / 2} -.28V0`}
                    stroke="#df702a"
                    strokeWidth=".025"
                    pointerEvents="none"
                  />
                  <rect
                    data-handle="resize"
                    data-object={o.id}
                    x={o.width - 0.13}
                    y={o.depth - 0.13}
                    width=".26"
                    height=".26"
                    rx=".04"
                    fill="#df702a"
                    stroke="white"
                    strokeWidth=".025"
                    style={{ cursor: "nwse-resize" }}
                  />
                </>
              )}
            </g>
          );
        })}
      {routeEdit &&
        p.queue.points.map((v, i) => (
          <g key={i}>
            <circle
              data-route-point={i}
              cx={v.x}
              cy={v.y}
              r=".17"
              fill="white"
              stroke="#df702a"
              strokeWidth=".045"
              style={{ cursor: "move" }}
            />
            <text
              x={v.x}
              y={v.y + 0.06}
              textAnchor="middle"
              fill="#df702a"
              fontSize=".17"
              pointerEvents="none"
            >
              {i + 1}
            </text>
          </g>
        ))}
      {guides.map((g, i) => (
        <line
          key={i}
          x1={g.axis === "x" ? g.value : -1}
          x2={g.axis === "x" ? g.value : p.width + 1}
          y1={g.axis === "y" ? g.value : -1}
          y2={g.axis === "y" ? g.value : p.depth + 1}
          stroke="#ae79c1"
          strokeWidth=".025"
          strokeDasharray=".1 .1"
          pointerEvents="none"
        />
      ))}
    </>
  );
}
