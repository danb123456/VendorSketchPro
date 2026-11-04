import { useState } from "react";
import { Search, Plus, ChevronDown, X } from "lucide-react";
import { CATALOG, CatalogItem } from "../types";
import { Symbol } from "./Symbol";
export default function Library({
  onAdd,
  onClose,
}: {
  onAdd: (c: CatalogItem) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const categories = [...new Set(CATALOG.map((c) => c.category))];
  return (
    <aside className="library">
      <div className="panel-title">
        <div>
          <span className="eyebrow">BUILD YOUR STAND</span>
          <h2>Item library</h2>
        </div>
        <button
          className="icon-button mobile-only"
          aria-label="Close item library"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      <label className="search">
        <Search size={17} />
        <input
          aria-label="Search equipment"
          placeholder="Search equipment…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>
      <p className="hint library-hint">
        Click an item to add it. Sizes are estimates.
      </p>
      <div className="library-list">
        {categories.map((category) => {
          const items = CATALOG.filter(
            (c) =>
              c.category === category &&
              `${c.type} ${c.category}`
                .toLowerCase()
                .includes(search.toLowerCase()),
          );
          if (!items.length) return null;
          return (
            <details key={category} open>
              <summary>
                {category}
                <ChevronDown size={14} />
              </summary>
              <div className="catalog-grid">
                {items.map((c) => (
                  <button
                    className="catalog-item"
                    key={c.type}
                    onClick={() => onAdd(c)}
                  >
                    <span
                      className="catalog-icon"
                      style={{ color: c.color, background: `${c.color}14` }}
                    >
                      <Symbol name={c.symbol} />
                    </span>
                    <span>
                      {c.type}
                      <small>
                        {c.width} × {c.depth} m
                      </small>
                    </span>
                    <Plus size={14} className="add-indicator" />
                  </button>
                ))}
              </div>
            </details>
          );
        })}
        {!CATALOG.some((c) =>
          `${c.type} ${c.category}`
            .toLowerCase()
            .includes(search.toLowerCase()),
        ) && <p className="empty">No matching items. Try “Custom”.</p>}
      </div>
      <div className="library-footer">
        <span className="status-dot" />
        Designed for food traders
      </div>
    </aside>
  );
}
