# Ollama Setup Guide

This project now uses **Ollama** for LLM-powered contract compliance analysis with IBM Granite models.

## Prerequisites

- macOS (Ollama supports macOS, Linux, and Windows via WSL2)
- At least 8GB RAM
- ~5GB disk space for the model

## Installation & Setup

### 1. Install Ollama

Download and install from [ollama.ai](https://ollama.ai)

Or via Homebrew:
```bash
brew install ollama
```

### 2. Start Ollama

Start the Ollama service (runs on `http://localhost:11434` by default):
```bash
ollama serve
```

Keep this terminal window open—Ollama must be running in the background.

### 3. Pull the Granite Model

In a new terminal, pull the Granite 2 model:
```bash
ollama pull granite2
```

Or for Granite 3 (larger, better quality):
```bash
ollama pull granite2:8b
```

First pull will take a few minutes depending on your internet.

### 4. Verify Installation

Test that Ollama is working:
```bash
curl http://localhost:11434/api/tags
```

You should see your pulled model listed.

## Running the Application

### Start the Next.js dev server:
```bash
npm run dev
```

The app runs on `http://localhost:3000`

## Configuration

### Custom Ollama URL (optional)

If Ollama is running on a different address, set the environment variable:
```bash
export OLLAMA_API_URL=http://your-server:11434
```

### Custom Model (optional)

To use a different model:
```bash
export OLLAMA_MODEL=granite2:8b
```

Or set in `.env.local`:
```
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=granite2
```

## Available Models

- `granite2` (lightweight, ~5GB)
- `granite2:8b` (better quality, ~8GB)
- `llama2` (alternative, ~4GB)
- `mistral` (fast alternative, ~4GB)

## Troubleshooting

**"Ollama API error: 500"**
- Make sure Ollama is running: `ollama serve`
- Verify the model is installed: `ollama list`
- Check Ollama logs in the terminal where you ran `ollama serve`

**Application is slow**
- Granite models are optimized for instruction following but still take ~2-10 seconds per analysis
- Smaller model: try `ollama pull mistral` for faster responses
- Larger hardware: more RAM = faster inference

**Model keeps downloading**
- Models are cached in `~/.ollama/models/`
- Subsequent uses are much faster

## Next Steps

1. Start Ollama: `ollama serve`
2. Pull model: `ollama pull granite2`
3. Run app: `npm run dev`
4. Visit http://localhost:3000 and test!
