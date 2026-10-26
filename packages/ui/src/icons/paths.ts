/** Path data copied verbatim from the design system's Icons asset group (24px grid, 1.75 stroke). */
export const ICON_PATHS = {
  hoarding: [
    '<rect x="3" y="4" width="18" height="10" rx="1"/>',
    '<path d="M8 14v7M16 14v7M6 21h4M14 21h4"/>',
  ],
  unipole: ['<rect x="4" y="3" width="16" height="9" rx="1"/>', '<path d="M12 12v9M9 21h6"/>'],
  gantry: [
    '<path d="M4 21V7h16v14M4 7V5M20 7V5"/>',
    '<rect x="7" y="8" width="10" height="6" rx="1"/>',
  ],
  "bus-shelter": [
    '<path d="M3 6h18M4 6v15M20 6v15"/>',
    '<rect x="7" y="9" width="6" height="9" rx="1"/>',
    '<path d="M16 11h2M16 14h2"/>',
  ],
  "led-screen": [
    '<rect x="3" y="4" width="18" height="11" rx="1"/>',
    '<path d="M7 8h2M11 8h2M15 8h2M7 11h2M11 11h2M15 11h2M12 15v6M9 21h6"/>',
  ],
  transit: [
    '<rect x="4" y="3" width="16" height="14" rx="2"/>',
    '<path d="M4 11h16M8 17v3M16 17v3M8 7h8"/>',
    '<circle cx="8" cy="14" r="0.6"/>',
    '<circle cx="16" cy="14" r="0.6"/>',
  ],
  // Globe: the country switcher. Drawn to the set's rules (24px grid, 1.75 stroke, outline only).
  globe: [
    '<circle cx="12" cy="12" r="8.75"/>',
    '<path d="M3.25 12h17.5M12 3.25c2.4 2.5 3.6 5.4 3.6 8.75S14.4 18.25 12 20.75c-2.4-2.5-3.6-5.4-3.6-8.75S9.6 5.75 12 3.25z"/>',
  ],
  // Verified: a circle with a centred tick. The scalloped seal in the asset group blurs at 16px.
  verified: ['<circle cx="12" cy="12" r="8.75"/>', '<path d="M8.25 12.25l2.5 2.5 5-5.25"/>'],
  permit: ['<path d="M6 3h9l4 4v14H6z"/>', '<path d="M15 3v4h4M9 12h6M9 16h6"/>'],
  fresh: ['<circle cx="12" cy="12" r="8.5"/>', '<path d="M12 7.5V12l3 2"/>'],
  responsive: ['<path d="M4 5h16v10H9l-5 4z"/>', '<path d="M8 10h8"/>'],
  pin: [
    '<path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z"/>',
    '<rect x="8.5" y="7" width="7" height="5" rx="1"/>',
  ],
  enquiry: ['<path d="M3 6h18v12H3z"/>', '<path d="M3 7l9 6 9-6"/>'],
} as const;

export type IconName = keyof typeof ICON_PATHS;
