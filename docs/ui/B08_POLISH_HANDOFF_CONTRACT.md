# B.08 · Gesamtpolish und Übergabe

Stand: **26. Juli 2026 · B.08.4 abgenommen und an Roadmap C übergeben**

## Übergabekriterien

- UI-Kit: 136 Rasterelemente, 10 CSS-/Rotationsableitungen, 257 Manifest-IDs;
- Runtime-Budget: 8,39 MB unter dem 8,5-MB-Limit;
- visuelle Referenzen: 14 Szenen je Desktop/Tablet/Mobile-Capture-Satz;
- reproduzierbare Regression: Roadmap-, Unit-, E2E-, Layout-Audit-, Capture-
  und Produktionsbuild-Befehle;
- keine offene Layoutschuld in der UI-Audit-Allowlist;
- C-Übergabe bleibt auf Darstellung/Feedback begrenzt; serverautoritative
  Wirtschaft, Besitz, Zeit, Rechte und Gildenledger bleiben unverändert.

## Abnahmebefund

Die 14 Szenen je Desktop/Tablet/Mobile wurden mit reduzierter Bewegung neu
erzeugt und visuell geprüft; der Live-Gildenhub ist zusätzlich unter
`apps/web/artifacts/ui-captures/live-guild.png` festgehalten. Der neue B07/B08-
E2E-Lauf prüft Mikrofeedback, Fokusmodus, Reduced Motion, 2×-Typografiestress
und reproduzierbare Capture-Erzeugung. `pnpm check:roadmap`, Assetvalidator,
Unit-/Vertragstests, 31 lokale E2E, Layout-Audit, Capture und Produktionsbuild
sind grün. Roadmap B ist damit eingefroren; Wirtschaft, Besitz, Zeit, Rechte
und Gildenledger bleiben unverändert serverautoritativ.
