export type Kind =
  | "structure"
  | "equipment"
  | "point"
  | "safety"
  | "staff"
  | "barrier"
  | "other";
export interface CatalogItem {
  type: string;
  category: string;
  kind: Kind;
  width: number;
  depth: number;
  color: string;
  symbol: string;
}
export interface StandObject {
  id: string;
  type: string;
  name: string;
  kind: Kind;
  x: number;
  y: number;
  width: number;
  depth: number;
  rotation: number;
  color: string;
  symbol: string;
  locked: boolean;
  clearance: number;
  notes: string;
}
export interface Point {
  x: number;
  y: number;
}
export interface Queue {
  depth: number;
  laneWidth: number;
  personSpacing: number;
  target: number;
  points: Point[];
  template:
    | "none"
    | "straight"
    | "serpentine"
    | "serpentine-horizontal"
    | "serpentine-horizontal-reverse"
    | "custom";
}
export interface Plan {
  schema: 2;
  id: string;
  vendorId: string;
  traderName: string;
  eventName: string;
  width: number;
  depth: number;
  pitchConfirmed: boolean;
  objects: StandObject[];
  queue: Queue;
  notes: string;
  updatedAt: string;
  revision: number;
}
export interface Version {
  id: string;
  label: string;
  at: string;
  plan: Plan;
}
export interface Issue {
  id: string;
  severity: "error" | "warning";
  message: string;
  objectId?: string;
  step: number;
}
const item = (
  type: string,
  category: string,
  kind: Kind,
  width: number,
  depth: number,
  color: string,
  symbol: string,
): CatalogItem => ({ type, category, kind, width, depth, color, symbol });
export const PITCH_STORAGE_NOTE =
  "Large fridge trailers are excluded from your pitch space. They will be placed in the nearest communal back-of-house (BoH) space to you.";

export const CATALOG: CatalogItem[] = [
  item(
    "Service counter",
    "Service & access",
    "point",
    2,
    0.6,
    "#239374",
    "counter",
  ),
  item(
    "Collection counter",
    "Service & access",
    "point",
    1,
    0.6,
    "#7a63c2",
    "counter",
  ),
  item(
    "Staff access",
    "Service & access",
    "point",
    1.2,
    0.4,
    "#3d8a72",
    "door",
  ),
  item(
    "Queue entrance",
    "Service & access",
    "point",
    1,
    0.4,
    "#318a9b",
    "arrow",
  ),
  item(
    "Customer exit",
    "Service & access",
    "point",
    1,
    0.4,
    "#318a9b",
    "arrow",
  ),
  item("Pergola", "Structures", "structure", 3, 3, "#85aec9", "tent"),
  item("Pergola 4 × 3 m", "Structures", "structure", 4, 3, "#85aec9", "tent"),
  item("Pergola 5 × 3 m", "Structures", "structure", 5, 3, "#85aec9", "tent"),
  item("Tent", "Structures", "structure", 6, 4, "#85aec9", "tent"),
  item("Cabin / chalet", "Structures", "structure", 2.4, 3, "#ac8a69", "cabin"),
  item("Van / truck", "Structures", "structure", 2.5, 6, "#82929e", "truck"),
  item(
    "Smoker",
    "Cooking & preparation",
    "equipment",
    1.2,
    1,
    "#4b5964",
    "grill",
  ),
  item(
    "Oven",
    "Cooking & preparation",
    "equipment",
    0.9,
    0.9,
    "#d58a55",
    "oven",
  ),
  item(
    "Fryer",
    "Cooking & preparation",
    "equipment",
    0.6,
    0.8,
    "#d5a452",
    "fryer",
  ),
  item(
    "Asado grill",
    "Cooking & preparation",
    "equipment",
    1.5,
    1,
    "#be7860",
    "grill",
  ),
  item(
    "Hot holding unit",
    "Cooking & preparation",
    "equipment",
    0.8,
    0.8,
    "#cf8b72",
    "oven",
  ),
  item(
    "Bain-marie",
    "Cooking & preparation",
    "equipment",
    1.2,
    0.6,
    "#d5a452",
    "counter",
  ),
  item(
    "Prep table",
    "Cooking & preparation",
    "equipment",
    2,
    1,
    "#8c9ca8",
    "table",
  ),
  item("Fridge", "Cold storage", "equipment", 0.7, 0.7, "#76a9bf", "fridge"),
  item("Freezer", "Cold storage", "equipment", 0.7, 0.7, "#6a91b3", "fridge"),
  item(
    "Fire extinguisher",
    "Safety & utilities",
    "safety",
    0.4,
    0.4,
    "#bf655c",
    "extinguisher",
  ),
  item(
    "Fire blanket",
    "Safety & utilities",
    "safety",
    0.4,
    0.2,
    "#bf655c",
    "safety",
  ),
  item(
    "Handwashing station",
    "Safety & utilities",
    "equipment",
    0.6,
    0.6,
    "#74a8ab",
    "sink",
  ),
  item(
    "Water connection",
    "Safety & utilities",
    "safety",
    0.3,
    0.3,
    "#74a8ab",
    "water",
  ),
  item(
    "Power connection",
    "Safety & utilities",
    "safety",
    0.3,
    0.3,
    "#bc9e57",
    "power",
  ),
  item(
    "Gas cylinder",
    "Safety & utilities",
    "equipment",
    0.4,
    0.4,
    "#b69b78",
    "gas",
  ),
  item(
    "Waste bin",
    "Safety & utilities",
    "equipment",
    0.5,
    0.5,
    "#8c9c88",
    "bin",
  ),
  item(
    "Queue barrier",
    "Queue & furniture",
    "barrier",
    2,
    0.1,
    "#73848e",
    "barrier",
  ),
  item(
    "Bench set",
    "Queue & furniture",
    "equipment",
    2,
    1.5,
    "#a2917a",
    "table",
  ),
  item("Flag", "Queue & furniture", "other", 0.4, 0.4, "#ba8a9b", "flag"),
  item("Chef", "People", "staff", 0.5, 0.5, "#849ea5", "person"),
  item("Pitmaster", "People", "staff", 0.5, 0.5, "#849ea5", "person"),
  item("Server", "People", "staff", 0.5, 0.5, "#849ea5", "person"),
  item("Manager", "People", "staff", 0.5, 0.5, "#849ea5", "person"),
  item("Custom item", "Custom", "other", 1, 1, "#8a9b9e", "box"),
];
