# ComplianceGuard

An intelligent contract compliance analyzer powered by IBM Granite AI that helps companies quickly identify policy violations in contracts.

## Features

### Core Analysis
- **Two-Stage Verification**: Stage 1 (Granite analysis) + Stage 2 (Guardian verification) for accurate violation detection
- **Real-time Highlighting**: Violations are highlighted directly in the original contract text
- **Progress Tracking**: Visual progress bar with stage updates during analysis

### Policy Management
- **5 Pre-built Templates**: SaaS, Financial Services, Healthcare (HIPAA), Enterprise, and Minimal
- **Policy Toggles**: Enable/disable individual policies for selective checking
- **Custom Policies**: Add your own policies with auto-generated policy numbers
- **Import/Export**: Share policy sets as JSON files across teams

### Contract Analysis
- **Professional Editor**: Clean, modern document editor with proper formatting
- **Sample Contracts**: Quick-start with 3 sample contracts (Compliant, Non-Compliant, Partial)
- **Text File Upload**: Drag & drop or click to upload TXT contracts
- **Analysis History**: Browse and revisit up to 20 previous analyses with all violations

### Results & Reporting
- **Violation Highlighting**: See exactly where violations occur in the contract
- **Detailed Explanations**: Understand why each violation was flagged
- **History View**: Complete analysis records with timestamps and violation counts

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Replicate API key (free at https://replicate.com)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd compliance-guard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Create .env.local file
   echo "REPLICATE_API_TOKEN=your_api_key_here" > .env.local
   ```
   Get your API key from: https://replicate.com/account/api-tokens

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## Usage

### Analyzing a Contract

1. **Paste Contract Text**
   - Click in the contract editor and paste your contract text, OR
   - Use a sample contract for quick testing

2. **Select Policy Template**
   - Choose from pre-built templates in the Policy section
   - Customize by enabling/disabling specific policies

3. **Run Analysis**
   - Click "Analyze Contract" button
   - View results in 5-10 seconds (powered by cloud GPU inference)

4. **Review Results**
   - **Contract Tab**: See your contract with violations highlighted in yellow
   - **Flagged Clauses Tab**: See detailed violation explanations
   - **History Tab**: Browse previous analyses

### Adding Custom Policies

1. Click the "Edit Policies" button
2. Click "+ Add Policy"
3. Enter policy description
4. Save to automatically add to your analysis

### Sharing Policy Sets

1. Click "Edit Policies"
2. Click "Export JSON" to download current policies
3. Share the JSON file with your team
4. Others can import by clicking "Import JSON"

## Technology Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **AI Model**: IBM Granite 3.3 8B Instruct (via Replicate API)
- **Analysis**: Two-stage verification process with temperature 0.0 for deterministic results
- **Storage**: Browser localStorage for history persistence

## File Structure

```
compliance-guard/
├── app/
│   ├── api/
│   │   ├── analyze-contract/route.ts    # Contract analysis endpoint
│   │   └── parse-file/route.ts          # Text file parsing
│   ├── page.tsx                         # Main application
│   ├── layout.tsx                       # App layout
│   └── globals.css                      # Global styles
├── lib/
│   ├── policy-templates.ts              # Policy template definitions
│   └── sample-contracts.ts              # Sample contract data
├── public/                              # Static assets
├── package.json                         # Dependencies
├── tsconfig.json                        # TypeScript config
└── next.config.ts                       # Next.js config
```

## Architecture

### Analysis Flow

```
User Input (Contract + Policies)
         ↓
STAGE 1: Granite Analysis
  - JSON-based violation detection
  - Returns candidate violations
         ↓
STAGE 2: Granite Verification
  - Binary COMPLIANT/VIOLATION check
  - Deterministic (temperature 0.0)
  - Reviews each policy individually
         ↓
Final Violations + Reasoning
```

### API Endpoints

- **POST `/api/analyze-contract`**
  - Input: `{ contractText: string, policies: Policy[] }`
  - Output: `{ flaggedClauses: FlaggedClause[] }`

- **POST `/api/parse-file`**
  - Input: FormData with TXT file
  - Output: `{ text: string }`

## Configuration

### Replicate API

The app uses Replicate's hosted inference for IBM Granite models. Key settings:

- **Model**: `ibm-granite/granite-3.3-8b-instruct`
- **Max Tokens**: 2048
- **Stage 1 Temperature**: 0.1 (slightly creative analysis)
- **Stage 2 Temperature**: 0.0 (deterministic verification)
- **Rate Limit**: 6 requests/min with free tier

### Policies

Default policies are defined in `/lib/policy-templates.ts`. Modify template descriptions to change policy requirements.

## Development

### Building for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Limitations & Future Work

### Current Limitations
- **Text Files Only**: PDF and DOCX support coming soon
- **Replicate-based**: Uses Granite 3.3 Instruct (not Guardian)
- **String Prompting**: Basic text-based prompts (not Chat API)
- **5-10 Second Latency**: Due to cloud inference and rate limiting

### Future Enhancements
- PDF and DOCX file parsing
- Real-time analysis streaming
- Custom model fine-tuning
- Advanced export formats (PDF reports)
- Team collaboration features
- Historical trend analysis

## Pricing

**Replicate Usage**: ~$0.001-0.005 per contract analysis
- Free tier includes $5 credit for testing
- Pay-as-you-go after free tier

## Support

For issues or feature requests, please create a GitHub issue or contact the development team.

## License

[Your License Here]

## Acknowledgments

- IBM for Granite AI models
- Replicate for inference infrastructure
- Next.js for the web framework
