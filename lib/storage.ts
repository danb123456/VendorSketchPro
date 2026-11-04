import { Plan, Version } from "../types";
import { parsePlan, uid } from "./model";
export const PLAN_KEY = "vendorsketch-v2-plan",
  VERSIONS_KEY = "vendorsketch-v2-versions";
export function readPlan(): Plan | null {
  try {
    const raw = localStorage.getItem(PLAN_KEY);
    return raw ? parsePlan(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}
export function readVersions(): Version[] {
  try {
    const raw = JSON.parse(localStorage.getItem(VERSIONS_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw
      .flatMap((v) => {
        try {
          return [
            {
              id: String(v.id),
              label: String(v.label),
              at: String(v.at),
              plan: parsePlan(v.plan),
            },
          ];
        } catch {
          return [];
        }
      })
      .slice(0, 20);
  } catch {
    return [];
  }
}
export function savePlan(plan: Plan) {
  localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
}
export function checkpoint(plan: Plan, label: string) {
  const versions = readVersions();
  const version = {
    id: uid(),
    label,
    at: new Date().toISOString(),
    plan: structuredClone(plan),
  };
  localStorage.setItem(
    VERSIONS_KEY,
    JSON.stringify([version, ...versions].slice(0, 20)),
  );
  return version;
}
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob),
    link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export const filename = (p: Plan) =>
  `Savour-${p.traderName}-${p.vendorId}-r${p.revision}`.replace(
    /[^a-zA-Z0-9._-]/g,
    "-",
  );
export function backupPlan(p: Plan) {
  downloadBlob(
    new Blob([JSON.stringify(p, null, 2)], { type: "application/json" }),
    `${filename(p)}.vendorsketch.json`,
  );
}
