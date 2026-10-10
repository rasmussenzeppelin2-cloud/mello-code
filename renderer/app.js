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

let currentProjectPath = null;
let projectFiles = [];
let activeModel = '';

function addMessage(role, text) {
  const message = document.createElement('div');
  message.className = `message ${role}`;
  message.textContent = text;
  chatMessages.appendChild(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function loadModels() {
  statusText.textContent = 'Checking local AI...';

  const result = await window.melloAPI.getModels();

  if (!result.ok) {
    statusText.textContent = 'Local AI not ready';
    modelSelect.innerHTML = '<option value="">No model available</option>';
    addMessage(
      'system',
      `Local AI connection failed: ${result.error}\n\nInstall Ollama and run: ollama pull qwen2.5-coder:7b`
    );
    return;
  }

  const models = result.models.map((m) => m.name);
  if (!models.length) {
    modelSelect.innerHTML = '<option value="">No models downloaded</option>';
    statusText.textContent = 'No local models available';
    addMessage(
      'system',
      'No Ollama models are installed yet. Install Ollama, then run a command like:\n\nollama pull qwen2.5-coder:7b'
    );
    return;
  }

  modelSelect.innerHTML = '';
  models.forEach((model) => {
    const option = document.createElement('option');
    option.value = model;
    option.textContent = model;
    modelSelect.appendChild(option);
  });

  activeModel = models[0];
  modelSelect.value = activeModel;

  statusText.textContent = 'Local AI ready';
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

  const model = activeModel || modelSelect.value || 'qwen2.5-coder:7b';

  if (!model) {
    addMessage('system', 'No model selected. Install a local model first.');
    return;
  }

  statusText.textContent = 'Generating...';

  const result = await window.melloAPI.generateText({
    model,
    prompt,
    systemPrompt: `
      You are Mello Code, an AI coding assistant specialized in:
      - general programming
      - Roblox game development
      - Luau scripting
      - debugging
      - project-based code generation
      - clean architecture
      - Windows app development

      Be practical, direct, and precise.
      If the user is asking for game systems or Roblox features, include realistic design choices.
      If the user asks for code, provide concise but complete code snippets.
      Explain changes clearly.
      Do not claim you have performed actions that are not real.
    `
  });

  if (!result.ok) {
    statusText.textContent = 'Model error';
    addMessage('system', result.error);
    return;
  }

  statusText.textContent = 'Local AI ready';
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

modelSelect.addEventListener('change', (event) => {
  activeModel = event.target.value;
});

loadModels();
addMessage('system', 'Mello Code is ready. Open a project folder and start building.');
