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
  design: () => `
    <div class="visual-label">Zielbild · Silver-Ether-System</div>
    <div class="design-visual">
      <div class="design-board">
        <div class="design-palette"><i></i><i></i><i></i><i></i><i></i></div>
        <div class="design-type"><small>DISPLAY / 52</small><strong>ETHER</strong><span>Interface typography · readable at every scale</span></div>
        <div class="design-components"><button>PRIMÄR</button><button>SEKUNDÄR</button><span>AKTIV</span></div>
      </div>
    </div>`,
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
  navigation: () => `
    <div class="visual-label">Zielbild · klare Spielerwege</div>
    <div class="navigation-visual">
      <div class="navigation-map">
        <div><span>01</span><strong>Kampf</strong><small>Hauptszene</small></div>
        <i>→</i>
        <div><span>02</span><strong>Sammlung</strong><small>Entwicklung</small></div>
        <i>→</i>
        <div><span>03</span><strong>Gilde</strong><small>Gemeinschaft</small></div>
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
  responsive: () => `
    <div class="visual-label">Zielbild · drei robuste Viewports</div>
    <div class="responsive-visual">
      <div class="viewport-set">
        <div class="viewport viewport--desktop"><span></span><i></i><i></i></div>
        <div class="viewport viewport--tablet"><span></span><i></i><i></i></div>
        <div class="viewport viewport--mobile"><span></span><i></i><i></i></div>
      </div>
    </div>`,
  handoff: () => `
    <div class="visual-label">Zielbild · Übergabe von A nach B</div>
    <div class="launch-visual">
      <div class="handoff-stage">
        <div class="handoff-roadmap is-current"><span>A</span><strong>System</strong><small>100% · EINGEFROREN</small></div>
        <i aria-hidden="true">→</i>
        <div class="handoff-roadmap"><span>B</span><strong>Design & UI</strong><small>AKTIVER FOKUS</small></div>
      </div>
    </div>`,
  launch: () => `
    <div class="visual-label">Zielbild · Übergabe von B nach C</div>
    <div class="launch-visual">
      <div class="handoff-stage">
        <div class="handoff-roadmap is-current"><span>B</span><strong>Design & UI</strong><small>GESCHLOSSENES ERLEBNIS</small></div>
        <i aria-hidden="true">→</i>
        <div class="handoff-roadmap"><span>C</span><strong>Content</strong><small>NÄCHSTER FOKUS</small></div>
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

const getTotals = (data) => {
  const total = data.blocks.reduce((sum, block) => sum + block.steps.length, 0);
  const completed = data.blocks.reduce((sum, block) => sum + block.steps.filter((step) => step.done).length, 0);
  return { total, completed, percent: total === 0 ? 0 : (completed / total) * 100 };
};

const formatPercent = (percent) => `${Number.isInteger(percent) ? percent : percent.toFixed(1)}%`;

const getBlockCode = (data, block) => `${data.roadmap}.${String(block.id).padStart(2, "0")}`;

const getState = (block, data) => {
  if (block.steps.every((step) => step.done)) return "Fertig";
  if (data.status === "active" && block.id === data.activeBlock) return "Aktiv";
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
      data-active="${data.status === "active" && block.id === data.activeBlock}"
      aria-pressed="${block.id === selectedId}"
      style="--card-accent:${accentVariables[block.accent] ?? accentVariables.violet}"
    >
      <span class="card-top">
        <span class="card-number">${getBlockCode(data, block)}</span>
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
  const isActive = data.status === "active" && block.id === data.activeBlock;
  document.querySelector("#detail-kicker").innerHTML = `<span></span> ${getBlockCode(data, block)} · ${escapeHtml(block.kicker)}`;
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
    ? data.status === "complete"
      ? "Dieser Block ist abgenommen und eingefroren. Roadmap A wird nur für kritische Fehler erneut geöffnet."
      : "Dieser Block ist abgenommen. Er wird nur für Fehlerkorrekturen erneut geöffnet."
    : isActive
      ? `Aktuell aktiv: ${getBlockCode(data, block)}, Schritt ${data.activeStep} – ${block.steps[data.activeStep - 1].name}.`
      : `Dieser Block startet nach der Abnahme von ${data.roadmap}.${String(block.id - 1).padStart(2, "0")}.`;
  document.querySelector("#detail-hint").textContent = hint;
};

const init = async () => {
  const [aResponse, bResponse] = await Promise.all([
    fetch("/roadmap/roadmap-a-status.json", { cache: "no-store" }),
    fetch("/roadmap/roadmap-status.json", { cache: "no-store" }),
  ]);
  if (!aResponse.ok || !bResponse.ok) {
    throw new Error(`Status konnte nicht geladen werden (A: ${aResponse.status}, B: ${bResponse.status}).`);
  }

  const roadmaps = {
    A: await aResponse.json(),
    B: await bResponse.json(),
  };
  const activeData = roadmaps.B;
  const activeBlock = activeData.blocks.find((block) => block.id === activeData.activeBlock) ?? activeData.blocks[0];
  const activeTotals = getTotals(activeData);
  const aTotals = getTotals(roadmaps.A);
  let selectedRoadmap = "B";
  let selectedIds = { A: roadmaps.A.blocks.at(-1).id, B: activeBlock.id };

  document.querySelector("#overall-percent").textContent = formatPercent(activeTotals.percent);
  document.querySelector("#overall-ring").style.setProperty("--progress", `${activeTotals.percent}%`);
  document.querySelector("#program-a-percent").textContent = formatPercent(aTotals.percent);
  document.querySelector("#program-b-percent").textContent = formatPercent(activeTotals.percent);
  document.querySelector("#switch-a-progress").textContent = `${aTotals.completed}/${aTotals.total} · ${formatPercent(aTotals.percent)}`;
  document.querySelector("#switch-b-progress").textContent = `${activeTotals.completed}/${activeTotals.total} · ${formatPercent(activeTotals.percent)}`;
  document.querySelector("#active-block-label").textContent = `${getBlockCode(activeData, activeBlock)} · ${activeBlock.title}`;
  document.querySelector("#active-step-label").textContent = `${activeData.activeStep} · ${activeBlock.steps[activeData.activeStep - 1].name}`;
  document.querySelector("#completed-label").textContent = `${activeTotals.completed} / ${activeTotals.total} B-Gates`;
  document.querySelector("#updated-label").textContent = activeData.updated;

  const grid = document.querySelector("#block-grid");
  const paintCards = () => {
    const data = roadmaps[selectedRoadmap];
    const selectedId = selectedIds[selectedRoadmap];
    grid.innerHTML = data.blocks.map((block) => renderCard(block, data, selectedId)).join("");
    grid.querySelectorAll(".block-card").forEach((button) => {
      button.addEventListener("click", () => {
        selectedIds[selectedRoadmap] = Number(button.dataset.blockId);
        const selected = data.blocks.find((block) => block.id === selectedIds[selectedRoadmap]);
        paintCards();
        renderDetail(selected, data);
        document.querySelector("#detail").scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });
  };

  const paintRoadmap = () => {
    const data = roadmaps[selectedRoadmap];
    const selected = data.blocks.find((block) => block.id === selectedIds[selectedRoadmap]) ?? data.blocks[0];
    document.querySelector("#selected-roadmap-label").innerHTML = `<span></span> Roadmap ${data.roadmap}`;
    document.querySelector("#blocks-title").textContent = data.roadmap === "A"
      ? "Acht abgeschlossene Blöcke des Systemfundaments."
      : "Acht Blöcke für Design und Oberfläche.";
    document.querySelectorAll("[data-roadmap-switch]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.roadmapSwitch === selectedRoadmap));
    });
    paintCards();
    renderDetail(selected, data);
  };

  document.querySelectorAll("[data-roadmap-switch]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedRoadmap = button.dataset.roadmapSwitch;
      paintRoadmap();
    });
  });

  paintRoadmap();
};

init().catch((error) => {
  document.querySelector("#block-grid").innerHTML = `<div class="error-card"><strong>Roadmap nicht verfügbar.</strong><br />${escapeHtml(error.message)}</div>`;
  document.querySelector("#detail").hidden = true;
});
