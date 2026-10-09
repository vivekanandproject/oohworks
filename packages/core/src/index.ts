// Domain services. Modules: identity, inventory, offers, verification, enquiries,
// editorial, indexing, search, data, trust, billing, notifications.
// Modules call each other only through these exports, never through each other's tables.
export * from "./indexing/permanent-id";
export * from "./indexing/unit-path";
