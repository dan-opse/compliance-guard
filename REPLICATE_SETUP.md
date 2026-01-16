# Replicate Setup Guide

## Quick Start

1. **Sign up for Replicate**
   - Go to https://replicate.com
   - Create a free account
   - Get your API token from https://replicate.com/account/api-tokens

2. **Add API Token**
   - Open `.env.local` in your project
   - Replace `your_replicate_api_token_here` with your actual token:
     ```
     REPLICATE_API_TOKEN=r8_abc123your_actual_token_here
     ```

3. **Restart Dev Server**
   ```bash
   npm run dev
   ```

4. **Test the Application**
   - Navigate to http://localhost:3000
   - Paste a contract or upload a file
   - Click "Analyze Contract"
   - Results should appear in **2-5 seconds** (vs 5-10 minutes with local Ollama)

## What Changed

- **Before**: Local Ollama with slow CPU inference (1-10 minutes)
- **After**: Replicate with fast GPU inference (2-5 seconds)
- **Model**: IBM Granite 3.0 8B Instruct (enterprise-grade)
- **Cost**: ~$0.001-0.005 per analysis (free tier available)

## Models Used

**Current Implementation**: IBM Granite 3.3 8B Instruct (via Replicate)

### ⚠️ Important Limitations

**What We're Using:**
- `ibm-granite/granite-3.3-8b-instruct` - General-purpose instruction model
- Standard Replicate API (string-based prompting)
- Basic yes/no parsing for compliance detection

**What We're NOT Using:**
- Granite Guardian (not available on Replicate)
- Chat API with proper control tokens (Replicate doesn't support this format)
- `<think>` and `<score>` reasoning traces (Guardian-specific feature)

### Why This Matters

The original implementation with **Ollama + Granite Guardian** provided:
- Proper Chat API with role-based control tokens
- Guardian's specialized risk assessment training
- Reasoning traces showing model's decision process
- Deterministic binary classification

The current **Replicate** implementation provides:
- Faster GPU inference
- IBM Granite models (but Instruct, not Guardian)
- String-based prompting (less precise than Chat API)
- Heuristic-based violation parsing

### Trade-offs

| Feature | Ollama + Guardian | Replicate + Instruct |
|---------|------------------|---------------------|
| **Speed** | 5-10 minutes | 5-10 seconds |
| **Accuracy** | Higher (specialized Guardian) | Good (general Instruct) |
| **Architecture** | Enterprise-grade Chat API | Basic string prompting |
| **Reasoning** | `<think>` traces | Basic yes/no |
| **Cost** | Free (local) | ~$0.001-0.005 per analysis |
| **Setup** | Complex | Simple |

### To Upgrade to Full Enterprise Implementation

To use true Granite Guardian with Chat API:
1. Go back to Ollama (local, slow but authentic, could cloud host)
2. Deploy Guardian on cloud (requires setup)
3. Use IBM watsonx.ai directly (requires IBM Cloud account; we were unable to do so due to card verification issues.)

Current implementation is a **pragmatic trade-off** between speed and authenticity for demo purposes.

## Pricing

Replicate charges based on compute time:
- **Free tier**: First few requests free
- **Paid**: ~$0.001 per second of inference
- **Typical cost**: $0.002-0.005 per contract analysis

## Troubleshooting

### "Missing API token" error
- Make sure `.env.local` exists with `REPLICATE_API_TOKEN`
- Restart dev server after adding token

### "Model not found" error
- Check Replicate's model catalog at https://replicate.com/ibm-granite
- Model name might have changed - update in `route.ts`

### Slow responses
- First request might be slower (model cold start ~5-10s)
- Subsequent requests are faster (~2-3s)
