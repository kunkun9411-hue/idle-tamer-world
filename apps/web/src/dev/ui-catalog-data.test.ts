import { describe, expect, it } from "vitest";

import {
  KNOWN_UI_DEBTS,
  UI_ASSET_CONTRACTS,
  UI_COLOR_TOKENS,
  UI_COMPONENT_GROUPS,
  UI_FOUNDATION_SCALES,
  UI_GENERATED_CHROME,
  UI_STATES,
  UI_SURFACES,
  UI_TYPOGRAPHY_ROLES,
  UI_VIEWPORTS,
  knownUiDebtIdsForWidth,
} from "./ui-catalog-data";

const expectUnique = (label: string, values: string[]): void => {
  expect(new Set(values).size, `${label} IDs must be unique`).toBe(values.length);
};

describe("UI handoff catalog", () => {
  it("keeps the accepted 16-surface inventory machine readable", () => {
    expect(UI_SURFACES).toHaveLength(16);
    expectUnique("surface", UI_SURFACES.map((entry) => entry.id));
    expectUnique("state", UI_STATES.map((entry) => entry.id));
    expectUnique("viewport", UI_VIEWPORTS.map((entry) => entry.id));
    expect(UI_SURFACES.every((surface) => surface.states.length > 0 && surface.blocks.length > 0)).toBe(true);
  });

  it("covers components, assets and every Roadmap-B block", () => {
    const blocks = new Set(UI_SURFACES.flatMap((surface) => surface.blocks));
    expect([...blocks].sort()).toEqual(["B.01", "B.02", "B.03", "B.04", "B.05", "B.06", "B.07", "B.08"]);
    expect(UI_COMPONENT_GROUPS.every((group) => group.items.length >= 4)).toBe(true);
    expect(UI_COMPONENT_GROUPS).toHaveLength(10);
    expect(UI_COLOR_TOKENS).toHaveLength(11);
    expect(UI_TYPOGRAPHY_ROLES).toHaveLength(9);
    expect(UI_FOUNDATION_SCALES.map((entry) => entry.id)).toEqual(["space", "radius", "motion", "layer"]);
    expect(UI_ASSET_CONTRACTS.map((entry) => entry.id)).toEqual(["monster", "avatar", "frame", "zone", "item", "ui-decoration"]);
    expect(UI_ASSET_CONTRACTS.every((entry) => entry.textPolicy.includes("textfrei") || entry.textPolicy.includes("keine Texte"))).toBe(true);
    expect(UI_GENERATED_CHROME).toHaveLength(4);
    expectUnique("generated chrome", UI_GENERATED_CHROME.map((entry) => entry.id));
    expect(UI_GENERATED_CHROME.every((entry) => entry.path.startsWith("/assets/ui/chrome/"))).toBe(true);
  });

  it("keeps measured layout debt explicit until its B-block resolves it", () => {
    expectUnique("debt", KNOWN_UI_DEBTS.map((entry) => entry.id));
    expect(KNOWN_UI_DEBTS.some((entry) => entry.priority === "P0")).toBe(true);
    expect(knownUiDebtIdsForWidth(390)).toEqual(["mobile-combat-navigation-overlap"]);
    expect(knownUiDebtIdsForWidth(820)).toEqual(["mobile-combat-navigation-overlap"]);
    expect(knownUiDebtIdsForWidth(1_280)).toEqual(["subpage-account-overflow"]);
  });
});
