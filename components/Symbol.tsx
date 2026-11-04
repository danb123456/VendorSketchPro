import React from "react";
export function Symbol({
  name,
  color = "currentColor",
}: {
  name: string;
  color?: string;
}) {
  const base = {
    fill: "none",
    stroke: color,
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  const paths: Record<string, React.ReactNode> = {
    tent: (
      <>
        <path d="M3 18V8l9-5 9 5v10zM3 8h18M12 3v15M7 18v-6h10v6" />
      </>
    ),
    truck: (
      <>
        <rect x="3" y="4" width="13" height="14" rx="2" />
        <path d="M16 9h4l2 5v4h-6M6 4v10h7" />
        <circle cx="6" cy="19" r="2" />
        <circle cx="19" cy="19" r="2" />
      </>
    ),
    cabin: (
      <>
        <path d="M2 10l10-7 10 7M4 9v12h16V9M9 21v-8h6v8" />
      </>
    ),
    grill: (
      <>
        <rect x="3" y="8" width="18" height="10" rx="2" />
        <path d="M6 11h12M6 14h12M7 18v3M17 18v3M8 5V2M12 5V2M16 5V2" />
      </>
    ),
    oven: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M4 8h16M8 12h8v6H8zM8 5h1M15 5h1" />
      </>
    ),
    fryer: (
      <>
        <path d="M4 10h16v10H4zM7 10V5h10v5M10 5V2h4M7 14h10M7 17h10" />
      </>
    ),
    fridge: (
      <>
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <path d="M5 10h14M8 5v2M8 13v4" />
      </>
    ),
    counter: (
      <>
        <rect x="3" y="6" width="18" height="12" rx="1" />
        <path d="M3 10h18M7 10v8M17 10v8" />
      </>
    ),
    table: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="1" />
        <path d="M6 8h12M6 16h12M6 5v14M18 5v14" />
      </>
    ),
    person: (
      <>
        <circle cx="12" cy="6" r="3" />
        <path d="M5 20v-4a7 7 0 0114 0v4z" />
      </>
    ),
    door: (
      <>
        <path d="M5 21V3h13v18M18 21H3M9 3v18M12 12h2" />
      </>
    ),
    arrow: (
      <>
        <path d="M4 12h16M14 6l6 6-6 6" />
      </>
    ),
    barrier: (
      <>
        <path d="M4 6v14M20 6v14M4 9h16M2 20h4M18 20h4" />
      </>
    ),
    extinguisher: (
      <>
        <rect x="7" y="8" width="9" height="14" rx="3" />
        <path d="M10 8V4h6M12 2v3M16 5h3v9M10 12h3" />
      </>
    ),
    safety: (
      <>
        <path d="M12 2l8 4v7c0 5-8 9-8 9s-8-4-8-9V6zM8 12l3 3 5-6" />
      </>
    ),
    water: (
      <>
        <path d="M12 2S5 10 5 15a7 7 0 0014 0c0-5-7-13-7-13zM8 15a4 4 0 004 4" />
      </>
    ),
    sink: (
      <>
        <rect x="3" y="9" width="18" height="12" rx="3" />
        <path d="M8 9V5a4 4 0 018 0v3M7 13h10M12 17h.1" />
      </>
    ),
    power: (
      <>
        <path d="M13 2L4 14h7l-1 8 10-13h-7z" />
      </>
    ),
    gas: (
      <>
        <rect x="6" y="6" width="12" height="16" rx="4" />
        <path d="M9 6V2h6v4M6 13h12" />
      </>
    ),
    bin: (
      <>
        <path d="M5 6h14l-1 16H6zM3 6h18M9 6V2h6v4M10 10v8M14 10v8" />
      </>
    ),
    flag: (
      <>
        <path d="M5 22V2l14 3-14 7" />
      </>
    ),
    box: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M8 12h8M12 8v8" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      aria-hidden="true"
      {...base}
    >
      {paths[name] || paths.box}
    </svg>
  );
}
