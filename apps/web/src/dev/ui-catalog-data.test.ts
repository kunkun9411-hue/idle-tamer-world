import { describe, expect, it } from "vitest";

import {
  KNOWN_UI_DEBTS,
  UI_ASSET_CONTRACTS,
  UI_COLOR_TOKENS,
  UI_COMPONENT_GROUPS,
  UI_FOUNDATION_SCALES,
  UI_GENERATED_CHROME,
  UI_ECONOMY_ICONS,
  UI_CHROME_PRIMITIVES,
  UI_INFO_DERIVATIONS,
  UI_SYSTEM_DERIVATIONS,
  UI_IDENTITY_ASSETS,
  UI_MODULAR_KIT_ITEMS,
  UI_SYSTEM_ICONS,
  UI_SURFACE_ASSETS,
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
    expect(UI_GENERATED_CHROME).toHaveLength(5);
    expectUnique("generated chrome", UI_GENERATED_CHROME.map((entry) => entry.id));
    expect(UI_GENERATED_CHROME.every((entry) => entry.path.startsWith("/assets/ui/chrome/"))).toBe(true);
    expect(UI_MODULAR_KIT_ITEMS).toHaveLength(18);
    expect(UI_ECONOMY_ICONS).toHaveLength(16);
    expect(UI_SYSTEM_ICONS).toHaveLength(34);
    expect(UI_SURFACE_ASSETS).toHaveLength(14);
    expect(UI_CHROME_PRIMITIVES).toHaveLength(42);
    expect(UI_INFO_DERIVATIONS).toHaveLength(8);
    expect(UI_SYSTEM_DERIVATIONS).toHaveLength(2);
    expect(UI_IDENTITY_ASSETS).toHaveLength(12);
    expectUnique("kit", UI_MODULAR_KIT_ITEMS.map((entry) => entry.id));
    expectUnique("economy icon", UI_ECONOMY_ICONS.map((entry) => entry.id));
    expectUnique("system icon", UI_SYSTEM_ICONS.map((entry) => entry.id));
    expectUnique("surface asset", UI_SURFACE_ASSETS.map((entry) => entry.id));
    expectUnique("chrome primitive", UI_CHROME_PRIMITIVES.map((entry) => entry.id));
    expectUnique("info derivation", UI_INFO_DERIVATIONS.map((entry) => entry.id));
    expectUnique("system derivation", UI_SYSTEM_DERIVATIONS.map((entry) => entry.id));
    expectUnique("identity asset", UI_IDENTITY_ASSETS.map((entry) => entry.id));
    expect([...UI_ECONOMY_ICONS, ...UI_SYSTEM_ICONS].every((entry) => entry.path.startsWith("/assets/ui/kit/"))).toBe(true);
  });

  it("keeps measured layout debt explicit until its B-block resolves it", () => {
    expectUnique("debt", KNOWN_UI_DEBTS.map((entry) => entry.id));
    expect(KNOWN_UI_DEBTS.some((entry) => entry.priority === "P0")).toBe(false);
    expect(knownUiDebtIdsForWidth(390)).toEqual([]);
    expect(knownUiDebtIdsForWidth(820)).toEqual([]);
    expect(knownUiDebtIdsForWidth(1_280)).toEqual([]);
  });
});
