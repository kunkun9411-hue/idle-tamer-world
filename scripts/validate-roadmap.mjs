import { readFile } from "node:fs/promises";

const roadmapSources = [
  {
    id: "A",
    statusPath: new URL("../apps/web/public/roadmap/roadmap-a-status.json", import.meta.url),
    documentPath: new URL("../docs/PRODUCT_ROADMAP.md", import.meta.url),
    complete: true,
  },
  {
    id: "B",
    statusPath: new URL("../apps/web/public/roadmap/roadmap-status.json", import.meta.url),
    documentPath: new URL("../docs/ROADMAP_B_DESIGN_UI.md", import.meta.url),
    complete: false,
  },
];

const problems = [];
const results = [];

const parseProgressRows = (document, roadmapId) => {
  const rows = new Map();
  const blockPattern = roadmapId === "A" ? /^[1-8]$/ : /^B\.0[1-8]$/;
  for (const line of document.split(/\r?\n/)) {
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
    if (cells.length !== 7 || !blockPattern.test(cells[0])) continue;
    const id = roadmapId === "A" ? Number(cells[0]) : Number(cells[0].slice(2));
    rows.set(id, cells.slice(2, 6).map((cell) => cell.toLowerCase() === "[x]"));
  }
  return rows;
};

for (const source of roadmapSources) {
  const data = JSON.parse(await readFile(source.statusPath, "utf8"));
  const document = await readFile(source.documentPath, "utf8");
  const label = `Roadmap ${source.id}`;

  if (data.roadmap !== source.id) problems.push(`${label}: Statusdatei meldet Roadmap ${data.roadmap ?? "?"}.`);
  if (!Array.isArray(data.blocks) || data.blocks.length !== 8) {
    problems.push(`${label}: Erwartet 8 Blöcke, gefunden ${data.blocks?.length ?? 0}.`);
  }

  const ids = new Set();
  for (const block of data.blocks ?? []) {
    if (ids.has(block.id)) problems.push(`${label}: doppelte Block-ID ${block.id}.`);
    ids.add(block.id);
    if (!Array.isArray(block.steps) || block.steps.length !== 4) {
      problems.push(`${label}, Block ${block.id}: benötigt genau vier Schritte.`);
      continue;
    }
    for (const [index, step] of block.steps.entries()) {
      if (typeof step.done !== "boolean") problems.push(`${label}, Block ${block.id}, Schritt ${index + 1}: done muss boolean sein.`);
      if (!step.name || !step.note) problems.push(`${label}, Block ${block.id}, Schritt ${index + 1}: Name oder Beschreibung fehlt.`);
    }
  }

  if (source.complete) {
    if (data.status !== "complete") problems.push(`${label}: eingefrorene Roadmap muss status=complete besitzen.`);
    if (data.activeBlock !== null || data.activeStep !== null) problems.push(`${label}: abgeschlossene Roadmap darf kein aktives Gate besitzen.`);
    if ((data.blocks ?? []).some((block) => block.steps.some((step) => !step.done))) {
      problems.push(`${label}: eingefrorene Roadmap enthält offene Schritte.`);
    }
  } else {
    if (data.status !== "active") problems.push(`${label}: aktuelle Roadmap muss status=active besitzen.`);
    if (!ids.has(data.activeBlock)) problems.push(`${label}: aktiver Block ${data.activeBlock} existiert nicht.`);
    if (!Number.isInteger(data.activeStep) || data.activeStep < 1 || data.activeStep > 4) {
      problems.push(`${label}: activeStep muss zwischen 1 und 4 liegen.`);
    }
  }

  const progressRows = parseProgressRows(document, source.id);
  for (const block of data.blocks ?? []) {
    const documentSteps = progressRows.get(block.id);
    if (!documentSteps) {
      problems.push(`${label}: Block ${block.id} fehlt in der Fortschrittstabelle.`);
      continue;
    }
    block.steps.forEach((step, index) => {
      if (step.done !== documentSteps[index]) {
        problems.push(`${label}, Block ${block.id}, Schritt ${index + 1}: JSON und Dokument widersprechen sich.`);
      }
    });
  }

  const completed = (data.blocks ?? []).flatMap((block) => block.steps).filter((step) => step.done).length;
  results.push(`${source.id} ${completed}/32`);
}

if (problems.length > 0) {
  console.error("Roadmap-Prüfung fehlgeschlagen:\n- " + problems.join("\n- "));
  process.exitCode = 1;
} else {
  console.log(`Roadmaps gültig: ${results.join(" · ")}.`);
}
