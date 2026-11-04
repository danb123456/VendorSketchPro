import test from "node:test";
import assert from "node:assert/strict";
import DxfParser from "dxf-parser";
import { CATALOG } from "../types";
import {
  createPlan,
  corners,
  inPitch,
  makeObject,
  parsePlan,
} from "../lib/model";
import { starterPlan, placedObject, pinchView } from "../lib/builder";
import {
  cadPoint,
  mapDxf,
  mapSvg,
  mappingData,
  rasterSize,
} from "../lib/mapping";
const plan = () => ({
  ...createPlan("SAV-101", "Smoke & Fire <Kitchen>"),
  pitchConfirmed: true,
});
test("starter truck fits the standard pitch after rotation without changing real dimensions", () => {
  const p = starterPlan(plan(), "truck");
  assert.equal(p.objects[0].rotation, 90);
  assert.equal(p.objects[0].width, 2.5);
  assert.equal(p.objects[0].depth, 6);
  assert.equal(inPitch(p.objects[0], p), true);
  assert.equal(p.width, 7);
  assert.equal(p.depth, 5);
});
test("tap placement centres real equipment on the chosen spot and snaps to 0.1m", () => {
  const p = plan(),
    c = CATALOG.find((c) => c.type === "Smoker")!,
    o = placedObject(c, p, { x: 3.6, y: 2.5 });
  assert.equal(o.x, 3);
  assert.equal(o.y, 2);
  assert.equal(o.width, c.width);
  assert.equal(o.depth, c.depth);
  assert.equal(p.objects.length, 0);
});
test("pinch zoom preserves the world point under the fingers while allowing two-finger panning", () => {
  const v = { x: 0, y: 0, width: 10, height: 20 };
  const next = pinchView(
    v,
    { x: 100, y: 200 },
    { x: 200, y: 200 },
    { x: 50, y: 220 },
    { x: 250, y: 220 },
    { width: 300, height: 600 },
  );
  assert.equal(next.width, 5);
  assert.equal(next.height, 10);
  assert.equal(next.x + (150 / 300) * next.width, 5);
  assert.ok(Math.abs(next.y + (220 / 600) * next.height - 20 / 3) < 1e-10);
});
test("mapping data uses metres and front-left CAD coordinates with rotated equipment polygons", () => {
  const p = plan(),
    o = {
      ...makeObject(
        CATALOG.find((c) => c.type === "Prep table")!,
        p,
      ),
      x: 2,
      y: 1,
      rotation: 90,
    };
  p.objects = [o];
  const data = mappingData(p);
  assert.equal(data.units, "metres");
  assert.deepEqual(cadPoint(p, { x: 0, y: p.depth }), { x: 0, y: 0 });
  assert.deepEqual(cadPoint(p, { x: 0, y: 0 }), { x: 0, y: 5 });
  assert.equal(data.equipment[0].rotationDegrees, -90);
  for (let i = 0; i < 4; i++)
    assert.deepEqual(data.equipment[0].polygon[i], cadPoint(p, corners(o)[i]));
  assert.equal(data.vendor.planId, p.id);
  assert.deepEqual(parsePlan(p).objects, p.objects);
});
test("DXF is readable by an independent CAD parser with metre units and separate layers", () => {
  const p = starterPlan(plan(), "pergola");
  p.queue.points = [
    { x: 1, y: 10 },
    { x: 1, y: 6 },
  ];
  const drawing = new DxfParser().parseSync(mapDxf(p))!;
  assert.equal(drawing.header.$INSUNITS, 6);
  assert.equal(drawing.entities.length, 4);
  assert.deepEqual(
    drawing.entities.map((e) => e.layer),
    ["PITCH", "EQUIPMENT", "QUEUE_ZONE", "QUEUE_ROUTE"],
  );
  const pitch = drawing.entities[0] as any;
  assert.equal(pitch.vertices[1].x, 7);
  assert.equal(pitch.vertices[2].y, 5);
  const queue = drawing.entities[3] as any;
  assert.equal(queue.vertices[0].y, -5);
  assert.equal(queue.vertices[1].y, -1);
});
test("scaled map SVG uses physical millimetres and escapes vendor metadata", () => {
  const svg = mapSvg(plan());
  assert.match(svg, /width="7000mm"/);
  assert.match(svg, /height="11000mm"/);
  assert.match(svg, /Smoke &amp; Fire &lt;Kitchen&gt;/);
  assert.ok(!svg.includes("<Kitchen>"));
  assert.match(svg, /id="pitch"/);
  assert.ok(!svg.includes("Equipment schedule"));
});
test("raster exports stay within mobile-friendly memory and edge limits even for long reports", () => {
  for (const [w, h] of [
    [1200, 1200],
    [1200, 16000],
    [50000, 2000],
  ]) {
    const result = rasterSize(w, h);
    assert.ok(result.width > 0 && result.height > 0);
    assert.ok(result.width <= 8192 && result.height <= 8192);
    assert.ok(result.width * result.height <= 12_010_000);
    assert.ok(Math.abs(result.width / result.height - w / h) < 0.05);
  }
  assert.throws(() => rasterSize(0, 100));
});
