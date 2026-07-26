# B.07 · Responsive Design und Zugänglichkeit

Stand: **26. Juli 2026 · B.07.4 abgenommen**

## Referenzmatrix

| Viewport | Erwartung | Nachweis |
| --- | --- | --- |
| 1280×720 | Kampf-Bühne, HUD und Topbar ohne Überbreite | `responsive.spec.ts`, `ui-layout-audit.spec.ts` |
| 1024×768 | Tablet-Raster, einklappbare Panels, lesbare Capture-Flächen | `playwright.capture.config.ts`, `ui-catalog-responsive.spec.ts` |
| 390×844 | 7er-Dock einreihig, Touchflächen und Offline-Bericht innerhalb der Breite | `responsive.spec.ts`, `ui-layout-audit.spec.ts` |

Tastaturfokus, WCAG-AA-Kontrast, Reduced Motion sowie Loading-, Konflikt-,
Leer- und Sperrzustände sind im Accessibility-/State-Matrix-Lauf enthalten.
`b07-b08-acceptance.spec.ts` ergänzt die drei Viewports um 2×-Typografiestress
und prüft, dass Kernsteuerungen im Layout bleiben. Die Tablet-/Mobile-Projekte
laufen mit Touch-Emulation; echte Geräte bleiben ein manueller Smoke-Schritt
für Roadmap D, nicht eine offene B-Gate-Schuld.

## Abnahmekriterien

- keine P0/P1-Überläufe auf den drei Referenz-Viewports;
- Fokus ist sichtbar und die Kernaktion per Tastatur erreichbar;
- reduzierte Bewegung stoppt statt beschleunigt Animationen;
- Zustände bleiben verständlich, auch wenn ein Serverpfad nicht verfügbar ist;
- 200-%-Typografiestress, Touch-Emulation und die Chromium-Desktop-/Tablet-/Mobile-Matrix sind dokumentiert geprüft.

## Abnahmebefund

Keine P0/P1-Überläufe, sichtbarer Fokus, bedienbare Kernaktionen und Reduced
Motion sind in den lokalen E2E-/Audit-Läufen grün. Die drei Referenz-Capture-
Sätze liegen unter `artifacts/ui-captures/`.
