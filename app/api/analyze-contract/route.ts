import { NextRequest, NextResponse } from "next/server";

interface AnalyzeRequest {
  contractText: string;
  policies: Array<{ number: string; description: string }>;
}

interface FlaggedClause {
  text: string;
  policyNumber: string;
  violation: string;
}

const OLLAMA_API_URL = process.env.OLLAMA_API_URL || "http://localhost:11434";
const MODEL = process.env.OLLAMA_MODEL || "granite2";

export async function POST(request: NextRequest) {
  try {
    const { contractText, policies }: AnalyzeRequest = await request.json();

    if (!contractText?.trim()) {
      return NextResponse.json(
        { error: "Contract text is required" },
        { status: 400 }
      );
    }

    // Build policy descriptions for the prompt
    const policyDescriptions = policies
      .map((p) => `${p.number}: ${p.description}`)
      .join("\n");

    // Create a prompt for Ollama to analyze the contract
    const prompt = `You are a contract compliance analyzer. Analyze the following contract against these company policies and identify any violations.

COMPANY POLICIES:
${policyDescriptions}

CONTRACT TEXT:
${contractText}

For each policy violation found, respond with ONLY a JSON array in this exact format:
[
  {"policyNumber": "POL-001", "violation": "Brief description of the violation", "text": "Relevant quote from contract"}
]

If no violations are found, respond with an empty array: []

Do not include any markdown formatting, code blocks, or explanatory text. Only the JSON array.`;

    // Call Ollama API
    const ollamaResponse = await fetch(`${OLLAMA_API_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        prompt: prompt,
        stream: false,
        temperature: 0.1,
      }),
    });

    if (!ollamaResponse.ok) {
      const errorText = await ollamaResponse.text();
      console.error("Ollama API error:", ollamaResponse.status, errorText);
      return NextResponse.json(
        {
          error: `Ollama API error: ${ollamaResponse.status}. Make sure Ollama is running on ${OLLAMA_API_URL} with model '${MODEL}' available.`,
        },
        { status: 500 }
      );
    }

    const ollamaData = await ollamaResponse.json();
    const responseText = ollamaData.response || "";

    // Parse the JSON response from Ollama
    let flaggedClauses: FlaggedClause[] = [];
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        flaggedClauses = parsed.map(
          (item: { policyNumber: string; violation: string; text: string }) => ({
            policyNumber: item.policyNumber,
            violation: item.violation,
            text: item.text,
          })
        );
      }
    } catch (parseError) {
      console.error("Failed to parse Ollama response:", responseText);
      return NextResponse.json(
        { error: "Failed to parse AI response. Check server logs." },
        { status: 500 }
      );
    }

    return NextResponse.json({ flaggedClauses });
  } catch (error) {
    console.error("Error analyzing contract:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
