# Mello Code

Mello Code is a Windows desktop AI coding assistant built to work with a configurable AI provider instead of requiring Ollama.

## What this version does

- Works without Ollama.
- Supports an OpenAI-compatible API endpoint.
- Supports a "local-model" mode placeholder for future bundled local model support.
- Keeps the app user-configurable through saved settings.
- Lets you open a project folder and work on files while chatting.

## Quick start

### 1) Install dependencies

```bash
npm install
```

### 2) Start the app

```bash
npm start
```

### 3) Configure AI

In the left sidebar, choose one of the AI providers:
- OpenAI-compatible API
- Local model

For API mode, set:
- API URL (example: `https://api.openai.com/v1`)
- API key if required
- Model name

Then click **Save AI Settings**.

## Important note

This project no longer depends on Ollama, but it still requires some AI backend to actually generate answers:
- Either a hosted API provider
- Or a future local model bundle installed into a local-model path

A real offline local model is not bundled in this repo yet, because a production offline LLM needs a specific model file and runtime setup.

## Build Windows installer

```bash
npm run dist
```

## Security note

- Store API keys locally in your user profile, not in source code.
- Do not run untrusted code without review.
