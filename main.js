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

let chatMessages = [...initialChat];
let workflows = workflowSeed.map((workflow) => ({ ...workflow }));
let teamEnabled = false;
let queueCleared = false;

function escapeHtml(value) {
  return value
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

function renderChat() {
  chatLog.innerHTML = chatMessages.map(formatMessage).join("");
  chatStatus.textContent = chatMessages.length > 3 ? "aktiv" : "bereit";
}

function workflowStatusLabel(status) {
  if (status === "running") return "laufend";
  if (status === "paused") return "pausiert";
  return "bereit";
}

function renderWorkflows() {
  workflowList.innerHTML = workflows
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

  const activeCount = workflows.filter((workflow) => workflow.status !== "paused").length;
  activeWorkflowCount.textContent = String(activeCount);
  metricWorkflowCount.textContent = String(activeCount);
}

function renderQueue() {
  if (queueCleared) {
    queueList.innerHTML = '<span>Queue bereinigt</span><span>Bereit fuer neue Aufgaben</span>';
    return;
  }

  queueList.innerHTML = "<span>Auftraege</span><span>Analysen</span><span>Prompts</span>";
}

function setPreset(preset) {
  composerText.textContent = presetCopy[preset] ?? presetCopy.Auto;
  tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.preset === preset));
  chatInput.value = presetCopy[preset] ?? "";
}

function addChatMessage(role, label, text) {
  chatMessages.push({ role, label, text });
  renderChat();
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

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    setPreset(tab.dataset.preset || "Auto");
  });
});

quickPrompts.forEach((button) => {
  button.addEventListener("click", () => {
    chatInput.value = button.dataset.prompt || "";
    chatInput.focus();
    chatStatus.textContent = "bereit zum senden";
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
  chatInput.value = "";

  window.setTimeout(() => {
    addChatMessage("assistant", "Assistant", generateAssistantReply(prompt));
    chatStatus.textContent = "aktiv";
    lastWorkflowRun.textContent = "Chat beantwortet";
  }, 350);
});

clearChatBtn.addEventListener("click", () => {
  chatMessages = [...initialChat];
  renderChat();
  chatStatus.textContent = "zurueckgesetzt";
});

focusChatBtn.addEventListener("click", () => {
  chatInput.focus();
});

savePromptBtn.addEventListener("click", () => {
  const prompt = chatInput.value.trim();
  if (!prompt) {
    chatStatus.textContent = "kein Prompt zum Speichern";
    return;
  }

  chatStatus.textContent = "als Vorlage markiert";
  addChatMessage("assistant", "System", "Prompt als Vorlage vorbereitet.");
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

  const workflow = workflows.find((entry) => entry.id === button.dataset.id);
  if (!workflow) return;

  if (button.dataset.action === "run") {
    workflow.status = "running";
    lastWorkflowRun.textContent = workflow.name;
    chatStatus.textContent = `${workflow.name} laeuft`;

    window.setTimeout(() => {
      workflow.status = "ready";
      renderWorkflows();
      chatStatus.textContent = `${workflow.name} bereit`;
    }, 1200);
  }

  if (button.dataset.action === "toggle") {
    workflow.status = workflow.status === "paused" ? "ready" : "paused";
    lastWorkflowRun.textContent = `${workflow.name}: ${workflowStatusLabel(workflow.status)}`;
  }

  renderWorkflows();
});

refreshWorkflowsBtn.addEventListener("click", () => {
  workflows = workflows.map((workflow) => ({
    ...workflow,
    status: workflow.status === "running" ? "ready" : workflow.status,
  }));
  renderWorkflows();
  chatStatus.textContent = "Workflows aktualisiert";
});

clearQueueBtn.addEventListener("click", () => {
  queueCleared = !queueCleared;
  renderQueue();
});

toggleTeamBtn.addEventListener("click", () => {
  teamEnabled = !teamEnabled;
  toggleTeamBtn.textContent = teamEnabled ? "Deaktivieren" : "Aktivieren";
  lastWorkflowRun.textContent = teamEnabled ? "Team aktiviert" : "Team pausiert";
});

setPreset("Auto");
renderChat();
renderWorkflows();
renderQueue();
