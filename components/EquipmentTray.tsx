import { useState } from "react";
import { Search, X } from "lucide-react";
import { CATALOG, CatalogItem } from "../types";
import { Symbol } from "./Symbol";
const groups: Record<string, string[]> = {
  Setup: ["Structures"],
  Cook: ["Cooking & preparation"],
  Prep: ["Cold storage"],
  Serve: ["Service & access"],
  Safety: ["Safety & utilities"],
  Queue: ["Queue & furniture"],
  People: ["People"],
  Custom: ["Custom"],
};
export default function EquipmentTray({
  onChoose,
  onClose,
}: {
  onChoose: (c: CatalogItem) => void;
  onClose: () => void;
}) {
  const [group, setGroup] = useState("Cook"),
    [search, setSearch] = useState("");
  const items = CATALOG.filter((c) =>
    search.trim()
      ? c.type.toLowerCase().includes(search.trim().toLowerCase())
      : groups[group].includes(c.category) ||
        (group === "Prep" && c.type === "Prep table"),
  );
  return (
    <section className="equipment-tray" aria-label="Equipment tray">
      <div className="tray-heading">
        <strong>What are we adding?</strong>
        <label className="tray-search">
          <Search size={17} />
          <input
            placeholder="Find an item…"
            aria-label="Find equipment"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <button
          className="icon-button"
          aria-label="Close equipment tray"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      <div
        className="tray-tabs"
        role="tablist"
        aria-label="Equipment categories"
      >
        {Object.keys(groups).map((g) => (
          <button
            key={g}
            role="tab"
            aria-selected={g === group && !search}
            onClick={() => {
              setGroup(g);
              setSearch("");
            }}
          >
            {g}
          </button>
        ))}
      </div>
      <div
        className="tray-items"
        role="tabpanel"
        aria-label={`${search ? "Search results" : group} equipment`}
      >
        {items.map((c) => (
          <button
            key={c.type}
            className="tray-item"
            onClick={() => onChoose(c)}
          >
            <span style={{ color: c.color, background: c.color + "14" }}>
              <Symbol name={c.symbol} />
            </span>
            <strong>{c.type}</strong>
            <small>
              {c.width} × {c.depth} m
            </small>
          </button>
        ))}
        {!items.length && (
          <p className="empty">
            Nothing found. Try another name or choose Custom.
          </p>
        )}
      </div>
      <p className="tray-hint">
        Pick an item, then tap your plan to place it. Default sizes are
        estimates.
      </p>
    </section>
  );
}
