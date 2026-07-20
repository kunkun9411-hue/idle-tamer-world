import { readFile } from "node:fs/promises";

const statusPath = new URL("../apps/web/public/roadmap/roadmap-status.json", import.meta.url);
const documentPath = new URL("../docs/PRODUCT_ROADMAP.md", import.meta.url);

const data = JSON.parse(await readFile(statusPath, "utf8"));
const document = await readFile(documentPath, "utf8");
const problems = [];

if (!Array.isArray(data.blocks) || data.blocks.length !== 8) {
  problems.push(`Erwartet: 8 Blöcke. Gefunden: ${data.blocks?.length ?? 0}.`);
}

const ids = new Set();
for (const block of data.blocks ?? []) {
  if (ids.has(block.id)) problems.push(`Doppelte Block-ID: ${block.id}.`);
  ids.add(block.id);
  if (!Array.isArray(block.steps) || block.steps.length !== 4) {
    problems.push(`Block ${block.id} benötigt genau vier Schritte.`);
    continue;
  }
  for (const [index, step] of block.steps.entries()) {
    if (typeof step.done !== "boolean") problems.push(`Block ${block.id}, Schritt ${index + 1}: done muss boolean sein.`);
    if (!step.name || !step.note) problems.push(`Block ${block.id}, Schritt ${index + 1}: Name oder Beschreibung fehlt.`);
  }
}

if (!ids.has(data.activeBlock)) problems.push(`Aktiver Block ${data.activeBlock} existiert nicht.`);
if (!Number.isInteger(data.activeStep) || data.activeStep < 1 || data.activeStep > 4) {
  problems.push("activeStep muss zwischen 1 und 4 liegen.");
}

const progressRows = new Map();
for (const line of document.split(/\r?\n/)) {
  const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
  if (cells.length !== 7 || !/^[1-8]$/.test(cells[0])) continue;
  progressRows.set(Number(cells[0]), cells.slice(2, 6).map((cell) => cell.toLowerCase() === "[x]"));
}

for (const block of data.blocks ?? []) {
  const documentSteps = progressRows.get(block.id);
  if (!documentSteps) {
    problems.push(`Block ${block.id} fehlt in der Fortschrittstabelle des Dokuments.`);
    continue;
  }
  block.steps.forEach((step, index) => {
    if (step.done !== documentSteps[index]) {
      problems.push(`Block ${block.id}, Schritt ${index + 1}: JSON und Dokument widersprechen sich.`);
    }
  });
}

if (problems.length > 0) {
  console.error("Roadmap-Prüfung fehlgeschlagen:\n- " + problems.join("\n- "));
  process.exitCode = 1;
} else {
  const completed = data.blocks.flatMap((block) => block.steps).filter((step) => step.done).length;
  console.log(`Roadmap gültig: 8 Blöcke, 32 Schritte, ${completed} abgeschlossen.`);
}
