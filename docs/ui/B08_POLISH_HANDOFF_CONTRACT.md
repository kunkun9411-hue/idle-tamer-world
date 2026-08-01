# B.08 · Gesamtpolish und Übergabe

Stand: **30. Juli 2026 · B.08.1 bis B.08.4 vollständig geprüft und abgenommen**

## Übergabekriterien

- UI-Kit: 136 Rasterelemente, 10 CSS-/Rotationsableitungen, 271 Manifest-IDs;
- Foundation-Budget: 15,33 MB unter dem aktuellen 16-MB-Limit;
- visuelle Referenzen: aktuelle Desktop/Tablet/Mobile-Capture-Sätze;
- reproduzierbare Regression: Roadmap-, Unit-, E2E-, Layout-Audit-, Capture-
  und Produktionsbuild-Befehle;
- keine bekannte P0/P1-Layoutschuld in der automatisierten Referenzmatrix;
- vollständiger Live-Spielerlauf nach dem finalen Deployment;
- C-Übergabe erst nach synchroner B.03- und B.08-Abnahme; serverautoritative
  Wirtschaft, Besitz, Zeit, Rechte und Gildenledger bleiben unverändert.

## Abnahmebefund

Der Lauf vom 26. Juli bleibt ein historischer technischer Nachweis, aber keine
aktuelle B.08-Abnahme. Die Folgeprüfung vom 29. Juli schließt QA-01 bis QA-05
technisch, ergänzt eine isolierte Zwei-Monster-/Support-/Zonenbonus-Strecke und
sichert die gefundene mobile Eingabeblockade in der Responsive-Regression ab.
Desktop-, Tablet- und Mobile-Captures wurden erneut visuell geprüft.

Dieser Absatz dokumentiert den damaligen Zwischenstand von 29. Juli. Die
anschließend geforderte Live-Spielerprüfung und Gesamtpolish-Abnahme wurden am
30. Juli abgeschlossen. Wirtschaft, Besitz, Zeit, Rechte und Gildenledger
blieben unverändert serverautoritativ.

## Finale Polish- und Übergabeabnahme

Der finale Live-Lauf wurde gegen
`5820733c5dab4dfc8e35d411574e2b8491aafd15` auf 1280×720, 1024×768 und
390×844 durchgeführt. Mobile wurde in einer echten Dev-Session bedient.

Abgenommene Geometrien und Interaktionen:

- Spielerkarte 286×66 px auf Desktop/Tablet und 286×58 px auf Mobile;
- Monster 307/379 px auf Desktop und 300/370 px auf Tablet;
- mobiles Kampfdock 378×56 px;
- mobiles Bereiche-Fenster 378×253 px;
- per Tastatur und Touch erreichbare Inventar-Itemdetails;
- Brut-CTA 220×44 px;
- kein horizontaler Overflow;
- Browserkonsole mit 0 Warnungen und 0 Fehlern.

Die Abschlussautomation meldete `pnpm check` grün: 67 Web-, 24 API-, 11
Datenbank-Unit- und 6 Core-Tests, vollständige Builds und 271 Asset-Prüfungen.
Die E2E-Matrix lief mit vier Workern und endete mit 66 bestandenen sowie 2
übersprungenen Tests. Die isolierte Bossprüfung bestand 6/6, die
Capture-Matrix 3/3.

Die Werte 28/28 Datenbank-Integrationen, Live Auth 1/1 und Live Gilde 1/1
stammen aus der Prüfung vor dem finalen UI-only-Commit. Sie belegen die
unveränderten Backendpfade, sind jedoch keine nach dem finalen SHA neu
ausgeführte Backendprüfung.

Die QA-Bereinigung anonymisierte 3 synthetische Konten, entfernte 1 QA-Gilde
und bestätigte 0 aktive QA-Muster.

**Übergabeentscheidung:** B.08.3 und B.08.4 sind geschlossen. B.08 ist
vollständig abgenommen; die B-Abnahme blockiert die Übergabe nicht mehr. Die
vollständige Evidenz steht in
[`ROADMAP_B_LIVE_ACCEPTANCE_2026-07-30.md`](./ROADMAP_B_LIVE_ACCEPTANCE_2026-07-30.md).
