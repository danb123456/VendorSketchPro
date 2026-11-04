import {
  CATALOG,
  CatalogItem,
  Issue,
  Plan,
  Point,
  StandObject,
} from "../types";
export const uid = () => globalThis.crypto.randomUUID();
export const round = (n: number) => Math.round(n * 100) / 100;
export const validDimension = (n: number) =>
  Number.isFinite(n) && n >= 0.1 && n <= 100;
export function createPlan(vendorId: string, traderName: string): Plan {
  return {
    schema: 2,
    id: uid(),
    vendorId: vendorId.trim(),
    traderName: traderName.trim(),
    eventName: "Savour",
    width: 7,
    depth: 5,
    pitchConfirmed: false,
    objects: [],
    queue: {
      depth: 6,
      laneWidth: 1.2,
      personSpacing: 0.7,
      target: 35,
      points: [],
      template: "none",
    },
    notes: "",
    updatedAt: new Date().toISOString(),
    revision: 1,
  };
}
export function corners(o: StandObject, clearance = 0): Point[] {
  const a = (o.rotation * Math.PI) / 180,
    c = Math.cos(a),
    s = Math.sin(a),
    cx = o.x + o.width / 2,
    cy = o.y + o.depth / 2;
  return [
    [-o.width / 2 - clearance, -o.depth / 2 - clearance],
    [o.width / 2 + clearance, -o.depth / 2 - clearance],
    [o.width / 2 + clearance, o.depth / 2 + clearance],
    [-o.width / 2 - clearance, o.depth / 2 + clearance],
  ].map(([x, y]) => ({ x: cx + x * c - y * s, y: cy + x * s + y * c }));
}
export function overlap(
  a: StandObject,
  b: StandObject,
  clearance = false,
): boolean {
  const pa = corners(a, clearance ? a.clearance : 0),
    pb = corners(b, clearance ? b.clearance : 0);
  return [...pa, ...pb].every((p, i) => {
    const polygon = i < 4 ? pa : pb,
      j = i % 4,
      q = polygon[(j + 1) % 4],
      axis = { x: -(q.y - p.y), y: q.x - p.x };
    const aa = pa.map((v) => v.x * axis.x + v.y * axis.y),
      bb = pb.map((v) => v.x * axis.x + v.y * axis.y);
    return (
      Math.max(...aa) > Math.min(...bb) + 0.00001 &&
      Math.max(...bb) > Math.min(...aa) + 0.00001
    );
  });
}
export function inPitch(o: StandObject, p: Plan): boolean {
  return corners(o).every(
    (v) =>
      v.x >= -0.001 &&
      v.y >= -0.001 &&
      v.x <= p.width + 0.001 &&
      v.y <= p.depth + 0.001,
  );
}
const solid = (o: StandObject) =>
  o.kind === "equipment" ||
  o.kind === "other" ||
  (o.kind === "point" && o.type.includes("counter"));
export function makeObject(c: CatalogItem, p: Plan): StandObject {
  const o: StandObject = {
    ...c,
    id: uid(),
    name: c.type,
    x: 0,
    y: 0,
    rotation: 0,
    locked: false,
    clearance: 0,
    notes: "",
  };
  if (c.kind === "barrier") {
    o.x = 0.2;
    o.y = p.depth + 0.35;
    return o;
  }
  if (c.kind === "point") {
    o.x = Math.max(0, (p.width - o.width) / 2);
    o.y = c.type === "Staff access" ? 0 : p.depth - o.depth;
    return o;
  }
  for (let y = 0.2; y + o.depth <= p.depth; y += 0.25)
    for (let x = 0.2; x + o.width <= p.width; x += 0.25) {
      o.x = round(x);
      o.y = round(y);
      if (
        o.kind === "structure" ||
        !p.objects.some((b) => solid(b) && overlap(o, b))
      )
        return o;
    }
  o.x = round(Math.max(0, (p.width - o.width) / 2));
  o.y = round(Math.max(0, (p.depth - o.depth) / 2));
  return o;
}
export function queueLength(points: Point[]): number {
  return points
    .slice(1)
    .reduce(
      (sum, p, i) => sum + Math.hypot(p.x - points[i].x, p.y - points[i].y),
      0,
    );
}
export const capacity = (p: Plan) =>
  Math.floor(queueLength(p.queue.points) / p.queue.personSpacing);
export function queueTemplate(
  p: Plan,
  type: "straight" | "serpentine" | "serpentine-horizontal",
): Point[] {
  const half = p.queue.laneWidth / 2,
    left = half,
    right = p.width - half,
    top = p.depth + half,
    bottom = p.depth + p.queue.depth - half;
  if (right < left || bottom <= top) return [];
  if (type === "straight")
    return [
      { x: p.width / 2, y: bottom },
      { x: p.width / 2, y: top },
    ];
  if (type === "serpentine-horizontal") {
    const rows = Math.min(
      100,
      Math.floor((p.queue.depth - p.queue.laneWidth) / p.queue.laneWidth) + 1,
    );
    const points: Point[] = [];
    for (let i = 0; i < rows; i++) {
      const y = round(bottom - i * p.queue.laneWidth);
      points.push(
        { x: round(i % 2 === 0 ? left : right), y },
        { x: round(i % 2 === 0 ? right : left), y },
      );
    }
    return points;
  }
  const lanes = Math.min(
    100,
    Math.floor((p.width - p.queue.laneWidth) / p.queue.laneWidth) + 1,
  );
  const points: Point[] = [];
  for (let i = 0; i < lanes; i++) {
    const x = left + i * p.queue.laneWidth;
    points.push(
      { x: round(x), y: i % 2 === 0 ? bottom : top },
      { x: round(x), y: i % 2 === 0 ? top : bottom },
    );
  }
  return points;
}
export function issuesFor(p: Plan): Issue[] {
  const list: Issue[] = [];
  if (!p.pitchConfirmed)
    list.push({
      id: "pitch",
      severity: "error",
      message: "Confirm your allocated pitch dimensions.",
      step: 1,
    });
  if (!p.objects.some((o) => o.kind === "equipment"))
    list.push({
      id: "equipment",
      severity: "warning",
      message: "Add your equipment and check its real dimensions.",
      step: 2,
    });
  if (!p.objects.some((o) => o.type === "Service counter"))
    list.push({
      id: "service",
      severity: "warning",
      message: "Mark where customers order or pay.",
      step: 2,
    });
  p.objects.forEach((o, i) => {
    if (
      (solid(o) || o.kind === "structure" || o.kind === "staff") &&
      !inPitch(o, p)
    )
      list.push({
        id: `bounds-${o.id}`,
        severity: "error",
        message: `${o.name} extends outside the pitch.`,
        objectId: o.id,
        step: 2,
      });
    if (
      o.kind === "barrier" &&
      corners(o).some(
        (v) =>
          v.x < 0 || v.x > p.width || v.y < 0 || v.y > p.depth + p.queue.depth,
      )
    )
      list.push({
        id: `barrier-${o.id}`,
        severity: "warning",
        message: `${o.name} extends outside the planning area.`,
        objectId: o.id,
        step: 3,
      });
    if (solid(o))
      p.objects
        .slice(i + 1)
        .filter(solid)
        .forEach((b) => {
          if (overlap(o, b))
            list.push({
              id: `overlap-${o.id}-${b.id}`,
              severity: "error",
              message: `${o.name} overlaps ${b.name}.`,
              objectId: o.id,
              step: 2,
            });
          else if ((o.clearance > 0 || b.clearance > 0) && overlap(o, b, true))
            list.push({
              id: `clearance-${o.id}-${b.id}`,
              severity: "warning",
              message: `Check working clearance between ${o.name} and ${b.name}.`,
              objectId: o.id,
              step: 2,
            });
        });
  });
  if (p.queue.laneWidth > p.width || p.queue.laneWidth >= p.queue.depth)
    list.push({
      id: "queue-size",
      severity: "error",
      message:
        "Queue lane width must fit within the frontage and queue zone depth.",
      step: 3,
    });
  const segments = p.queue.points
    .slice(1)
    .map((b, i) => ({ a: p.queue.points[i], b }));
  const cross = (a: Point, b: Point, c: Point) =>
    (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  let crossed = false;
  for (let i = 0; i < segments.length; i++)
    for (let j = i + 2; j < segments.length; j++) {
      const { a, b } = segments[i],
        { a: c, b: d } = segments[j];
      if (
        cross(a, b, c) * cross(a, b, d) < -0.00001 &&
        cross(c, d, a) * cross(c, d, b) < -0.00001
      )
        crossed = true;
    }
  if (crossed)
    list.push({
      id: "queue-crossing",
      severity: "warning",
      message:
        "The queue route crosses itself. Adjust the route so customers have a clear direction.",
      step: 3,
    });
  if (!p.queue.points.length)
    list.push({
      id: "queue",
      severity: "warning",
      message:
        "Add a customer queue route, or explain why one is not needed in plan notes.",
      step: 3,
    });
  else {
    if (
      p.queue.points.some(
        (v) =>
          v.x < p.queue.laneWidth / 2 - 0.01 ||
          v.x > p.width - p.queue.laneWidth / 2 + 0.01 ||
          v.y < p.depth + p.queue.laneWidth / 2 - 0.01 ||
          v.y > p.depth + p.queue.depth - p.queue.laneWidth / 2 + 0.01,
      )
    )
      list.push({
        id: "queue-bounds",
        severity: "error",
        message: "The queue lane extends beyond its designated zone.",
        step: 3,
      });
    if (capacity(p) < p.queue.target)
      list.push({
        id: "capacity",
        severity: "warning",
        message: `Estimated queue holds ${capacity(p)} people; your planning target is ${p.queue.target}.`,
        step: 3,
      });
    p.objects.filter(solid).forEach((o) => {
      if (o.y + o.depth > p.depth)
        list.push({
          id: `queue-obstacle-${o.id}`,
          severity: "warning",
          message: `Check whether ${o.name} obstructs the queue.`,
          objectId: o.id,
          step: 3,
        });
    });
  }
  if (!p.objects.some((o) => o.type === "Staff access"))
    list.push({
      id: "access",
      severity: "warning",
      message: "Mark a staff access point.",
      step: 2,
    });
  return list;
}
export function parsePlan(value: unknown): Plan {
  const p = value as Plan;
  if (
    !p ||
    p.schema !== 2 ||
    typeof p.id !== "string" ||
    !p.id ||
    typeof p.vendorId !== "string" ||
    typeof p.traderName !== "string" ||
    !p.traderName.trim() ||
    typeof p.eventName !== "string" ||
    !validDimension(p.width) ||
    !validDimension(p.depth) ||
    typeof p.pitchConfirmed !== "boolean" ||
    !Array.isArray(p.objects) ||
    p.objects.length > 400 ||
    !p.queue ||
    !Array.isArray(p.queue.points) ||
    p.queue.points.length > 200 ||
    !validDimension(p.queue.depth) ||
    !validDimension(p.queue.laneWidth) ||
    !validDimension(p.queue.personSpacing) ||
    !Number.isFinite(p.queue.target) ||
    p.queue.target < 1 ||
    p.queue.target > 10000 ||
    ![
      "none",
      "straight",
      "serpentine",
      "serpentine-horizontal",
      "custom",
    ].includes(p.queue.template) ||
    typeof p.notes !== "string" ||
    p.notes.length > 10000 ||
    !Number.isInteger(p.revision) ||
    p.revision < 1 ||
    typeof p.updatedAt !== "string" ||
    !Number.isFinite(Date.parse(p.updatedAt))
  )
    throw Error(
      "This file is not a valid VendorSketch plan. Your current sketch has not been changed.",
    );
  const ids = new Set<string>();
  for (const o of p.objects) {
    if (
      !o ||
      typeof o.id !== "string" ||
      ids.has(o.id) ||
      typeof o.name !== "string" ||
      typeof o.type !== "string" ||
      typeof o.notes !== "string" ||
      typeof o.symbol !== "string" ||
      typeof o.color !== "string" ||
      !/^#[0-9a-fA-F]{6}$/.test(o.color) ||
      ![
        "structure",
        "equipment",
        "point",
        "safety",
        "staff",
        "barrier",
        "other",
      ].includes(o.kind) ||
      !validDimension(o.width) ||
      !validDimension(o.depth) ||
      ![o.x, o.y, o.rotation, o.clearance].every(Number.isFinite) ||
      Math.abs(o.x) > 200 ||
      Math.abs(o.y) > 200 ||
      Math.abs(o.rotation) > 36000 ||
      o.clearance < 0 ||
      o.clearance > 10 ||
      typeof o.locked !== "boolean"
    )
      throw Error(
        "This plan contains invalid equipment. Your current sketch has not been changed.",
      );
    ids.add(o.id);
  }
  if (
    !p.queue.points.every(
      (v) =>
        v &&
        Number.isFinite(v.x) &&
        Number.isFinite(v.y) &&
        Math.abs(v.x) <= 200 &&
        Math.abs(v.y) <= 200,
    )
  )
    throw Error("This plan contains an invalid queue route.");
  const parsed = structuredClone(p);
  parsed.objects = parsed.objects.map((o) =>
    o.type === "Pagoda"
      ? {
          ...o,
          type: "Pergola",
          name: o.name === "Pagoda" ? "Pergola" : o.name,
        }
      : o,
  );
  return parsed;
}
export function migrateLegacy(
  vendorId: string,
  traderName: string,
  storage: Storage,
): Plan | null {
  try {
    const raw = storage.getItem(`vendor-sketch-${vendorId}-objects`);
    if (!raw) return null;
    const boundary = JSON.parse(
      storage.getItem(`vendor-sketch-${vendorId}-boundary`) || "{}",
    );
    const old = JSON.parse(raw);
    if (!Array.isArray(old)) return null;
    const p = createPlan(vendorId, traderName);
    p.width = validDimension(boundary.width) ? boundary.width : 7;
    p.depth = validDimension(boundary.length) ? boundary.length : 5;
    p.pitchConfirmed =
      storage.getItem(`vendor-sketch-${vendorId}-isBoundarySet`) === "true";
    p.objects = old.map((o: any) => {
      const aliases: Record<string, string> = {
        Pagoda: "Pergola",
        "Service Point": "Service counter",
        "Collection Point": "Collection counter",
        "Entry/Exit Point": "Staff access",
        "Queue Barrier": "Queue barrier",
        "Fire Extinguisher": "Fire extinguisher",
        "Baine Marie": "Bain-marie",
        Asado: "Asado grill",
        "Hot Hold": "Hot holding unit",
        "Van/Truck": "Van / truck",
        "Cabin/Chalet": "Cabin / chalet",
        "Prep Table": "Prep table",
        "Bench Set": "Bench set",
      };
      const c =
        CATALOG.find((c) => c.type === (aliases[o.type] || o.type)) ||
        CATALOG[CATALOG.length - 1];
      return {
        ...makeObject(c, p),
        id: o.id || uid(),
        name: aliases[o.type] || o.type,
        x: o.x,
        y: o.y,
        width: o.width,
        depth: o.length,
        rotation: o.rotation,
      };
    });
    return parsePlan(p);
  } catch {
    return null;
  }
}
export interface History {
  past: Plan[];
  present: Plan;
  future: Plan[];
}
export type HistoryAction =
  | { type: "commit"; plan: Plan }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "load"; plan: Plan };
export function historyReducer(state: History, action: HistoryAction): History {
  if (action.type === "load")
    return { past: [], present: action.plan, future: [] };
  if (action.type === "commit") {
    if (JSON.stringify(action.plan) === JSON.stringify(state.present))
      return state;
    return {
      past: [...state.past, state.present].slice(-80),
      present: {
        ...action.plan,
        updatedAt: new Date().toISOString(),
        revision: state.present.revision + 1,
      },
      future: [],
    };
  }
  if (action.type === "undo" && state.past.length)
    return {
      past: state.past.slice(0, -1),
      present: state.past[state.past.length - 1],
      future: [state.present, ...state.future],
    };
  if (action.type === "redo" && state.future.length)
    return {
      past: [...state.past, state.present],
      present: state.future[0],
      future: state.future.slice(1),
    };
  return state;
}
