const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 1500,
    height: 950,
    minWidth: 1100,
    minHeight: 700,
    title: 'Mello Code',
    backgroundColor: '#0b0b0f',
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'assets', 'icon.png'),
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

ipcMain.handle('get-models', async () => {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    if (!response.ok) {
      return { ok: false, error: 'Ollama is not running or not installed.' };
    }
    const data = await response.json();
    return { ok: true, models: data.models || [] };
  } catch (error) {
    return {
      ok: false,
      error: 'Could not connect to Ollama. Install Ollama and start it first.'
    };
  }
});

ipcMain.handle('generate-text', async (_, { model, prompt, systemPrompt }) => {
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || 'qwen2.5-coder:7b',
        prompt: prompt || '',
        system: systemPrompt || 'You are Mello Code, a helpful coding assistant focused on software engineering, Roblox game development, and practical project work.',
        stream: false,
        options: {
          temperature: 0.7
        }
      })
    });

    if (!response.ok) {
      return {
        ok: false,
        error: 'The model request failed. Check the selected Ollama model and connection.'
      };
    }

    const data = await response.json();
    return {
      ok: true,
      text: data.response || ''
    };
  } catch (error) {
    return {
      ok: false,
      error: 'Unable to reach Ollama. Make sure it is installed and running.'
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
