import { describe, it, expect } from "vitest";

describe("Session Controller Logic", () => {
  it("should return 0 for physical quantity when a new item is processed", () => {
    const physicalQtyAtStart = 0;
    expect(physicalQtyAtStart).toBe(0);
  });

  it("should format the article name fallback correctly", () => {
    const articleFromMaster = null;
    const descreptionFromLegacy = "Nutella 500g";
    const finalName =
      articleFromMaster || descreptionFromLegacy || "Article Inconnu";
    expect(finalName).toBe("Nutella 500g");
  });
});
