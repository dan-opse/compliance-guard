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

### 3. Pull IBM Granite Model

**Recommended (best for contract analysis):**
```bash
ollama pull granite3.1-dense:8b
```

**Other Granite options:**
```bash
ollama pull granite4              # Latest version, better instruction following
ollama pull granite3.2            # Balanced, good for general tasks
ollama pull granite3.1-moe        # Mixture of Experts, efficient
```

**Alternative if you prefer (non-Granite):**
```bash
ollama pull mistral               # Fast alternative
ollama pull llama2                # Larger, higher quality
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
export OLLAMA_MODEL=llama2
```

Or set in `.env.local`:
```
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=granite3.1-dense:8b
```

## Available Models

**IBM Granite (Recommended):**
- `granite4` (latest, improved instruction following, ~10GB)
- `granite3.1-dense:8b` (optimized for contracts, ~5GB) **← BEST FOR THIS PROJECT**
- `granite3.2` (balanced, ~8GB)
- `granite3.1-moe` (efficient mixture of experts, ~3GB)

**Open-source alternatives:**
- `mistral` (fast, high quality, ~5GB)
- `llama2` (balanced, ~4GB)
- `neural-chat` (conversation optimized, ~5GB)

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

1. **Make sure Ollama is running**: Open a terminal and run:
   ```bash
   ollama serve
   ```
   Keep this window open.

2. **Pull a Granite model** (in a new terminal):
   ```bash
   ollama pull granite3.1-dense:8b
   ```
   Or try `granite4` for the latest version.

3. **Run the app** (in another terminal):
   ```bash
   cd /Users/danielcheah/LocalDocuments/Projects/compliance-guard
   npm run dev
   ```

4. Visit http://localhost:3000 and test!
