const modelSelect = document.getElementById('modelSelect');
const promptInput = document.getElementById('promptInput');
const sendBtn = document.getElementById('sendBtn');
const chatMessages = document.getElementById('chatMessages');
const openProjectBtn = document.getElementById('openProjectBtn');
const newChatBtn = document.getElementById('newChatBtn');
const projectPath = document.getElementById('projectPath');
const fileList = document.getElementById('fileList');
const fileCount = document.getElementById('fileCount');
const statusText = document.getElementById('statusText');
const providerSelect = document.getElementById('providerSelect');
const apiKeyInput = document.getElementById('apiKeyInput');
const apiBaseUrlInput = document.getElementById('apiBaseUrlInput');
const modelInput = document.getElementById('modelInput');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');

let currentProjectPath = null;
let projectFiles = [];
let activeModel = '';
let currentSettings = { provider: 'openai-compatible', apiKey: '', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' };

function addMessage(role, text) {
  const message = document.createElement('div');
  message.className = `message ${role}`;
  message.textContent = text;
  chatMessages.appendChild(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function renderSettings(settings) {
  currentSettings = settings;
  providerSelect.value = settings.provider || 'openai-compatible';
  apiKeyInput.value = settings.apiKey || '';
  apiBaseUrlInput.value = settings.baseUrl || 'https://api.openai.com/v1';
  modelInput.value = settings.model || 'gpt-4o-mini';

  if (settings.provider === 'local-model') {
    statusText.textContent = 'Local model mode selected';
  }
}

async function loadSettings() {
  const settings = await window.melloAPI.getSettings();
  renderSettings(settings);
}

async function saveCurrentSettings() {
  const settings = {
    provider: providerSelect.value,
    apiKey: apiKeyInput.value.trim(),
    baseUrl: apiBaseUrlInput.value.trim() || 'https://api.openai.com/v1',
    model: modelInput.value.trim() || 'gpt-4o-mini'
  };

  const saved = await window.melloAPI.saveSettings(settings);
  currentSettings = saved;

  statusText.textContent = 'AI settings saved';
  addMessage('system', `AI provider updated: ${saved.provider}.`);

  if (saved.provider === 'local-model') {
    addMessage('system', 'Local model mode is enabled, but it still needs a model bundle or engine. Until that is installed, switch to an API-backed provider for actual inference.');
  }
}

async function openProject() {
  const folder = await window.melloAPI.selectFolder();

  if (!folder) {
    return;
  }

  currentProjectPath = folder;
  projectPath.textContent = folder;

  const files = await window.melloAPI.listFiles(folder);
  projectFiles = files;
  fileCount.textContent = files.length;

  fileList.innerHTML = '';

  files.forEach((file) => {
    const item = document.createElement('div');
    item.className = 'file-item';
    item.textContent = file.name;
    item.title = file.path;

    item.addEventListener('click', async () => {
      try {
        const content = await window.melloAPI.readFile(file.path);
        addMessage('system', `Open file: ${file.name}\n\n${content.slice(0, 1200)}`);
      } catch (error) {
        addMessage('system', `Could not read file: ${file.name}`);
      }
    });

    fileList.appendChild(item);
  });

  addMessage('system', `Project opened: ${folder}`);
}

async function sendPrompt() {
  const prompt = promptInput.value.trim();

  if (!prompt) {
    return;
  }

  addMessage('user', prompt);
  promptInput.value = '';

  const model = activeModel || modelInput.value || currentSettings.model || 'gpt-4o-mini';
  const settings = {
    provider: providerSelect.value,
    apiKey: apiKeyInput.value.trim(),
    baseUrl: apiBaseUrlInput.value.trim() || 'https://api.openai.com/v1',
    model,
    localModelPath: currentSettings.localModelPath || ''
  };

  statusText.textContent = 'Generating...';

  const result = await window.melloAPI.generateText({
    model,
    prompt,
    systemPrompt: `You are Mello Code, an AI coding assistant specialized in general software engineering, Roblox game development, scripting, debugging, and project planning. Keep answers practical and direct.`,
    providerSettings: settings
  });

  if (!result.ok) {
    statusText.textContent = 'AI error';
    addMessage('system', result.error);
    return;
  }

  statusText.textContent = 'Ready';
  addMessage('assistant', result.text);
}

openProjectBtn.addEventListener('click', openProject);
newChatBtn.addEventListener('click', () => {
  chatMessages.innerHTML = '';
  addMessage('system', 'New chat started. Ask for a feature, bug fix, or game mechanic.');
});

sendBtn.addEventListener('click', sendPrompt);

promptInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendPrompt();
  }
});

saveSettingsBtn.addEventListener('click', async () => {
  await saveCurrentSettings();
});

loadSettings();
addMessage('system', 'Mello Code is ready. No Ollama required. Choose your AI provider below.');
