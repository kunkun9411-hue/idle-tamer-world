export const LOW_NUMBER_POLICY = {
  scientificNotationThreshold: 1_000_000_000_000_000,
  preScientificMaxCostStepMultiplier: 2,
  firstPrestigeTargetCeiling: 10_000,
  earlyAccountTargetCeiling: 1_000_000,
} as const;

export type GameNumberFormat = "compact" | "full";

const compactFormatter = new Intl.NumberFormat("de-DE", { notation: "compact", maximumFractionDigits: 1 });
const fullFormatter = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 });
const mantissaFormatter = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

/**
 * Human-readable values remain the default until one quadrillion. Scientific
 * notation is a deliberate endgame phase, never an early-economy shortcut.
 */
export const formatGameNumber = (value: number, format: GameNumberFormat): string => {
  if (!Number.isFinite(value)) return "0";
  if (Math.abs(value) >= LOW_NUMBER_POLICY.scientificNotationThreshold) {
    const exponent = Math.floor(Math.log10(Math.abs(value)));
    const mantissa = value / 10 ** exponent;
    return `${mantissaFormatter.format(mantissa)}e${exponent}`;
  }
  return format === "full" ? fullFormatter.format(Math.round(value)) : compactFormatter.format(Math.round(value));
};

export const costStepMultiplier = (currentCost: number, nextCost: number): number =>
  currentCost <= 0 ? Number.POSITIVE_INFINITY : nextCost / currentCost;
