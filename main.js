const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const DEFAULT_SETTINGS = {
  provider: 'openai-compatible',
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
  localModelPath: ''
};

function getSettingsPath() {
  return path.join(app.getPath('userData'), 'mello-code-settings.json');
}

function readSettings() {
  const filePath = getSettingsPath();
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return { ...DEFAULT_SETTINGS, ...JSON.parse(content) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function writeSettings(settings) {
  const filePath = getSettingsPath();
  fs.writeFileSync(filePath, JSON.stringify(settings, null, 2), 'utf8');
}

async function apiCall(endpoint, body, apiKey) {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API request failed (${response.status}): ${text || response.statusText}`);
  }

  return await response.json();
}

function getProviderPrompt(systemPrompt, userPrompt) {
  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1500,
    height: 950,
    minWidth: 1100,
    minHeight: 700,
    title: 'Mello Code',
    backgroundColor: '#0b0b0f',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  win.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });

  if (result.canceled || !result.filePaths.length) {
    return null;
  }

  return result.filePaths[0];
});

ipcMain.handle('list-files', async (_, folderPath) => {
  return walkFolder(folderPath);
});

ipcMain.handle('read-file', async (_, filePath) => {
  return fs.readFileSync(filePath, 'utf8');
});

ipcMain.handle('save-file', async (_, filePath, content) => {
  fs.writeFileSync(filePath, content, 'utf8');
  return true;
});

ipcMain.handle('get-settings', async () => {
  return readSettings();
});

ipcMain.handle('save-settings', async (_, settings) => {
  const merged = { ...DEFAULT_SETTINGS, ...readSettings(), ...settings };
  writeSettings(merged);
  return merged;
});

ipcMain.handle('generate-text', async (_, { model, prompt, systemPrompt, providerSettings }) => {
  const settings = { ...DEFAULT_SETTINGS, ...readSettings(), ...(providerSettings || {}) };
  const system = systemPrompt || 'You are Mello Code, an AI coding assistant focused on software engineering, Roblox game development, and practical project work.';

  try {
    if (settings.provider === 'local-model') {
      if (!settings.localModelPath) {
        return {
          ok: false,
          error: 'No local model is configured. Add a local model bundle or switch to an API provider.'
        };
      }

      return {
        ok: false,
        error: 'Local model mode is enabled but no actual model backend is installed yet. Use an API provider or add a bundled local model in the future.'
      };
    }

    const baseUrl = (settings.baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '');
    const endpoint = `${baseUrl}/chat/completions`;
    const payload = {
      model: model || settings.model || 'gpt-4o-mini',
      messages: getProviderPrompt(system, prompt || ''),
      temperature: 0.7
    };

    const response = await apiCall(endpoint, payload, settings.apiKey || '');
    const text = response?.choices?.[0]?.message?.content || '';

    return {
      ok: true,
      text
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message || 'AI request failed.'
    };
  }
});

function walkFolder(folderPath) {
  const stack = [folderPath];
  const output = [];

  while (stack.length) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.git') continue;
        stack.push(fullPath);
      } else {
        output.push({
          name: entry.name,
          path: fullPath,
          isDirectory: false
        });
      }
    }
  }

  return output;
}
