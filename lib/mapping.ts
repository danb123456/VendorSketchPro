import { Plan, Point } from "../types";
import { corners, parsePlan } from "./model";
const number = (v: number) => Number(v.toFixed(6));
const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!,
  );
export function mapBounds(p: Plan) {
  const points = [
    ...p.objects.flatMap((o) => corners(o)),
    ...p.queue.points.flatMap((v) => [
      { x: v.x - p.queue.laneWidth / 2, y: v.y - p.queue.laneWidth / 2 },
      { x: v.x + p.queue.laneWidth / 2, y: v.y + p.queue.laneWidth / 2 },
    ]),
  ];
  const x = Math.min(0, ...points.map((v) => v.x)),
    y = Math.min(0, ...points.map((v) => v.y)),
    right = Math.max(p.width, ...points.map((v) => v.x)),
    bottom = Math.max(p.depth + p.queue.depth, ...points.map((v) => v.y));
  return { x, y, width: right - x, height: bottom - y };
}
export function cadPoint(p: Plan, v: Point): Point {
  return { x: number(v.x), y: number(p.depth - v.y) };
}
export function mappingData(input: Plan) {
  const p = parsePlan(input);
  return {
    format: "vendorsketch-event-map",
    schemaVersion: 1,
    units: "metres",
    origin: "front-left corner of pitch",
    axes: {
      x: "right along frontage",
      y: "towards back of stand; queue has negative y",
    },
    placement:
      "Local stand coordinates only; position and rotate in the event master plan.",
    vendor: {
      id: p.vendorId,
      name: p.traderName,
      event: p.eventName,
      planId: p.id,
      revision: p.revision,
    },
    updatedAt: p.updatedAt,
    pitch: {
      width: p.width,
      depth: p.depth,
      polygon: [
        { x: 0, y: 0 },
        { x: p.width, y: 0 },
        { x: p.width, y: p.depth },
        { x: 0, y: p.depth },
      ],
    },
    equipment: p.objects.map((o) => ({
      id: o.id,
      type: o.type,
      name: o.name,
      width: o.width,
      depth: o.depth,
      rotationDegrees: -o.rotation,
      center: cadPoint(p, { x: o.x + o.width / 2, y: o.y + o.depth / 2 }),
      polygon: corners(o).map((v) => cadPoint(p, v)),
      clearance: o.clearance,
      notes: o.notes,
    })),
    queue: {
      laneWidth: p.queue.laneWidth,
      depth: p.queue.depth,
      centerline: p.queue.points.map((v) => cadPoint(p, v)),
      personSpacing: p.queue.personSpacing,
      target: p.queue.target,
    },
    overlay: {
      origin: "back-left corner of pitch",
      axes: { x: "right", y: "towards customer queue" },
      bounds: mapBounds(p),
    },
    notes: p.notes,
  };
}
export function mapSvg(input: Plan): string {
  const p = parsePlan(input),
    b = mapBounds(p),
    points = (a: Point[]) =>
      a.map((v) => `${number(v.x)},${number(v.y)}`).join(" ");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${number(b.width * 1000)}mm" height="${number(b.height * 1000)}mm" viewBox="${b.x} ${b.y} ${b.width} ${b.height}"><title>${escape(p.traderName)} — stand overlay, metres</title><metadata>${escape(JSON.stringify(mappingData(p)))}</metadata><g id="pitch"><rect x="0" y="0" width="${p.width}" height="${p.depth}" fill="none" stroke="#202420" stroke-width="0.035"/></g><g id="queue-zone"><rect x="0" y="${p.depth}" width="${p.width}" height="${p.queue.depth}" fill="none" stroke="#b87943" stroke-width="0.025" stroke-dasharray=".12 .08"/></g><g id="equipment">${p.objects.map((o) => `<g data-item="${escape(o.id)}"><title>${escape(o.name)} (${o.width} x ${o.depth} m)</title><polygon points="${points(corners(o))}" fill="${o.color}" fill-opacity="${o.kind === "structure" ? ".1" : ".8"}" stroke="${o.color}" stroke-width=".025"/></g>`).join("")}</g><g id="queue-route"><polyline points="${points(p.queue.points)}" fill="none" stroke="#b87943" stroke-width="${p.queue.laneWidth}" stroke-opacity=".18" stroke-linejoin="round"/><polyline points="${points(p.queue.points)}" fill="none" stroke="#9b572a" stroke-width=".035"/></g></svg>`;
}
export function mapDxf(input: Plan): string {
  const p = parsePlan(input),
    data = mappingData(p),
    pairs: (string | number)[] = [];
  const add = (...v: (string | number)[]) => pairs.push(...v);
  add(
    0,
    "SECTION",
    2,
    "HEADER",
    9,
    "$ACADVER",
    1,
    "AC1015",
    9,
    "$INSUNITS",
    70,
    6,
    9,
    "$MEASUREMENT",
    70,
    1,
    0,
    "ENDSEC",
    0,
    "SECTION",
    2,
    "TABLES",
    0,
    "TABLE",
    2,
    "LAYER",
    70,
    4,
  );
  for (const [layer, color] of [
    ["PITCH", 7],
    ["EQUIPMENT", 3],
    ["QUEUE_ZONE", 30],
    ["QUEUE_ROUTE", 30],
  ] as const)
    add(
      0,
      "LAYER",
      100,
      "AcDbSymbolTableRecord",
      100,
      "AcDbLayerTableRecord",
      2,
      layer,
      70,
      0,
      62,
      color,
      6,
      "CONTINUOUS",
    );
  add(0, "ENDTAB", 0, "ENDSEC", 0, "SECTION", 2, "ENTITIES");
  const polygon = (layer: string, vertices: Point[], closed: boolean) => {
    if (vertices.length < 2) return;
    add(
      0,
      "LWPOLYLINE",
      100,
      "AcDbEntity",
      8,
      layer,
      100,
      "AcDbPolyline",
      90,
      vertices.length,
      70,
      closed ? 1 : 0,
    );
    for (const v of vertices) add(10, number(v.x), 20, number(v.y));
  };
  polygon("PITCH", data.pitch.polygon, true);
  for (const o of data.equipment) polygon("EQUIPMENT", o.polygon, true);
  polygon(
    "QUEUE_ZONE",
    [
      { x: 0, y: 0 },
      { x: p.width, y: 0 },
      { x: p.width, y: -p.queue.depth },
      { x: 0, y: -p.queue.depth },
    ],
    true,
  );
  polygon("QUEUE_ROUTE", data.queue.centerline, false);
  add(0, "ENDSEC", 0, "EOF");
  return pairs.join("\n") + "\n";
}
export function rasterSize(
  width: number,
  height: number,
  preferredWidth = 2400,
) {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  )
    throw Error("Invalid export dimensions.");
  const scale = Math.min(
    preferredWidth / width,
    8192 / width,
    8192 / height,
    Math.sqrt(12_000_000 / (width * height)),
  );
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}
