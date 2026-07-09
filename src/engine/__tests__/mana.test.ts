import { describe, expect, it } from "vitest";
import { canPayCost, emptyManaPool, payCost, totalGenericCost } from "../mana";

describe("mana", () => {
  it("canPayCost: farbige Kosten müssen exakt aus der passenden Farbe kommen", () => {
    const pool = { ...emptyManaPool(), flame: 1 };
    expect(canPayCost(pool, { flame: 1 }, undefined)).toBe(true);
    expect(canPayCost(pool, { tide: 1 }, undefined)).toBe(false);
  });

  it("canPayCost: generische Kosten sind mit beliebiger Farbe bezahlbar", () => {
    const pool = { ...emptyManaPool(), flame: 2 };
    expect(canPayCost(pool, { generic: 2 }, undefined)).toBe(true);
    expect(canPayCost(pool, { generic: 3 }, undefined)).toBe(false);
  });

  it("canPayCost: schlägt fehl, wenn nicht genug Mana im Pool ist", () => {
    const pool = emptyManaPool();
    expect(canPayCost(pool, { generic: 1 }, undefined)).toBe(false);
  });

  it("payCost: zieht Farbmana zuerst exakt ab, Rest aus generischem/übrigem Mana", () => {
    const pool = { ...emptyManaPool(), flame: 2, colorless: 1 };
    payCost(pool, { flame: 1, generic: 2 }, undefined);
    // 1 flame exakt für Farbkosten, dann 2 generisch: 1 aus colorless + 1 aus restlichem flame
    expect(pool.flame).toBe(0);
    expect(pool.colorless).toBe(0);
  });

  it("payCost: wirft, wenn vorher nicht mit canPayCost geprüft wurde und Kosten nicht bezahlbar sind", () => {
    const pool = emptyManaPool();
    expect(() => payCost(pool, { generic: 1 }, undefined)).toThrow();
  });

  it("totalGenericCost berücksichtigt X-Kosten", () => {
    expect(totalGenericCost({ generic: 1, x: true }, 3)).toBe(4);
    expect(totalGenericCost({ generic: 1 }, undefined)).toBe(1);
  });

  it("canPayCost: X-Kosten ohne gewähltes X sind nicht bezahlbar", () => {
    const pool = { ...emptyManaPool(), colorless: 5 };
    expect(canPayCost(pool, { x: true }, undefined)).toBe(false);
    expect(canPayCost(pool, { x: true }, 3)).toBe(true);
  });
});
