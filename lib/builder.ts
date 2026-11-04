import { CATALOG, CatalogItem, Plan, Point, StandObject } from "../types";
import { makeObject, round } from "./model";
export type Setup =
  "blank" | "pergola" | "pergola-4x3" | "pergola-5x3" | "truck";
export function starterPlan(plan: Plan, setup: Setup): Plan {
  if (setup === "blank") return plan;
  const catalogType = {
    pergola: "Pergola",
    "pergola-4x3": "Pergola 4 × 3 m",
    "pergola-5x3": "Pergola 5 × 3 m",
    truck: "Van / truck",
  }[setup];
  const catalog = CATALOG.find((c) => c.type === catalogType)!;
  const object = makeObject(catalog, plan);
  if (
    setup === "truck" &&
    object.depth > plan.depth &&
    object.depth <= plan.width &&
    object.width <= plan.depth
  ) {
    object.rotation = 90;
    object.x = round((plan.width - object.width) / 2);
    object.y = round((object.width - object.depth) / 2 + 0.2);
  } else {
    object.x = round((plan.width - object.width) / 2);
    object.y = 0.2;
  }
  return { ...plan, objects: [...plan.objects, object] };
}
export function placedObject(
  catalog: CatalogItem,
  plan: Plan,
  point: Point,
): StandObject {
  const object = makeObject(catalog, plan);
  return {
    ...object,
    x: round(Math.round((point.x - object.width / 2) * 10) / 10),
    y: round(Math.round((point.y - object.depth / 2) * 10) / 10),
  };
}
export interface View {
  x: number;
  y: number;
  width: number;
  height: number;
}
export function pinchView(
  start: View,
  startA: Point,
  startB: Point,
  nowA: Point,
  nowB: Point,
  viewport: { width: number; height: number },
): View {
  const distance = Math.max(
    1,
    Math.hypot(startB.x - startA.x, startB.y - startA.y),
  );
  const nowDistance = Math.max(1, Math.hypot(nowB.x - nowA.x, nowB.y - nowA.y));
  const width = Math.min(
      250,
      Math.max(2, (start.width * distance) / nowDistance),
    ),
    height = (width * viewport.height) / viewport.width;
  const oldMid = { x: (startA.x + startB.x) / 2, y: (startA.y + startB.y) / 2 },
    mid = { x: (nowA.x + nowB.x) / 2, y: (nowA.y + nowB.y) / 2 };
  const anchor = {
    x: start.x + (oldMid.x / viewport.width) * start.width,
    y: start.y + (oldMid.y / viewport.height) * start.height,
  };
  return {
    x: anchor.x - (mid.x / viewport.width) * width,
    y: anchor.y - (mid.y / viewport.height) * height,
    width,
    height,
  };
}
