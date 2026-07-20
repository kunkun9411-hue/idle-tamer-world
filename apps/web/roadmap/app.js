const accentVariables = {
  violet: "var(--violet)",
  cyan: "var(--cyan)",
  blue: "var(--blue)",
  amber: "var(--amber)",
  crimson: "var(--crimson)",
  mint: "var(--mint)",
  magenta: "var(--magenta)",
  gold: "var(--gold)",
};

const visualTemplates = {
  battle: () => `
    <div class="visual-label">Spielbarer Prototyp</div>
    <div class="battle-visual" style="background-image:url('/assets/zones/glass-gardens-v2.webp')">
      <div class="battle-hud"><span>ZONE 02</span><span>AUTO-KAMPF</span></div>
      <img class="creature creature--left" src="/assets/monsters/pyrook_idle_right.png" alt="Pyrook" />
      <img class="creature creature--right" src="/assets/bosses/mirrormaw-hydra_idle_left.png" alt="Spiegelschlund-Hydra" />
    </div>`,
  client: () => `
    <div class="visual-label">Zielbild · stabiler Client</div>
    <div class="client-visual">
      <div class="device-frame">
        <div class="device-screen">
          <div class="device-bars"><span></span><span></span></div>
          <img class="device-mon" src="/assets/monsters/voltfin_idle_right.png" alt="Voltfin in der Kampfansicht" />
          <div class="device-panel"><i></i><i></i><i></i><i></i></div>
        </div>
      </div>
    </div>`,
  backend: () => `
    <div class="visual-label">Zielbild · autoritative Architektur</div>
    <div class="backend-visual">
      <div class="system-map">
        <div class="system-node"><strong>Browser</strong><small>sendet Absichten</small></div>
        <div class="system-node"><strong>API</strong><small>prüft Regeln</small></div>
        <div class="system-node"><strong>PostgreSQL</strong><small>besitzt Wahrheit</small></div>
      </div>
    </div>`,
  account: () => `
    <div class="visual-label">Zielbild · sichere Identität</div>
    <div class="account-visual">
      <div class="account-card">
        <div class="account-avatar"><img src="/assets/monsters/lumipup_idle_right.png" alt="Lumipup als Profilavatar" /></div>
        <h4>Willkommen zurück, Tamer</h4>
        <p>Dein Fortschritt wartet serverseitig.</p>
        <div class="account-field">Tamer-ID</div>
        <div class="account-field">Sichere Session</div>
      </div>
    </div>`,
  economy: () => `
    <div class="visual-label">Zielbild · serverseitige Wirtschaft</div>
    <div class="battle-visual" style="background-image:url('/assets/zones/violet-rim-v2.webp')">
      <div class="battle-hud"><span>REV 1 284</span><span>LEDGER AKTIV</span></div>
      <img class="creature creature--left" src="/assets/monsters/riftjaw_idle_right.png" alt="Riftjaw" />
      <img class="creature creature--right" src="/assets/bosses/pyroclast-seraph_idle_left.png" alt="Pyroklast-Seraph" />
      <div class="ledger-stack"><span class="ledger-chip">+ 1 240 Gold</span><span class="ledger-chip">Command bestätigt</span></div>
    </div>`,
  collection: () => `
    <div class="visual-label">Zielbild · permanenter Fortschritt</div>
    <div class="collection-visual">
      <div class="collection-stage">
        <span class="collection-chip">Hyperlevel · bleibt nach Prestige</span>
        <img class="collection-mon" src="/assets/monsters/frostel_idle_right.png" alt="Frostel" />
        <div class="gem-cluster">
          <img src="/assets/gems/mythic/triangle-violet.png" alt="Mythischer violetter Dreieck-Gem" />
          <img src="/assets/gems/rare/square-azure.png" alt="Seltener blauer Quadrat-Gem" />
          <img src="/assets/gems/mythic/diamond-jade.png" alt="Mythischer grüner Raute-Gem" />
          <img src="/assets/gems/common/diamond-amber.png" alt="Gewöhnlicher gelber Raute-Gem" />
        </div>
      </div>
    </div>`,
  guild: () => `
    <div class="visual-label">Zielbild · lebende Gilden-DNA</div>
    <div class="guild-visual">
      <div class="dna-shell">
        <svg class="dna-strand" viewBox="0 0 420 420" role="img" aria-label="Animierte DNA-Doppelhelix">
          <defs>
            <linearGradient id="strandA" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#66d8d2"/><stop offset="1" stop-color="#a478ea"/></linearGradient>
            <linearGradient id="strandB" x1="1" y1="0" x2="0" y2="1"><stop stop-color="#dc73dd"/><stop offset="1" stop-color="#8c7cff"/></linearGradient>
          </defs>
          <path d="M95 18 C350 82 350 142 95 210 C-30 246 65 348 325 402" fill="none" stroke="url(#strandA)" stroke-width="8" stroke-linecap="round"/>
          <path d="M325 18 C70 82 70 142 325 210 C450 246 355 348 95 402" fill="none" stroke="url(#strandB)" stroke-width="8" stroke-linecap="round"/>
          <g stroke="#d8d6ec" stroke-opacity=".32" stroke-width="4">
            <path d="M132 35 L288 35"/><path d="M86 82 L334 82"/><path d="M99 132 L321 132"/><path d="M151 180 L269 180"/>
            <path d="M151 240 L269 240"/><path d="M98 289 L322 289"/><path d="M88 338 L332 338"/><path d="M132 388 L288 388"/>
          </g>
          <g fill="#e5a2ff">
            <circle class="dna-gene" cx="132" cy="35" r="8"/><circle class="dna-gene" cx="334" cy="82" r="9"/>
            <circle class="dna-gene" cx="99" cy="132" r="7"/><circle class="dna-gene" cx="269" cy="180" r="10"/>
            <circle class="dna-gene" cx="151" cy="240" r="8"/><circle class="dna-gene" cx="322" cy="289" r="9"/>
            <circle class="dna-gene" cx="88" cy="338" r="7"/><circle class="dna-gene" cx="288" cy="388" r="9"/>
          </g>
        </svg>
        <div class="guild-badge"><img src="/assets/monsters/glimmite_idle_right.png" alt="Glimmite als Gildenwappen" /></div>
      </div>
    </div>`,
  launch: () => `
    <div class="visual-label">Zielbild · Wettbewerb & Livebetrieb</div>
    <div class="launch-visual">
      <div class="launch-stage">
        <div class="launch-rank">S1</div>
        <img class="launch-boss" src="/assets/bosses/nihil-warden_idle_left.png" alt="Nihil-Wächter als Saisonboss" />
      </div>
    </div>`,
};

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const getPercent = (block) => {
  const completed = block.steps.filter((step) => step.done).length;
  return Math.round((completed / block.steps.length) * 100);
};

const getState = (block, data) => {
  if (block.steps.every((step) => step.done)) return "Fertig";
  if (block.id === data.activeBlock) return "Aktiv";
  return "Später";
};

const renderCard = (block, data, selectedId) => {
  const percent = getPercent(block);
  const state = getState(block, data);
  return `
    <button
      class="block-card"
      type="button"
      data-block-id="${block.id}"
      data-active="${block.id === data.activeBlock}"
      aria-pressed="${block.id === selectedId}"
      style="--card-accent:${accentVariables[block.accent] ?? accentVariables.violet}"
    >
      <span class="card-top">
        <span class="card-number">BLOCK ${String(block.id).padStart(2, "0")}</span>
        <span class="card-state">${state}</span>
      </span>
      <h3>${escapeHtml(block.title)}</h3>
      <p>${escapeHtml(block.summary)}</p>
      <span class="card-progress-label"><span>${block.steps.filter((step) => step.done).length}/4 Schritte</span><span>${percent}%</span></span>
      <span class="progress-bar" aria-hidden="true"><span style="--value:${percent}%"></span></span>
    </button>`;
};

const renderDetail = (block, data) => {
  const percent = getPercent(block);
  const isActive = block.id === data.activeBlock;
  document.querySelector("#detail-kicker").innerHTML = `<span></span> Block ${String(block.id).padStart(2, "0")} · ${escapeHtml(block.kicker)}`;
  document.querySelector("#detail-title").textContent = block.title;
  document.querySelector("#detail-percent").textContent = `${percent}%`;
  document.querySelector("#detail-summary").textContent = block.summary;
  document.querySelector("#detail-visual").innerHTML = (visualTemplates[block.visual] ?? visualTemplates.backend)();
  document.querySelector("#step-list").innerHTML = block.steps.map((step, index) => `
    <article class="step-item" data-done="${step.done}" data-current="${isActive && index + 1 === data.activeStep}">
      <span class="step-icon" aria-hidden="true">✓</span>
      <strong>${index + 1}. ${escapeHtml(step.name)}</strong>
      <p>${escapeHtml(step.note)}</p>
    </article>`).join("");

  const hint = block.steps.every((step) => step.done)
    ? "Dieser Block ist abgenommen. Er wird nur für Fehlerkorrekturen erneut geöffnet."
    : isActive
      ? `Aktuell aktiv: Schritt ${data.activeStep} – ${block.steps[data.activeStep - 1].name}.`
      : `Dieser Block startet nach der Abnahme von Block ${block.id - 1}.`;
  document.querySelector("#detail-hint").textContent = hint;
};

const init = async () => {
  const response = await fetch("/roadmap/roadmap-status.json", { cache: "no-store" });
  if (!response.ok) throw new Error(`Status konnte nicht geladen werden (${response.status}).`);
  const data = await response.json();
  const totalSteps = data.blocks.reduce((sum, block) => sum + block.steps.length, 0);
  const completedSteps = data.blocks.reduce((sum, block) => sum + block.steps.filter((step) => step.done).length, 0);
  const overallPercent = (completedSteps / totalSteps) * 100;
  const activeBlock = data.blocks.find((block) => block.id === data.activeBlock) ?? data.blocks[0];
  let selectedId = activeBlock.id;

  document.querySelector("#overall-percent").textContent = `${Number.isInteger(overallPercent) ? overallPercent : overallPercent.toFixed(1)}%`;
  document.querySelector("#overall-ring").style.setProperty("--progress", `${overallPercent}%`);
  document.querySelector("#active-block-label").textContent = `0${activeBlock.id} · ${activeBlock.title}`;
  document.querySelector("#active-step-label").textContent = `${data.activeStep} · ${activeBlock.steps[data.activeStep - 1].name}`;
  document.querySelector("#completed-label").textContent = `${completedSteps} / ${totalSteps} Gates`;
  document.querySelector("#updated-label").textContent = data.updated;

  const grid = document.querySelector("#block-grid");
  const paintCards = () => {
    grid.innerHTML = data.blocks.map((block) => renderCard(block, data, selectedId)).join("");
    grid.querySelectorAll(".block-card").forEach((button) => {
      button.addEventListener("click", () => {
        selectedId = Number(button.dataset.blockId);
        const selected = data.blocks.find((block) => block.id === selectedId);
        paintCards();
        renderDetail(selected, data);
        document.querySelector("#detail").scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });
  };

  paintCards();
  renderDetail(activeBlock, data);
};

init().catch((error) => {
  document.querySelector("#block-grid").innerHTML = `<div class="error-card"><strong>Roadmap nicht verfügbar.</strong><br />${escapeHtml(error.message)}</div>`;
  document.querySelector("#detail").hidden = true;
});
