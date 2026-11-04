import test from "node:test";
import assert from "node:assert/strict";
import { CATALOG } from "../types";
import {
  capacity,
  createPlan,
  historyReducer,
  inPitch,
  issuesFor,
  makeObject,
  migrateLegacy,
  overlap,
  parsePlan,
  queueTemplate,
  validDimension,
} from "../lib/model";
const plan = () => ({
  ...createPlan("SAV-101", "The Smokehouse"),
  pitchConfirmed: true,
});
const object = (type: string, p = plan()) =>
  makeObject(
    CATALOG.find((c) => c.type === type)!,
    p,
  );
test("undo and redo restore complete pre-gesture positions, sizes and pitch dimensions", () => {
  const p = plan(),
    o = object("Smoker", p);
  p.objects = [o];
  const h = { past: [], present: p, future: [] };
  const moved = {
    ...p,
    width: 8,
    objects: [{ ...o, x: 3.4, y: 2, width: 1.6, rotation: 45 }],
  };
  const after = historyReducer(h, { type: "commit", plan: moved });
  const undo = historyReducer(after, { type: "undo" });
  assert.deepEqual(undo.present, p);
  assert.equal(undo.present.objects[0].x, o.x);
  const redo = historyReducer(undo, { type: "redo" });
  assert.equal(redo.present.objects[0].x, 3.4);
  assert.equal(redo.present.width, 8);
});
test("a new action after undo discards stale redo history", () => {
  const p = plan(),
    a = historyReducer(
      { past: [], present: p, future: [] },
      { type: "commit", plan: { ...p, notes: "A" } },
    ),
    b = historyReducer(a, { type: "undo" }),
    c = historyReducer(b, {
      type: "commit",
      plan: { ...b.present, notes: "B" },
    });
  assert.equal(c.future.length, 0);
  assert.equal(c.present.notes, "B");
});
test("rotated separated items do not create bounding-box false positives", () => {
  const a = {
    ...object("Prep table"),
    x: 0,
    y: 0,
    width: 3,
    depth: 0.2,
    rotation: 45,
  };
  const b = { ...a, id: "b", x: 0, y: 0.6 };
  assert.equal(overlap(a, b), false);
  assert.equal(overlap(a, { ...a, id: "c" }), true);
});
test("touching edges are allowed, real overlaps are reported", () => {
  const a = { ...object("Smoker"), x: 0, y: 0, width: 1, depth: 1 },
    b = { ...a, id: "b", x: 1 };
  assert.equal(overlap(a, b), false);
  assert.equal(overlap(a, { ...b, x: 0.99 }), true);
});
test("rotated corners outside pitch are reported even when origin is inside", () => {
  const p = plan(),
    o = {
      ...object("Prep table", p),
      x: 0,
      y: 0,
      width: 2,
      depth: 1,
      rotation: 45,
    };
  assert.equal(inPitch(o, p), false);
  p.objects = [o];
  assert.ok(issuesFor(p).some((i) => i.id === `bounds-${o.id}`));
});
test("structures can contain equipment without a false overlap error", () => {
  const p = plan(),
    tent = { ...object("Tent", p), width: 6, depth: 4, x: 0, y: 0 },
    smoker = { ...object("Smoker", p), x: 1, y: 1 };
  p.objects = [tent, smoker];
  assert.ok(!issuesFor(p).some((i) => i.id.startsWith("overlap")));
});
test("new equipment finds a free position instead of stacking in the centre", () => {
  const p = plan();
  const first = object("Smoker", p);
  p.objects.push(first);
  const second = object("Oven", p);
  assert.equal(overlap(first, second), false);
  assert.equal(inPitch(second, p), true);
});
test("queue templates account for the whole lane width at pitch boundaries", () => {
  const p = plan();
  for (const template of [
    "straight",
    "serpentine",
    "serpentine-horizontal",
  ] as const) {
    p.queue.points = queueTemplate(p, template);
    assert.ok(p.queue.points.length >= 2);
    assert.ok(
      p.queue.points.every(
        (v) =>
          v.x >= p.queue.laneWidth / 2 &&
          v.x <= p.width - p.queue.laneWidth / 2 &&
          v.y >= p.depth + p.queue.laneWidth / 2 &&
          v.y <= p.depth + p.queue.depth - p.queue.laneWidth / 2,
      ),
    );
    assert.ok(!issuesFor(p).some((i) => i.id === "queue-bounds"));
  }
});
test("capacity follows editable spacing and never claims the target as actual capacity", () => {
  const p = plan();
  p.queue.points = [
    { x: 1, y: 5 },
    { x: 1, y: 9 },
  ];
  p.queue.personSpacing = 1;
  assert.equal(capacity(p), 4);
  assert.ok(issuesFor(p).some((i) => i.id === "capacity"));
  p.queue.personSpacing = 0.5;
  assert.equal(capacity(p), 8);
});
test("invalid dimensions, malicious colours, duplicate ids and malformed imports are rejected", () => {
  for (const n of [0, -1, NaN, Infinity, 101])
    assert.equal(validDimension(n), false);
  const p = plan();
  assert.deepEqual(parsePlan(p), p);
  assert.throws(() => parsePlan({ ...p, width: 0 }));
  assert.throws(() =>
    parsePlan({ ...p, queue: { ...p.queue, personSpacing: 0 } }),
  );
  const o = object("Smoker", p);
  assert.throws(() =>
    parsePlan({ ...p, objects: [{ ...o, color: "url(https://invalid)" }] }),
  );
  assert.throws(() => parsePlan({ ...p, objects: [o, o] }));
  assert.throws(() => parsePlan({}));
});
test("existing browser sketches migrate dimensions, positions and renamed equipment", () => {
  const values: Record<string, string> = {
    "vendor-sketch-V-1-objects": JSON.stringify([
      {
        id: "legacy",
        type: "Baine Marie",
        x: 2,
        y: 1,
        width: 1.2,
        length: 0.6,
        rotation: 90,
      },
    ]),
    "vendor-sketch-V-1-boundary": JSON.stringify({ width: 8, length: 5 }),
    "vendor-sketch-V-1-isBoundarySet": "true",
  };
  const p = migrateLegacy("V-1", "Original Trader", {
    getItem: (key: string) => values[key] || null,
  } as Storage)!;
  assert.equal(p.width, 8);
  assert.equal(p.depth, 5);
  assert.equal(p.objects[0].type, "Bain-marie");
  assert.equal(p.objects[0].rotation, 90);
  assert.equal(p.objects[0].depth, 0.6);
  assert.equal(p.pitchConfirmed, true);
});

test("solid counters warn on equipment overlap and pitch overflow", () => {
  const p = plan();
  const counter = { ...object("Service counter", p), x: 0, y: 0 };
  const smoker = { ...object("Smoker", p), x: 0, y: 0 };
  p.objects = [counter, smoker];
  assert.ok(issuesFor(p).some((i) => i.id.startsWith("overlap")));
  p.objects = [{ ...counter, x: 6 }];
  assert.ok(issuesFor(p).some((i) => i.id.startsWith("bounds")));
});
test("queue extremes stay within the saved-plan limits and crossing routes are flagged", () => {
  const p = plan();
  p.width = 100;
  p.queue.laneWidth = 0.1;
  p.queue.points = queueTemplate(p, "serpentine");
  assert.ok(p.queue.points.length <= 200);
  assert.doesNotThrow(() => parsePlan(p));
  p.queue.points = [
    { x: 1, y: 5 },
    { x: 4, y: 9 },
    { x: 1, y: 9 },
    { x: 4, y: 5 },
  ];
  assert.ok(issuesFor(p).some((i) => i.id === "queue-crossing"));
});

test("left-to-right serpentine runs horizontally and progresses towards the stand", () => {
  const p = plan();
  const points = queueTemplate(p, "serpentine-horizontal");
  assert.ok(points.length >= 4);
  assert.equal(points[0].y, points[1].y);
  assert.ok(points[0].x < points[1].x);
  assert.equal(points[1].x, points[2].x);
  assert.ok(points[2].y < points[1].y);
  assert.ok(points[3].x < points[2].x);
  p.queue = { ...p.queue, points, template: "serpentine-horizontal" };
  assert.equal(parsePlan(p).queue.template, "serpentine-horizontal");
  assert.ok(
    !issuesFor(p).some(
      (i) => i.id === "queue-crossing" || i.id === "queue-bounds",
    ),
  );
  p.queue.depth = 100;
  p.queue.laneWidth = 0.1;
  assert.ok(queueTemplate(p, "serpentine-horizontal").length <= 200);
});

test("right-to-left serpentine mirrors the horizontal route and survives saving", () => {
  const p = plan();
  const forward = queueTemplate(p, "serpentine-horizontal");
  const points = queueTemplate(p, "serpentine-horizontal-reverse");
  assert.ok(points[0].x > points[1].x);
  assert.equal(points[0].y, points[1].y);
  assert.ok(points[2].y < points[1].y);
  assert.deepEqual(
    points,
    forward.map(({ x, y }) => ({
      x: Math.round((p.width - x) * 100) / 100,
      y,
    })),
  );
  p.queue = { ...p.queue, points, template: "serpentine-horizontal-reverse" };
  assert.equal(parsePlan(p).queue.template, "serpentine-horizontal-reverse");
  assert.ok(
    !issuesFor(p).some(
      (i) => i.id === "queue-crossing" || i.id === "queue-bounds",
    ),
  );
});
