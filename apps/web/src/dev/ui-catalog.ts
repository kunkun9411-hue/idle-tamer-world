import "../styles.css";
import "../styles-v2.css";
import "./ui-catalog.css";

import { AVATARS, FRAMES } from "../game/catalog";
import {
  KNOWN_UI_DEBTS,
  UI_ASSET_CONTRACTS,
  UI_COLOR_TOKENS,
  UI_COMPONENT_GROUPS,
  UI_FOUNDATION_SCALES,
  UI_STATES,
  UI_SURFACES,
  UI_TYPOGRAPHY_ROLES,
  UI_VIEWPORTS,
} from "./ui-catalog-data";

const root = document.querySelector<HTMLElement>("#ui-catalog");
if (!root) throw new Error("UI catalog root is missing.");

const activeAvatar = AVATARS[0];
const activeFrame = FRAMES[1];

const statePath = (query?: string): string => query ? `/?ui-state=${query}` : "/";

root.innerHTML = `
  <div class="catalog-ambient" aria-hidden="true"></div>
  <header class="catalog-header">
    <a class="catalog-brand" href="/"><span></span><div><small>ETHER PROTOCOL · DEV</small><strong>IDLE TAMER UI-KATALOG</strong></div></a>
    <nav aria-label="Katalogbereiche"><a href="#components">Bauteile</a><a href="#states">Zustände</a><a href="#surfaces">Flächen</a><a href="#viewport">Viewports</a><a href="#debt">Schulden</a></nav>
    <a class="secondary-button" href="/roadmap/">ROADMAP</a>
  </header>
  <main class="catalog-main">
    <section class="catalog-hero">
      <div><span class="eyebrow">B.01 · DESIGNSYSTEM</span><h1>Eine Oberfläche.<br><em>Lesbar statt winzig.</em></h1><p>Der gemeinsame Token-, Bauteil-, Zustands- und Viewportvertrag für Roadmap B. Texte bleiben echte UI-Inhalte; generierte Bilder liefern ausschließlich textfreie visuelle Ebenen.</p></div>
      <div class="catalog-score panel"><strong>${UI_SURFACES.length}</strong><span>SPIELFLÄCHEN</span><i></i><strong>${UI_STATES.length}</strong><span>PFLICHTZUSTÄNDE</span><i></i><strong>${KNOWN_UI_DEBTS.length}</strong><span>BEKANNTE LAYOUTSCHULDEN</span></div>
    </section>

    <section class="catalog-section" id="tokens"><div class="catalog-heading"><div><span class="eyebrow">SILVER ETHER</span><h2>Verbindliche Design-Tokens</h2></div><p>Monster liefern Farbe. Die Oberfläche bleibt ruhig, silbern und kontrolliert violett.</p></div><div class="token-grid">${UI_COLOR_TOKENS.map((token) => `<article><i style="--token:var(--${token})"></i><strong>--${token}</strong><small>${getComputedStyle(document.documentElement).getPropertyValue(`--${token}`).trim()}</small></article>`).join("")}</div>
      <div class="catalog-subheading"><span class="eyebrow">TYPOGRAFIE</span><h3>Neun Rollen, keine Mikroschrift</h3><p>12 px ist die Untergrenze für bedeutungstragenden Text. Spielwerte erhalten tabellarische Ziffern.</p></div>
      <div class="type-contract-grid">${UI_TYPOGRAPHY_ROLES.map((role) => `<article class="panel"><span>${role.id.toUpperCase()}</span><strong style="--sample-size:${role.size};--sample-line:${role.lineHeight};--sample-weight:${role.weight}">${role.name}</strong><small>${role.size} · ${role.weight} · ${role.use}</small></article>`).join("")}</div>
      <div class="foundation-grid">${UI_FOUNDATION_SCALES.map((scale) => `<article class="panel"><span>${scale.name}</span><strong>${scale.values}</strong></article>`).join("")}</div>
    </section>

    <section class="catalog-section" id="components"><div class="catalog-heading"><div><span class="eyebrow">KOMPONENTEN</span><h2>Ein Bauteilkatalog, keine Einzellösungen</h2></div><p>${UI_COMPONENT_GROUPS.length} Gruppen bilden die gemeinsame Sprache der Spieloberfläche.</p></div>
      <div class="component-lab">
        <article class="catalog-demo panel"><small>AKTIONEN</small><div class="catalog-row"><button class="primary-button">PRIMÄR</button><button class="secondary-button">SEKUNDÄR</button><button class="ghost-button">GHOST</button><button class="primary-button" disabled>GESPERRT</button></div></article>
        <article class="catalog-demo panel"><small>STATUS</small><div class="catalog-row"><span class="soft-chip is-live">ONLINE</span><span class="soft-chip">BEREIT</span><span class="catalog-warning">WARNUNG</span><span class="catalog-error">FEHLER</span></div></article>
        <article class="catalog-demo panel"><small>FORTSCHRITT</small><div class="catalog-progress"><span><b>RESONANZ</b><em>68 %</em></span><i><b></b></i></div><div class="catalog-progress is-success"><span><b>EXPEDITION</b><em>BEREIT</em></span><i><b></b></i></div></article>
        <article class="catalog-demo panel"><small>EINGABEN</small><label class="catalog-input"><span>TAMER-NAME</span><input value="Riftläufer" aria-label="Tamer-Name-Beispiel"></label><label class="catalog-check"><input type="checkbox" checked> <span>Bestätigung sichtbar</span></label></article>
        <article class="catalog-demo panel"><small>KARTEN</small><div class="catalog-state-cards"><span class="is-active"><b>AKTIV</b><em>Ausgewählter Zustand</em></span><span><b>STANDARD</b><em>Ruhige Information</em></span><span class="is-locked"><b>GESPERRT</b><em>Zone 10 erforderlich</em></span></div></article>
        <article class="catalog-demo panel"><small>IDENTITÄT</small><div class="catalog-identity" style="--avatar-a:${activeAvatar.colors[0]};--avatar-b:${activeAvatar.colors[1]};--frame-a:${activeFrame.colors[0]};--frame-b:${activeFrame.colors[1]}"><span><i>${activeAvatar.glyph}</i></span><div><b>${activeAvatar.name}</b><em>${activeFrame.name}</em><small>Avatar-ID und Rahmen-ID bleiben getrennt</small></div></div></article>
      </div>
    </section>

    <section class="catalog-section" id="states"><div class="catalog-heading"><div><span class="eyebrow">ZUSTANDSMATRIX</span><h2>Zehn Zustände pro relevanter Fläche</h2></div><p>Die Query-Zustände öffnen den echten Client. Fachzustände werden im Screenshotlauf erzeugt.</p></div><div class="state-grid">${UI_STATES.map((state) => `<article class="panel"><span>${state.id.toUpperCase()}</span><h3>${state.name}</h3><p>${state.purpose}</p><a href="${statePath(state.previewQuery)}" target="catalog-preview">${state.previewQuery ? "IM CLIENT PRÜFEN" : "STANDARD ÖFFNEN"}</a></article>`).join("")}</div></section>

    <section class="catalog-section" id="surfaces"><div class="catalog-heading"><div><span class="eyebrow">SZENENINVENTAR</span><h2>16 Flächen mit klarer B-Zuständigkeit</h2></div><p>Große neue Systeme gehören weiterhin Roadmap C.</p></div><div class="surface-grid">${UI_SURFACES.map((surface) => `<article class="panel"><span>${surface.id} · ${surface.area.toUpperCase()}</span><h3>${surface.name}</h3><p>${surface.states.map((state) => UI_STATES.find((entry) => entry.id === state)?.name ?? state).join(" · ")}</p><footer>${surface.blocks.map((block) => `<b>${block}</b>`).join("")}</footer></article>`).join("")}</div></section>

    <section class="catalog-section" id="assets"><div class="catalog-heading"><div><span class="eyebrow">ASSETVERTRÄGE</span><h2>Runtime, Quelle und Übergabe</h2></div><p>Generierte UI-Ebenen bleiben textfrei. Namen, Zahlen, Kosten und Buttons werden immer als echte UI darübergelegt.</p></div><div class="asset-contract-grid">${UI_ASSET_CONTRACTS.map((asset) => `<article class="panel"><span>${asset.id.toUpperCase()}</span><h3>${asset.name}</h3><dl><dt>Runtime</dt><dd>${asset.runtime}</dd><dt>Quelle</dt><dd>${asset.source}</dd><dt>Text</dt><dd>${asset.textPolicy}</dd><dt>Vertrag</dt><dd>${asset.document}</dd></dl></article>`).join("")}</div></section>

    <section class="catalog-section" id="viewport"><div class="catalog-heading"><div><span class="eyebrow">VIEWPORT-STUDIO</span><h2>Client in festen Abnahmegrößen</h2></div><p>Für vollständige Bildserien: <code>pnpm ui:capture</code>.</p></div><div class="viewport-toolbar" role="group" aria-label="Viewport wählen">${UI_VIEWPORTS.map((viewport, index) => `<button class="${index === 0 ? "is-active" : ""}" data-viewport="${viewport.id}"><b>${viewport.name}</b><small>${viewport.width}×${viewport.height}</small></button>`).join("")}</div><div class="viewport-stage"><div class="viewport-frame" style="--preview-width:${UI_VIEWPORTS[0].width}px;--preview-height:${UI_VIEWPORTS[0].height}px"><iframe name="catalog-preview" src="/" title="Idle Tamer UI-Vorschau"></iframe></div></div></section>

    <section class="catalog-section" id="debt"><div class="catalog-heading"><div><span class="eyebrow">BEKANNTE UX-SCHULDEN</span><h2>Offen, messbar und zugeordnet</h2></div><p>Der Layout-Audit erlaubt nur diese bekannten Befunde. Jede neue Kollision lässt den Test fehlschlagen.</p></div><div class="debt-grid">${KNOWN_UI_DEBTS.map((debt) => `<article class="panel debt-${debt.priority.toLowerCase()}"><span>${debt.priority} · ${debt.id}</span><h3>${debt.title}</h3><p>${debt.description}</p><footer>${debt.blocks.map((block) => `<b>${block}</b>`).join("")}</footer></article>`).join("")}</div></section>
  </main>
  <footer class="catalog-footer"><span>Idle Tamer · Designvertrag B.01</span><span>Quelle: ui-catalog-data.ts · docs/ui</span></footer>`;

const viewportFrame = document.querySelector<HTMLElement>(".viewport-frame");
for (const button of document.querySelectorAll<HTMLButtonElement>("[data-viewport]")) {
  button.addEventListener("click", () => {
    const viewport = UI_VIEWPORTS.find((entry) => entry.id === button.dataset.viewport);
    if (!viewport || !viewportFrame) return;
    document.querySelectorAll("[data-viewport]").forEach((entry) => entry.classList.toggle("is-active", entry === button));
    viewportFrame.style.setProperty("--preview-width", `${viewport.width}px`);
    viewportFrame.style.setProperty("--preview-height", `${viewport.height}px`);
  });
}
