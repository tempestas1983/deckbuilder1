/**
 * Öffentliche Exports des Engine-Pakets. Frontend importiert von hier.
 */

export { createRulesEngine } from "./engine";

// Einzelmodule sind ebenfalls exportiert (nützlich für Tests / Tooling,
// z.B. um SBAs isoliert zu prüfen), gelten aber nicht als stabile API.
export * from "./rng";
export * from "./mana";
export * from "./stats";
export * from "./targets";
export * from "./zones";
export * from "./sba";
export * from "./stack";
export * from "./triggers";
export * from "./combat";
export * from "./turn";
export * from "./card-defs";
