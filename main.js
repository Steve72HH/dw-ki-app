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

const aiConfigDefaults = {
  endpoint: "",
  model: "gpt-4o-mini",
  apiKey: "",
  systemPrompt:
    "Du bist ein hilfreicher Assistent im DW KI Dashboard. Antworte klar, pragmatisch und mit naechsten Schritten.",
};

function makeId(prefix = "id") {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return `${prefix}-${window.crypto.randomUUID()}`;
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function safeClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createWorkspace(overrides = {}) {
  return normalizeWorkspace({
    chatMessages: initialChat,
    workflows: workflowSeed,
    teamEnabled: false,
    queueCleared: false,
    templates: [],
    preset: "Auto",
    composerText: presetCopy.Auto,
    composerValue: presetCopy.Auto,
    lastWorkflowRun: "bereit",
    promptSearch: "",
    promptTagDraft: "",
    aiConfig: aiConfigDefaults,
    ...overrides,
  });
}

function createProject(name, description, workspace = createWorkspace()) {
  return {
    id: makeId("project"),
    name: name || "Main Workspace",
    description: description || "Standard-Sitzung fuer Chat, Vorlagen und Workflows.",
    updatedAt: new Date().toISOString(),
    workspace: createWorkspace(workspace),
  };
}

function normalizeTemplateEntry(entry, fallbackPrompt = "") {
  if (typeof entry === "string") {
    const prompt = entry.trim();
    return {
      id: makeId("template"),
      title: prompt.slice(0, 48) || "Vorlage",
      prompt,
      tags: [],
      favorite: false,
      usageCount: 0,
      updatedAt: new Date().toISOString(),
    };
  }

  const source = entry && typeof entry === "object" ? entry : {};
  const prompt = typeof source.prompt === "string" ? source.prompt.trim() : fallbackPrompt.trim();
  const title = typeof source.title === "string" && source.title.trim() ? source.title.trim() : prompt.slice(0, 48) || "Vorlage";
  const tags = Array.isArray(source.tags)
    ? source.tags.filter((tag) => typeof tag === "string").map((tag) => tag.trim()).filter(Boolean)
    : [];

  return {
    id: typeof source.id === "string" && source.id.trim() ? source.id : makeId("template"),
    title,
    prompt,
    tags,
    favorite: Boolean(source.favorite),
    usageCount: Number.isFinite(source.usageCount) ? source.usageCount : 0,
    updatedAt: typeof source.updatedAt === "string" && source.updatedAt ? source.updatedAt : new Date().toISOString(),
  };
}

function normalizeWorkspace(candidate) {
  const merged = {
    chatMessages: safeClone(initialChat),
    workflows: safeClone(workflowSeed),
    teamEnabled: false,
    queueCleared: false,
    templates: [],
    preset: "Auto",
    composerText: presetCopy.Auto,
    composerValue: presetCopy.Auto,
    lastWorkflowRun: "bereit",
    promptSearch: "",
    promptTagDraft: "",
    aiConfig: safeClone(aiConfigDefaults),
    ...(candidate && typeof candidate === "object" ? candidate : {}),
  };

  merged.chatMessages = Array.isArray(merged.chatMessages) ? merged.chatMessages : safeClone(initialChat);
  merged.workflows = Array.isArray(merged.workflows) ? merged.workflows : safeClone(workflowSeed);
  merged.templates = Array.isArray(merged.templates)
    ? merged.templates.map((entry) => normalizeTemplateEntry(entry))
    : [];
  merged.preset = Object.prototype.hasOwnProperty.call(presetCopy, merged.preset) ? merged.preset : "Auto";
  merged.composerText = typeof merged.composerText === "string" ? merged.composerText : presetCopy.Auto;
  merged.composerValue = typeof merged.composerValue === "string" ? merged.composerValue : merged.composerText;
  merged.lastWorkflowRun = typeof merged.lastWorkflowRun === "string" ? merged.lastWorkflowRun : "bereit";
  merged.teamEnabled = Boolean(merged.teamEnabled);
  merged.queueCleared = Boolean(merged.queueCleared);
  merged.promptSearch = typeof merged.promptSearch === "string" ? merged.promptSearch : "";
  merged.promptTagDraft = typeof merged.promptTagDraft === "string" ? merged.promptTagDraft : "";
  merged.aiConfig = {
    ...safeClone(aiConfigDefaults),
    ...(merged.aiConfig && typeof merged.aiConfig === "object" ? merged.aiConfig : {}),
  };
  merged.aiConfig.endpoint = typeof merged.aiConfig.endpoint === "string" ? merged.aiConfig.endpoint : "";
  merged.aiConfig.model = typeof merged.aiConfig.model === "string" && merged.aiConfig.model.trim() ? merged.aiConfig.model : aiConfigDefaults.model;
  merged.aiConfig.apiKey = typeof merged.aiConfig.apiKey === "string" ? merged.aiConfig.apiKey : "";
  merged.aiConfig.systemPrompt =
    typeof merged.aiConfig.systemPrompt === "string" && merged.aiConfig.systemPrompt.trim()
      ? merged.aiConfig.systemPrompt
      : aiConfigDefaults.systemPrompt;

  return merged;
}

function normalizeProject(candidate) {
  const source = candidate && typeof candidate === "object" ? candidate : {};
  return {
    id: typeof source.id === "string" && source.id.trim() ? source.id : makeId("project"),
    name: typeof source.name === "string" && source.name.trim() ? source.name.trim() : "Main Workspace",
    description:
      typeof source.description === "string" && source.description.trim()
        ? source.description.trim()
        : "Standard-Sitzung fuer Chat, Vorlagen und Workflows.",
    updatedAt: typeof source.updatedAt === "string" && source.updatedAt ? source.updatedAt : new Date().toISOString(),
    workspace: createWorkspace(source.workspace),
  };
}

function normalizeAppState(candidate) {
  const source = candidate && typeof candidate === "object" ? candidate : {};

  if (Array.isArray(source.projects) && source.projects.length > 0) {
    const projects = source.projects.map((project) => normalizeProject(project));
    const activeProjectId = projects.some((project) => project.id === source.activeProjectId)
      ? source.activeProjectId
      : projects[0].id;
    return { activeProjectId, projects };
  }

  const legacyWorkspace = createWorkspace(source);
  const project = createProject(source.projectName, source.projectDescription, legacyWorkspace);
  return {
    activeProjectId: project.id,
    projects: [project],
  };
}

function readState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return normalizeAppState({});
    }

    return normalizeAppState(JSON.parse(raw));
  } catch {
    return normalizeAppState({});
  }
}

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
const projectList = document.getElementById("projectList");
const projectCount = document.getElementById("projectCount");
const activeProjectName = document.getElementById("activeProjectName");
const activeProjectMeta = document.getElementById("activeProjectMeta");
const createProjectBtn = document.getElementById("createProjectBtn");
const duplicateProjectBtn = document.getElementById("duplicateProjectBtn");
const projectNameInput = document.getElementById("projectNameInput");
const projectDescriptionInput = document.getElementById("projectDescriptionInput");
const promptSearchInput = document.getElementById("promptSearchInput");
const promptTagInput = document.getElementById("promptTagInput");
const clearPromptFiltersBtn = document.getElementById("clearPromptFiltersBtn");
const aiBackendStatus = document.getElementById("aiBackendStatus");
const aiEndpointInput = document.getElementById("aiEndpointInput");
const aiModelInput = document.getElementById("aiModelInput");
const aiKeyInput = document.getElementById("aiKeyInput");
const aiSystemPromptInput = document.getElementById("aiSystemPromptInput");
const saveAiConfigBtn = document.getElementById("saveAiConfigBtn");
const testAiBtn = document.getElementById("testAiBtn");

const workspaceKeys = [
  "chatMessages",
  "workflows",
  "teamEnabled",
  "queueCleared",
  "templates",
  "preset",
  "composerText",
  "composerValue",
  "lastWorkflowRun",
  "promptSearch",
  "promptTagDraft",
  "aiConfig",
];

let state = readState();
let workspace = createWorkspace(state.projects.find((project) => project.id === state.activeProjectId)?.workspace);
let saveTimer = null;
let aiRequestSerial = 0;

function currentProject() {
  return state.projects.find((project) => project.id === state.activeProjectId) || state.projects[0];
}

function syncProjectSnapshot() {
  const active = currentProject();
  if (!active) return;

  const index = state.projects.findIndex((project) => project.id === active.id);
  if (index === -1) return;

  state.projects[index] = {
    ...state.projects[index],
    updatedAt: new Date().toISOString(),
    workspace: createWorkspace(workspace),
  };
}

function persistState() {
  syncProjectSnapshot();
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Best effort only.
    }
  }, 60);
}

function syncActiveProject(projectId, { skipRender = false } = {}) {
  syncProjectSnapshot();

  const project = state.projects.find((entry) => entry.id === projectId);
  if (!project) return;

  state.activeProjectId = projectId;
  workspace = createWorkspace(project.workspace);

  if (!skipRender) {
    renderAll();
  }

  persistState();
}

function updateWorkspace(patch = {}) {
  workspace = createWorkspace({
    ...workspace,
    ...patch,
  });
  persistState();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDateTime(value) {
  try {
    return new Intl.DateTimeFormat("de-DE", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
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

function extractReplyText(data) {
  if (!data || typeof data !== "object") return "";
  if (typeof data.reply === "string" && data.reply.trim()) return data.reply.trim();
  if (typeof data.text === "string" && data.text.trim()) return data.text.trim();
  if (typeof data.output_text === "string" && data.output_text.trim()) return data.output_text.trim();

  const choiceContent = data?.choices?.[0]?.message?.content;
  if (typeof choiceContent === "string" && choiceContent.trim()) return choiceContent.trim();

  const choiceText = data?.choices?.[0]?.text;
  if (typeof choiceText === "string" && choiceText.trim()) return choiceText.trim();

  const outputItem = data?.output?.[0];
  if (typeof outputItem?.content === "string" && outputItem.content.trim()) return outputItem.content.trim();
  if (typeof outputItem?.text === "string" && outputItem.text.trim()) return outputItem.text.trim();

  return "";
}

function buildTemplateQuery() {
  return `${workspace.promptSearch} ${workspace.promptTagDraft}`.trim().toLowerCase();
}

function filteredTemplates() {
  const query = buildTemplateQuery();
  if (!query) return workspace.templates;

  return workspace.templates.filter((template) => {
    const haystack = [template.title, template.prompt, ...(template.tags || [])].join(" ").toLowerCase();
    return haystack.includes(query);
  });
}

function renderChat() {
  chatLog.innerHTML = workspace.chatMessages.map(formatMessage).join("");
  chatStatus.textContent = workspace.chatMessages.length > initialChat.length ? "aktiv" : "bereit";
}

function renderWorkflows() {
  workflowList.innerHTML = workspace.workflows
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

  const activeCount = workspace.workflows.filter((workflow) => workflow.status !== "paused").length;
  activeWorkflowCount.textContent = String(activeCount);
  metricWorkflowCount.textContent = String(activeCount);
}

function renderQueue() {
  if (workspace.queueCleared) {
    queueList.innerHTML = '<span>Queue bereinigt</span><span>Bereit fuer neue Aufgaben</span>';
    return;
  }

  queueList.innerHTML = "<span>Auftraege</span><span>Analysen</span><span>Prompts</span>";
}

function renderTemplates() {
  const templates = filteredTemplates();
  templateCount.textContent = `${templates.length}/${workspace.templates.length}`;

  if (!workspace.templates.length) {
    templateList.innerHTML = '<span class="queue-list-empty">Noch keine Vorlagen gespeichert.</span>';
    return;
  }

  if (!templates.length) {
    templateList.innerHTML = '<span class="queue-list-empty">Keine Vorlagen fuer diesen Filter gefunden.</span>';
    return;
  }

  templateList.innerHTML = templates
    .map(
      (template) => `
        <article class="template-card" data-template-id="${template.id}">
          <div class="template-card-head">
            <div>
              <strong>${escapeHtml(template.title)}</strong>
              <span>${template.favorite ? "Favorit" : "Vorlage"}</span>
            </div>
            <button type="button" class="template-star ${template.favorite ? "is-favorite" : ""}" data-action="toggle-favorite" aria-label="Vorlage als Favorit markieren">
              ${template.favorite ? "★" : "☆"}
            </button>
          </div>
          <p>${escapeHtml(template.prompt)}</p>
          <div class="template-tags">
            ${(template.tags || [])
              .map((tag) => `<span>${escapeHtml(tag)}</span>`)
              .join("") || '<span class="template-tag-empty">ohne Tag</span>'}
          </div>
          <div class="template-meta">
            <span>${template.usageCount}x genutzt</span>
            <span>${formatDateTime(template.updatedAt)}</span>
          </div>
          <div class="template-actions">
            <button class="ghost-btn secondary" type="button" data-action="apply-template">Nutzen</button>
            <button class="ghost-btn secondary" type="button" data-action="remove-template">Loeschen</button>
          </div>
        </article>
      `
    )
    .join("");
}

function renderProjects() {
  projectCount.textContent = String(state.projects.length);
  const active = currentProject();
  activeProjectName.textContent = active ? active.name : "Projekt";
  activeProjectMeta.textContent = active ? `${active.description} · ${formatDateTime(active.updatedAt)}` : "";

  if (!state.projects.length) {
    projectList.innerHTML = '<span class="queue-list-empty">Noch kein Projekt vorhanden.</span>';
    return;
  }

  projectList.innerHTML = state.projects
    .map(
      (project) => `
        <article class="project-card ${project.id === state.activeProjectId ? "active" : ""}" data-project-id="${project.id}">
          <div class="project-card-head">
            <div>
              <strong>${escapeHtml(project.name)}</strong>
              <span>${formatDateTime(project.updatedAt)}</span>
            </div>
            <span class="project-pill">${project.id === state.activeProjectId ? "aktiv" : "gespeichert"}</span>
          </div>
          <p>${escapeHtml(project.description)}</p>
          <div class="project-actions">
            <button class="ghost-btn secondary" type="button" data-action="activate-project">Oeffnen</button>
            <button class="ghost-btn secondary" type="button" data-action="duplicate-project">Duplizieren</button>
            <button class="ghost-btn secondary" type="button" data-action="delete-project">Loeschen</button>
          </div>
        </article>
      `
    )
    .join("");
}

function renderAiConfig() {
  aiEndpointInput.value = workspace.aiConfig.endpoint;
  aiModelInput.value = workspace.aiConfig.model;
  aiKeyInput.value = workspace.aiConfig.apiKey;
  aiSystemPromptInput.value = workspace.aiConfig.systemPrompt;

  const isConfigured = Boolean(workspace.aiConfig.endpoint.trim());
  aiBackendStatus.textContent = isConfigured ? workspace.aiConfig.model || "verbunden" : "lokal";
}

function syncComposerState(preset, options = {}) {
  workspace = createWorkspace({
    ...workspace,
    preset,
    composerText: presetCopy[preset] ?? presetCopy.Auto,
    composerValue: presetCopy[preset] ?? presetCopy.Auto,
  });
  composerText.textContent = workspace.composerText;
  chatInput.value = workspace.composerValue;
  tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.preset === preset));
  if (options.persist !== false) {
    persistState();
  }
}

function addChatMessage(role, label, text) {
  workspace = createWorkspace({
    ...workspace,
    chatMessages: [...workspace.chatMessages, { role, label, text }],
  });
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

function createProjectFromForm({ duplicateCurrent = false } = {}) {
  const active = currentProject();
  const baseWorkspace = duplicateCurrent && active ? workspace : createWorkspace();
  const nameFallback = duplicateCurrent && active ? `${active.name} Kopie` : `Projekt ${state.projects.length + 1}`;
  const enteredName = projectNameInput.value.trim();
  const name = !duplicateCurrent && active && enteredName === active.name ? nameFallback : enteredName || nameFallback;
  const descriptionFallback = duplicateCurrent && active ? `${active.description} - dupliziert` : "Neue Session fuer ein eigenes Arbeitskonzept.";
  const enteredDescription = projectDescriptionInput.value.trim();
  const description =
    !duplicateCurrent && active && enteredDescription === active.description
      ? descriptionFallback
      : enteredDescription || descriptionFallback;
  const newProject = createProject(name, description, baseWorkspace);

  state.projects = [...state.projects, newProject];
  state.activeProjectId = newProject.id;
  workspace = createWorkspace(newProject.workspace);
  renderAll();
  persistState();
}

function removeProject(projectId) {
  if (state.projects.length <= 1) {
    state.projects = [createProject("Main Workspace", "Standard-Sitzung fuer Chat, Vorlagen und Workflows.")];
    state.activeProjectId = state.projects[0].id;
    workspace = createWorkspace(state.projects[0].workspace);
    renderAll();
    persistState();
    return;
  }

  state.projects = state.projects.filter((project) => project.id !== projectId);
  if (state.activeProjectId === projectId) {
    state.activeProjectId = state.projects[0].id;
    workspace = createWorkspace(state.projects[0].workspace);
  }

  renderAll();
  persistState();
}

function updateProjectInputsFromActive() {
  const active = currentProject();
  if (!active) return;

  projectNameInput.value = active.name;
  projectDescriptionInput.value = active.description;
}

function applyAiConfigFromInputs() {
  workspace = createWorkspace({
    ...workspace,
    aiConfig: {
      endpoint: aiEndpointInput.value.trim(),
      model: aiModelInput.value.trim() || aiConfigDefaults.model,
      apiKey: aiKeyInput.value.trim(),
      systemPrompt: aiSystemPromptInput.value.trim() || aiConfigDefaults.systemPrompt,
    },
  });
  renderAiConfig();
  persistState();
}

function activeProjectSnapshot() {
  return createWorkspace(workspace);
}

async function requestAssistantReply(prompt) {
  const config = workspace.aiConfig;
  const endpoint = config.endpoint.trim();
  if (!endpoint) {
    return { mode: "local", reply: generateAssistantReply(prompt) };
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 20000);
  const messages = [
    { role: "system", content: config.systemPrompt.trim() || aiConfigDefaults.systemPrompt },
    ...workspace.chatMessages.slice(-8).map((message) => ({
      role: message.role === "assistant" ? "assistant" : "user",
      content: message.text,
    })),
    { role: "user", content: prompt },
  ];

  try {
    const response = await window.fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(config.apiKey.trim() ? { Authorization: `Bearer ${config.apiKey.trim()}` } : {}),
      },
      body: JSON.stringify({
        model: config.model.trim() || aiConfigDefaults.model,
        messages,
        temperature: 0.3,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const reply = extractReplyText(data) || generateAssistantReply(prompt);
    return { mode: "remote", reply };
  } finally {
    window.clearTimeout(timeout);
  }
}

function seedTemplateLibrary() {
  if (workspace.templates.length > 0) return;

  workspace = createWorkspace({
    ...workspace,
    templates: [
      normalizeTemplateEntry({
        id: makeId("template"),
        title: "Projekt-Update",
        prompt: "Formuliere ein klares Update fuer das Team mit Status, Risiko und naechstem Schritt.",
        tags: ["update", "team", "status"],
        favorite: true,
      }),
      normalizeTemplateEntry({
        id: makeId("template"),
        title: "Research Brief",
        prompt: "Verdichte die wichtigsten Erkenntnisse in einer kompakten, umsetzbaren Zusammenfassung.",
        tags: ["research", "brief"],
      }),
      normalizeTemplateEntry({
        id: makeId("template"),
        title: "Workflow Builder",
        prompt: "Erstelle einen Workflow mit 4 klaren Schritten, Zustandswechseln und einem Abschluss.",
        tags: ["workflow", "ops"],
      }),
    ],
  });
}

function savePromptFromComposer() {
  const prompt = chatInput.value.trim() || composerText.textContent.trim();
  if (!prompt) {
    chatStatus.textContent = "kein Prompt zum Speichern";
    return;
  }

  const tags = promptTagInput.value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  const existing = workspace.templates.findIndex((template) => template.prompt === prompt);
  const savedTemplate = {
    id: existing >= 0 ? workspace.templates[existing].id : makeId("template"),
    title: prompt.slice(0, 48) || "Vorlage",
    prompt,
    tags,
    favorite: existing >= 0 ? workspace.templates[existing].favorite : false,
    usageCount: existing >= 0 ? workspace.templates[existing].usageCount : 0,
    updatedAt: new Date().toISOString(),
  };

  const nextTemplates = [...workspace.templates];
  if (existing >= 0) {
    nextTemplates[existing] = savedTemplate;
  } else {
    nextTemplates.unshift(savedTemplate);
  }

  workspace = createWorkspace({
    ...workspace,
    templates: nextTemplates.slice(0, 12),
    promptTagDraft: promptTagInput.value,
  });
  renderTemplates();
  chatStatus.textContent = "als Vorlage gespeichert";
  addChatMessage("assistant", "System", "Prompt als Vorlage vorbereitet.");
  persistState();
}

function resetWorkspace() {
  workspace = createWorkspace();
  syncComposerState("Auto", { persist: false });
  renderAll();
  persistState();
}

function importStateFromObject(candidate) {
  const imported = normalizeAppState(candidate);
  state = imported;
  const active = currentProject();
  workspace = createWorkspace(active ? active.workspace : {});
  renderAll();
  chatStatus.textContent = "Zustand importiert";
  persistState();
}

function renderAll() {
  renderChat();
  renderWorkflows();
  renderQueue();
  renderTemplates();
  renderProjects();
  renderAiConfig();
  composerText.textContent = workspace.composerText;
  chatInput.value = workspace.composerValue;
  tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.preset === workspace.preset));
  toggleTeamBtn.textContent = workspace.teamEnabled ? "Deaktivieren" : "Aktivieren";
  lastWorkflowRun.textContent = workspace.lastWorkflowRun;
  projectNameInput.value = currentProject()?.name || "";
  projectDescriptionInput.value = currentProject()?.description || "";
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    syncComposerState(tab.dataset.preset || "Auto");
  });
});

quickPrompts.forEach((button) => {
  button.addEventListener("click", () => {
    chatInput.value = button.dataset.prompt || "";
    workspace = createWorkspace({
      ...workspace,
      composerValue: chatInput.value,
    });
    chatStatus.textContent = "bereit zum senden";
    persistState();
    chatInput.focus();
  });
});

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const prompt = chatInput.value.trim();
  if (!prompt) {
    chatStatus.textContent = "bitte erst Text eingeben";
    chatInput.focus();
    return;
  }

  const requestId = ++aiRequestSerial;
  addChatMessage("user", "Du", prompt);
  chatStatus.textContent = "arbeitet ...";
  workspace = createWorkspace({
    ...workspace,
    lastWorkflowRun: "Chat in Bearbeitung",
    composerValue: "",
  });
  persistState();
  chatInput.value = "";

  try {
    const result = await requestAssistantReply(prompt);
    if (requestId !== aiRequestSerial) return;

    addChatMessage("assistant", result.mode === "remote" ? "AI Gateway" : "Assistant", result.reply);
    workspace = createWorkspace({
      ...workspace,
      lastWorkflowRun: result.mode === "remote" ? "Externe KI-Antwort" : "Chat beantwortet",
    });
    chatStatus.textContent = result.mode === "remote" ? "verbunden" : "aktiv";
    lastWorkflowRun.textContent = workspace.lastWorkflowRun;
    persistState();
  } catch {
    if (requestId !== aiRequestSerial) return;

    addChatMessage("assistant", "Assistant", generateAssistantReply(prompt));
    workspace = createWorkspace({
      ...workspace,
      lastWorkflowRun: "Fallback aktiv",
    });
    chatStatus.textContent = "Fallback aktiv";
    lastWorkflowRun.textContent = workspace.lastWorkflowRun;
    persistState();
  }
});

clearChatBtn.addEventListener("click", () => {
  workspace = createWorkspace({
    ...workspace,
    chatMessages: safeClone(initialChat),
  });
  renderChat();
  chatStatus.textContent = "zurueckgesetzt";
  persistState();
});

focusChatBtn.addEventListener("click", () => {
  chatInput.focus();
});

savePromptBtn.addEventListener("click", () => {
  savePromptFromComposer();
});

exportStateBtn.addEventListener("click", () => {
  downloadJson("dw-ki-app-state.json", {
    ...state,
    projects: state.projects.map((project) => {
      if (project.id !== state.activeProjectId) return project;
      return {
        ...project,
        updatedAt: new Date().toISOString(),
        workspace: activeProjectSnapshot(),
      };
    }),
  });
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

  const workflow = workspace.workflows.find((entry) => entry.id === button.dataset.id);
  if (!workflow) return;

  if (button.dataset.action === "run") {
    workflow.status = "running";
    workspace = createWorkspace({
      ...workspace,
      lastWorkflowRun: workflow.name,
    });
    lastWorkflowRun.textContent = workflow.name;
    chatStatus.textContent = `${workflow.name} laeuft`;
    persistState();

    window.setTimeout(() => {
      workflow.status = "ready";
      workspace = createWorkspace({
        ...workspace,
        lastWorkflowRun: `${workflow.name} bereit`,
      });
      renderWorkflows();
      lastWorkflowRun.textContent = workspace.lastWorkflowRun;
      chatStatus.textContent = `${workflow.name} bereit`;
      persistState();
    }, 1200);
  }

  if (button.dataset.action === "toggle") {
    workflow.status = workflow.status === "paused" ? "ready" : "paused";
    workspace = createWorkspace({
      ...workspace,
      lastWorkflowRun: `${workflow.name}: ${workflowStatusLabel(workflow.status)}`,
    });
    lastWorkflowRun.textContent = workspace.lastWorkflowRun;
    persistState();
  }

  renderWorkflows();
});

refreshWorkflowsBtn.addEventListener("click", () => {
  workspace = createWorkspace({
    ...workspace,
    workflows: workspace.workflows.map((workflow) => ({
      ...workflow,
      status: workflow.status === "running" ? "ready" : workflow.status,
    })),
  });
  renderWorkflows();
  chatStatus.textContent = "Workflows aktualisiert";
  persistState();
});

clearQueueBtn.addEventListener("click", () => {
  workspace = createWorkspace({
    ...workspace,
    queueCleared: !workspace.queueCleared,
  });
  renderQueue();
  persistState();
});

toggleTeamBtn.addEventListener("click", () => {
  workspace = createWorkspace({
    ...workspace,
    teamEnabled: !workspace.teamEnabled,
    lastWorkflowRun: workspace.teamEnabled ? "Team pausiert" : "Team aktiviert",
  });
  toggleTeamBtn.textContent = workspace.teamEnabled ? "Deaktivieren" : "Aktivieren";
  lastWorkflowRun.textContent = workspace.lastWorkflowRun;
  persistState();
});

templateList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const card = button.closest(".template-card");
  const templateId = card?.dataset.templateId;
  const index = workspace.templates.findIndex((template) => template.id === templateId);
  if (index === -1) return;

  const template = workspace.templates[index];

  if (button.dataset.action === "apply-template") {
    chatInput.value = template.prompt;
    workspace.templates[index] = {
      ...template,
      usageCount: template.usageCount + 1,
      updatedAt: new Date().toISOString(),
    };
    workspace = createWorkspace({
      ...workspace,
      composerValue: template.prompt,
      promptSearch: workspace.promptSearch,
      promptTagDraft: workspace.promptTagDraft,
    });
    chatStatus.textContent = `Vorlage: ${template.title}`;
    renderTemplates();
    persistState();
    chatInput.focus();
  }

  if (button.dataset.action === "toggle-favorite") {
    workspace.templates[index] = {
      ...template,
      favorite: !template.favorite,
      updatedAt: new Date().toISOString(),
    };
    workspace = createWorkspace({
      ...workspace,
      templates: workspace.templates,
    });
    renderTemplates();
    persistState();
  }

  if (button.dataset.action === "remove-template") {
    workspace = createWorkspace({
      ...workspace,
      templates: workspace.templates.filter((entry) => entry.id !== templateId),
    });
    renderTemplates();
    persistState();
  }
});

projectList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const card = button.closest(".project-card");
  const projectId = card?.dataset.projectId;
  const project = state.projects.find((entry) => entry.id === projectId);
  if (!project) return;

  if (button.dataset.action === "activate-project") {
    syncActiveProject(project.id);
  }

  if (button.dataset.action === "duplicate-project") {
    const clone = createProject(`${project.name} Kopie`, `${project.description} - dupliziert`, project.workspace);
    state.projects = [...state.projects, clone];
    state.activeProjectId = clone.id;
    workspace = createWorkspace(clone.workspace);
    renderAll();
    persistState();
  }

  if (button.dataset.action === "delete-project") {
    removeProject(project.id);
  }
});

createProjectBtn.addEventListener("click", () => {
  createProjectFromForm({ duplicateCurrent: false });
});

duplicateProjectBtn.addEventListener("click", () => {
  createProjectFromForm({ duplicateCurrent: true });
});

projectNameInput.addEventListener("change", () => {
  const project = currentProject();
  if (!project) return;

  project.name = projectNameInput.value.trim() || project.name;
  project.updatedAt = new Date().toISOString();
  renderProjects();
  persistState();
});

projectDescriptionInput.addEventListener("change", () => {
  const project = currentProject();
  if (!project) return;

  project.description = projectDescriptionInput.value.trim() || project.description;
  project.updatedAt = new Date().toISOString();
  renderProjects();
  persistState();
});

promptSearchInput.addEventListener("input", () => {
  workspace = createWorkspace({
    ...workspace,
    promptSearch: promptSearchInput.value,
  });
  renderTemplates();
  persistState();
});

promptTagInput.addEventListener("input", () => {
  workspace = createWorkspace({
    ...workspace,
    promptTagDraft: promptTagInput.value,
  });
  renderTemplates();
  persistState();
});

clearPromptFiltersBtn.addEventListener("click", () => {
  workspace = createWorkspace({
    ...workspace,
    promptSearch: "",
    promptTagDraft: "",
  });
  promptSearchInput.value = "";
  promptTagInput.value = "";
  renderTemplates();
  persistState();
});

aiEndpointInput.addEventListener("change", applyAiConfigFromInputs);
aiModelInput.addEventListener("change", applyAiConfigFromInputs);
aiKeyInput.addEventListener("change", applyAiConfigFromInputs);
aiSystemPromptInput.addEventListener("change", applyAiConfigFromInputs);

saveAiConfigBtn.addEventListener("click", applyAiConfigFromInputs);

testAiBtn.addEventListener("click", async () => {
  applyAiConfigFromInputs();
  const prompt = "Antworte mit einem kurzen Status-OK.";
  chatStatus.textContent = "verbinde ...";

  try {
    const result = await requestAssistantReply(prompt);
    chatStatus.textContent = result.mode === "remote" ? "Verbindung ok" : "lokaler Modus";
    addChatMessage("assistant", result.mode === "remote" ? "AI Gateway" : "Assistant", result.reply);
  } catch {
    chatStatus.textContent = "Verbindung fehlgeschlagen";
  }
});

resetStateBtn.addEventListener("click", () => {
  state = normalizeAppState({});
  workspace = createWorkspace();
  seedTemplateLibrary();
  state.projects[0].workspace = createWorkspace(workspace);
  renderAll();
  chatStatus.textContent = "bereit";
  persistState();
});

function initialize() {
  workspace = createWorkspace(currentProject()?.workspace);
  seedTemplateLibrary();
  renderAll();
  if (workspace.composerValue) {
    chatInput.value = workspace.composerValue;
  }
  updateProjectInputsFromActive();
}

initialize();
