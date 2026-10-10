# Mello Code

Mello Code is a local-first AI coding assistant for Windows. It is designed to help with:
- general software engineering
- game development
- Roblox / Luau scripting
- workspace-aware coding
- local AI execution through Ollama

## Requirements

- Windows 10 or 11
- Node.js 18 or newer
- Ollama installed and running

## Install Ollama

Download and install Ollama:
https://ollama.com/download/windows

Then install a coding model:

```bash
ollama pull qwen2.5-coder:7b
```

or:

```bash
ollama pull deepseek-coder:6.7b
```

## Install project dependencies

```bash
npm install
```

## Start app

```bash
npm start
```

## Build executable

```bash
npm run dist
```

This creates the Windows installer in the `build` folder.

## Important notes

- This app uses a local AI engine, not a paid API.
- The app is functional as a desktop shell and local AI interface.
- Real Roblox Studio automation would require a separate plugin + secure local bridge.
- The app does not claim to have unlimited compute; local AI performance depends on your machine.

## Security note

- Do not run untrusted code from the internet without review.
- Approve sensitive actions before installing software or altering files.
