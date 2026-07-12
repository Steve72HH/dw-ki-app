const STORAGE_KEY = "dw-ki-app-state";

const presetCopy = {
  Auto: "Frag alles. Erstelle alles. Automatisiere alles.",
  Recherche:
    "Sammle Quellen, verdichte Erkenntnisse und bereite alles fuer den naechsten Schritt vor.",
  Content:
    "Baue Content-Bausteine, Headlines, Beschreibungen und Varianten fuer Demos oder Projekte.",
  Code:
    "Strukturiere Features, Aufgaben und technische Entwuerfe fuer lokale oder gehostete Builds.",
  Meeting: "Bereite Agenda, Notizen und Folgeaufgaben fuer teamtaugliche Entscheidungen vor.",
};

const initialChat = [
  {
    role: "assistant",
    label: "System",
    text: "Dashboard bereit. Waehle ein Preset oder schreibe direkt in den Chat.",
  },
  {
    role: "user",
    label: "Du",
    text: "Zeige mir die letzten Aufgaben fuer das Dashboard.",
  },
  {
    role: "assistant",
    label: "Assistant",
    text: "Ich kann daraus jetzt Workflows, Notizen oder eine zusammenfassende Antwort generieren.",
  },
];

const workflowSeed = [
  {
    id: "research",
    name: "Research Scout",
    description: "Quellen sammeln, verdichten und als naechsten Schritt vorbereiten.",
    status: "ready",
  },
  {
    id: "content",
    name: "Content Pilot",
    description: "Textvarianten, Headlines und kompakte Updates fuer das Team.",
    status: "running",
  },
  {
    id: "code",
    name: "Code Operator",
    description: "Aufgaben, Rewrites und technische Entwuerfe fuer lokale Builds.",
    status: "paused",
  },
];

const defaults = {
  chatMessages: initialChat,
  workflows: workflowSeed,
  teamEnabled: false,
  queueCleared: false,
  templates: [],
  preset: "Auto",
  composerText: presetCopy.Auto,
  composerValue: presetCopy.Auto,
  lastWorkflowRun: "bereit",
};

const tabs = Array.from(document.querySelectorAll(".tab"));
const composerText = document.getElementById("composerText");
const chatLog = document.getElementById("chatLog");
const chatInput = document.getElementById("chatInput");
const chatForm = document.getElementById("chatForm");
const chatStatus = document.getElementById("chatStatus");
const clearChatBtn = document.getElementById("clearChatBtn");
const focusChatBtn = document.getElementById("focusChatBtn");
const savePromptBtn = document.getElementById("savePromptBtn");
const runPromptBtn = document.getElementById("runPromptBtn");
const workflowList = document.getElementById("workflowList");
const activeWorkflowCount = document.getElementById("activeWorkflowCount");
const metricWorkflowCount = document.getElementById("metricWorkflowCount");
const lastWorkflowRun = document.getElementById("lastWorkflowRun");
const refreshWorkflowsBtn = document.getElementById("refreshWorkflowsBtn");
const clearQueueBtn = document.getElementById("clearQueueBtn");
const queueList = document.getElementById("queueList");
const toggleTeamBtn = document.getElementById("toggleTeamBtn");
const quickPrompts = Array.from(document.querySelectorAll(".quick-prompt"));
const templateList = document.getElementById("templateList");
const templateCount = document.getElementById("templateCount");
const resetStateBtn = document.getElementById("resetStateBtn");
const exportStateBtn = document.getElementById("exportStateBtn");
const importStateInput = document.getElementById("importStateInput");

const safeClone = (value) => JSON.parse(JSON.stringify(value));

function readState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return safeClone(defaults);
    const parsed = JSON.parse(raw);
    return {
      ...safeClone(defaults),
      ...parsed,
      chatMessages: Array.isArray(parsed.chatMessages) ? parsed.chatMessages : safeClone(defaults.chatMessages),
      workflows: Array.isArray(parsed.workflows) ? parsed.workflows : safeClone(defaults.workflows),
      templates: Array.isArray(parsed.templates) ? parsed.templates : [],
    };
  } catch {
    return safeClone(defaults);
  }
}

function normalizeState(candidate) {
  const merged = {
    ...safeClone(defaults),
    ...(candidate && typeof candidate === "object" ? candidate : {}),
  };

  merged.chatMessages = Array.isArray(merged.chatMessages) ? merged.chatMessages : safeClone(defaults.chatMessages);
  merged.workflows = Array.isArray(merged.workflows) ? merged.workflows : safeClone(defaults.workflows);
  merged.templates = Array.isArray(merged.templates) ? merged.templates : [];
  merged.preset = Object.prototype.hasOwnProperty.call(presetCopy, merged.preset) ? merged.preset : "Auto";
  merged.composerText = typeof merged.composerText === "string" ? merged.composerText : presetCopy.Auto;
  merged.composerValue = typeof merged.composerValue === "string" ? merged.composerValue : merged.composerText;
  merged.lastWorkflowRun = typeof merged.lastWorkflowRun === "string" ? merged.lastWorkflowRun : defaults.lastWorkflowRun;
  merged.teamEnabled = Boolean(merged.teamEnabled);
  merged.queueCleared = Boolean(merged.queueCleared);

  return merged;
}

let state = normalizeState(readState());
let saveTimer = null;

function persistState() {
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Best effort only.
    }
  }, 60);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatMessage(message) {
  return `
    <article class="chat-message ${message.role}">
      <strong>${escapeHtml(message.label)}</strong>
      <p>${escapeHtml(message.text)}</p>
    </article>
  `;
}

function workflowStatusLabel(status) {
  if (status === "running") return "laufend";
  if (status === "paused") return "pausiert";
  return "bereit";
}

function renderChat() {
  chatLog.innerHTML = state.chatMessages.map(formatMessage).join("");
  chatStatus.textContent = state.chatMessages.length > initialChat.length ? "aktiv" : "bereit";
}

function renderWorkflows() {
  workflowList.innerHTML = state.workflows
    .map(
      (workflow) => `
        <article class="workflow-item" data-workflow="${workflow.id}">
          <div class="workflow-top">
            <div>
              <strong>${escapeHtml(workflow.name)}</strong>
              <p>${escapeHtml(workflow.description)}</p>
            </div>
            <span class="workflow-status ${workflow.status}">${workflowStatusLabel(workflow.status)}</span>
          </div>
          <div class="workflow-actions">
            <button class="ghost-btn secondary" type="button" data-action="run" data-id="${workflow.id}">Run</button>
            <button class="ghost-btn secondary" type="button" data-action="toggle" data-id="${workflow.id}">
              ${workflow.status === "paused" ? "Aktivieren" : "Pausieren"}
            </button>
          </div>
        </article>
      `
    )
    .join("");

  const activeCount = state.workflows.filter((workflow) => workflow.status !== "paused").length;
  activeWorkflowCount.textContent = String(activeCount);
  metricWorkflowCount.textContent = String(activeCount);
}

function renderQueue() {
  if (state.queueCleared) {
    queueList.innerHTML = '<span>Queue bereinigt</span><span>Bereit fuer neue Aufgaben</span>';
    return;
  }

  queueList.innerHTML = "<span>Auftraege</span><span>Analysen</span><span>Prompts</span>";
}

function renderTemplates() {
  templateCount.textContent = String(state.templates.length);
  if (!state.templates.length) {
    templateList.innerHTML = '<span class="queue-list-empty">Noch keine Vorlagen gespeichert.</span>';
    return;
  }

  templateList.innerHTML = state.templates
    .map(
      (template, index) => `
        <div class="template-chip" data-template-index="${index}">
          <span>${escapeHtml(template)}</span>
          <button type="button" data-action="remove-template" aria-label="Vorlage loeschen">×</button>
        </div>
      `
    )
    .join("");
}

function syncComposerState(preset) {
  state.preset = preset;
  state.composerText = presetCopy[preset] ?? presetCopy.Auto;
  state.composerValue = state.composerText;
  composerText.textContent = state.composerText;
  chatInput.value = state.composerValue;
  tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.preset === preset));
  persistState();
}

function addChatMessage(role, label, text) {
  state.chatMessages = [...state.chatMessages, { role, label, text }];
  renderChat();
  persistState();
}

function generateAssistantReply(prompt) {
  const trimmed = prompt.trim();
  if (!trimmed) {
    return "Bitte gib eine Anfrage ein, damit ich damit arbeiten kann.";
  }

  if (trimmed.length < 32) {
    return `Verstanden. Ich setze "${trimmed}" als kurze Arbeitsanweisung auf.`;
  }

  return `Ich habe den Auftrag aufgenommen: ${trimmed}. Naechster Schritt waeren konkrete Teilschritte, Quellen oder eine Vorlage.`;
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function importStateFromObject(candidate) {
  state = normalizeState(candidate);
  renderChat();
  renderWorkflows();
  renderQueue();
  renderTemplates();
  syncComposerState(state.preset);
  toggleTeamBtn.textContent = state.teamEnabled ? "Deaktivieren" : "Aktivieren";
  lastWorkflowRun.textContent = state.lastWorkflowRun;
  chatStatus.textContent = "Zustand importiert";
  persistState();
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    syncComposerState(tab.dataset.preset || "Auto");
  });
});

quickPrompts.forEach((button) => {
  button.addEventListener("click", () => {
    chatInput.value = button.dataset.prompt || "";
    state.composerValue = chatInput.value;
    chatStatus.textContent = "bereit zum senden";
    persistState();
    chatInput.focus();
  });
});

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const prompt = chatInput.value.trim();
  if (!prompt) {
    chatStatus.textContent = "bitte erst Text eingeben";
    chatInput.focus();
    return;
  }

  addChatMessage("user", "Du", prompt);
  chatStatus.textContent = "arbeitet ...";
  state.lastWorkflowRun = "Chat in Bearbeitung";
  persistState();
  chatInput.value = "";
  state.composerValue = "";

  window.setTimeout(() => {
    addChatMessage("assistant", "Assistant", generateAssistantReply(prompt));
    chatStatus.textContent = "aktiv";
    state.lastWorkflowRun = "Chat beantwortet";
    lastWorkflowRun.textContent = state.lastWorkflowRun;
    persistState();
  }, 350);
});

clearChatBtn.addEventListener("click", () => {
  state.chatMessages = safeClone(initialChat);
  renderChat();
  chatStatus.textContent = "zurueckgesetzt";
  persistState();
});

focusChatBtn.addEventListener("click", () => {
  chatInput.focus();
});

savePromptBtn.addEventListener("click", () => {
  const prompt = chatInput.value.trim() || composerText.textContent.trim();
  if (!prompt) {
    chatStatus.textContent = "kein Prompt zum Speichern";
    return;
  }

  state.templates = [prompt, ...state.templates.filter((entry) => entry !== prompt)].slice(0, 6);
  renderTemplates();
  chatStatus.textContent = "als Vorlage gespeichert";
  addChatMessage("assistant", "System", "Prompt als Vorlage vorbereitet.");
  persistState();
});

exportStateBtn.addEventListener("click", () => {
  downloadJson("dw-ki-app-state.json", state);
});

importStateInput.addEventListener("change", async () => {
  const file = importStateInput.files && importStateInput.files[0];
  if (!file) return;

  try {
    const raw = await file.text();
    importStateFromObject(JSON.parse(raw));
  } catch {
    chatStatus.textContent = "Import fehlgeschlagen";
  } finally {
    importStateInput.value = "";
  }
});

runPromptBtn.addEventListener("click", () => {
  if (!chatInput.value.trim()) {
    chatInput.value = composerText.textContent || "";
  }
  chatForm.requestSubmit();
});

workflowList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const workflow = state.workflows.find((entry) => entry.id === button.dataset.id);
  if (!workflow) return;

  if (button.dataset.action === "run") {
    workflow.status = "running";
    state.lastWorkflowRun = workflow.name;
    lastWorkflowRun.textContent = workflow.name;
    chatStatus.textContent = `${workflow.name} laeuft`;
    persistState();

    window.setTimeout(() => {
      workflow.status = "ready";
      state.lastWorkflowRun = `${workflow.name} bereit`;
      renderWorkflows();
      lastWorkflowRun.textContent = state.lastWorkflowRun;
      chatStatus.textContent = `${workflow.name} bereit`;
      persistState();
    }, 1200);
  }

  if (button.dataset.action === "toggle") {
    workflow.status = workflow.status === "paused" ? "ready" : "paused";
    state.lastWorkflowRun = `${workflow.name}: ${workflowStatusLabel(workflow.status)}`;
    lastWorkflowRun.textContent = state.lastWorkflowRun;
    persistState();
  }

  renderWorkflows();
});

refreshWorkflowsBtn.addEventListener("click", () => {
  state.workflows = state.workflows.map((workflow) => ({
    ...workflow,
    status: workflow.status === "running" ? "ready" : workflow.status,
  }));
  renderWorkflows();
  chatStatus.textContent = "Workflows aktualisiert";
  persistState();
});

clearQueueBtn.addEventListener("click", () => {
  state.queueCleared = !state.queueCleared;
  renderQueue();
  persistState();
});

toggleTeamBtn.addEventListener("click", () => {
  state.teamEnabled = !state.teamEnabled;
  toggleTeamBtn.textContent = state.teamEnabled ? "Deaktivieren" : "Aktivieren";
  state.lastWorkflowRun = state.teamEnabled ? "Team aktiviert" : "Team pausiert";
  lastWorkflowRun.textContent = state.lastWorkflowRun;
  persistState();
});

templateList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action='remove-template']");
  if (!button) return;

  const chip = button.closest(".template-chip");
  const index = Number(chip?.dataset.templateIndex);
  if (Number.isNaN(index)) return;

  state.templates.splice(index, 1);
  renderTemplates();
  persistState();
});

resetStateBtn.addEventListener("click", () => {
  state = safeClone(defaults);
  renderChat();
  renderWorkflows();
  renderQueue();
  renderTemplates();
  syncComposerState("Auto");
  toggleTeamBtn.textContent = "Aktivieren";
  lastWorkflowRun.textContent = state.lastWorkflowRun;
  chatStatus.textContent = "bereit";
  persistState();
});

function initialize() {
  state = normalizeState(state);
  state.lastWorkflowRun = state.lastWorkflowRun || defaults.lastWorkflowRun;
  renderChat();
  renderWorkflows();
  renderQueue();
  renderTemplates();
  syncComposerState(state.preset || "Auto");
  toggleTeamBtn.textContent = state.teamEnabled ? "Deaktivieren" : "Aktivieren";
  lastWorkflowRun.textContent = state.lastWorkflowRun;
  if (state.composerValue) {
    chatInput.value = state.composerValue;
  }
}

initialize();
