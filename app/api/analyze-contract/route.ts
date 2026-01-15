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

interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

const OLLAMA_API_URL = process.env.OLLAMA_API_URL || "http://localhost:11434";
const ANALYST_MODEL = process.env.ANALYST_MODEL || "granite3.1-dense:8b";
const GUARDIAN_MODEL = process.env.GUARDIAN_MODEL || "ibm/granite3.3-guardian:8b";

// Call Ollama Chat API with proper control tokens and message structure
async function callOllamaChat(
    model: string,
    messages: ChatMessage[],
    temperature: number = 0.1
): Promise<string> {
    const response = await fetch(`${OLLAMA_API_URL}/api/chat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: model,
            messages: messages,
            stream: false,
            temperature: temperature,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama Chat API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data.message?.content || "";
}

// Parse Guardian 3.3's <think> and <score> output (reasoning traces)
function parseGuardianResponse(response: string): { isViolation: boolean; reasoning: string } {
    const thinkMatch = response.match(/<think>([\s\S]*?)<\/think>/);
    const scoreMatch = response.match(/<score>([\s\S]*?)<\/score>/);

    const reasoning = thinkMatch ? thinkMatch[1].trim() : "";
    let isViolation = false;

    if (scoreMatch) {
        const score = scoreMatch[1].toLowerCase().trim();
        isViolation = score.includes("yes");
    } else {
        // Fallback: look for yes/no in response
        isViolation = response.toLowerCase().includes("yes");
    }

    return { isViolation, reasoning };
}

export async function POST(request: NextRequest) {
    try {
        const { contractText, policies }: AnalyzeRequest = await request.json();

        if (!contractText?.trim()) {
            return NextResponse.json(
                { error: "Contract text is required" },
                { status: 400 }
            );
        }

        console.log("📋 Starting enterprise-grade contract analysis...");
        console.log(`📄 Contract length: ${contractText.length} characters`);
        console.log(`🔍 Policies to check: ${policies.length}`);

        // ============================================
        // STAGE 1: Granite Dense Analysis (detailed violation detection)
        // Using Chat API with proper control tokens
        // ============================================
        console.log("\n🔍 STAGE 1: Granite Dense 3.1 Analysis");
        console.log(`🤖 Calling ${ANALYST_MODEL} via Chat API...`);
        console.log("   Mode: Structured JSON output (Chat API with control tokens)");

        const graniteSystemPrompt = `You are a contract compliance analyst. Analyze contracts for policy violations and respond with valid JSON only.

When violations are found, return:
[{"policyNumber":"POL-001","violation":"description","text":"exact quote"}]

When no violations exist, return: []

Never include markdown, explanations, or invalid JSON.`;

        const graniteUserMessage = `POLICIES:
${policies.map((p) => `${p.number}: ${p.description}`).join("\n")}

CONTRACT:
${contractText}

Identify all policy violations and respond with ONLY valid JSON array.`;

        const startTime = Date.now();
        const graniteResponse = await callOllamaChat(
            ANALYST_MODEL,
            [
                { role: "system", content: graniteSystemPrompt },
                { role: "user", content: graniteUserMessage },
            ],
            0.1
        );
        const graniteTime = (Date.now() - startTime) / 1000;
        console.log(`⏱️  Response time: ${graniteTime.toFixed(2)}s`);

        let graniteFindings: FlaggedClause[] = [];
        try {
            const jsonMatch = graniteResponse.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (Array.isArray(parsed)) {
                    graniteFindings = parsed.map((item: any) => ({
                        policyNumber: item.policyNumber || "",
                        violation: item.violation || "",
                        text: item.text || "",
                    }));
                    console.log(`✅ Found ${graniteFindings.length} candidate violations`);
                    graniteFindings.forEach((c) => console.log(`   • ${c.policyNumber}: ${c.violation}`));
                }
            }
        } catch (parseError) {
            console.error(
                "⚠️  JSON parse error in Granite response (continuing with Guardian verification):",
                graniteResponse.substring(0, 200)
            );
        }

        // ============================================
        // STAGE 2: Granite Guardian 3.3 Risk Assessment
        // Using Chat API with proper control tokens for model adherence
        // ============================================
        console.log("\n🛡️  STAGE 2: Granite Guardian 3.3 Risk Assessment");
        console.log(`🤖 Calling ${GUARDIAN_MODEL} via Chat API...`);
        console.log("   Mode: Enterprise risk classification with reasoning traces");
        console.log("   Using proper control tokens for maximum model adherence");
        console.log("   Temperature: 0.0 (deterministic risk scoring)");

        const verifiedViolations: FlaggedClause[] = [];

        for (const policy of policies) {
            // Proper Enterprise Chat Format with system and user roles
            // Ollama's Chat API applies correct control tokens internally
            const guardianSystemPrompt = `You are an enterprise contract risk assessor. Your role is to evaluate if a contract violates a specified policy requirement.

You MUST respond with:
- <think>your reasoning</think> tags containing your analysis
- <score>yes</score> or <score>no</score> tags for your assessment

Be precise: "yes" means the contract violates the policy, "no" means it complies.`;

            const guardianUserMessage = `POLICY REQUIREMENT: ${policy.description}

CONTRACT TEXT:
${contractText}

Does this contract violate the specified policy? Respond with <think> and <score> tags.`;

            const guardianStartTime = Date.now();
            try {
                const result = await callOllamaChat(
                    GUARDIAN_MODEL,
                    [
                        { role: "system", content: guardianSystemPrompt },
                        { role: "user", content: guardianUserMessage },
                    ],
                    0.0 // Deterministic: temperature 0.0
                );
                const guardianTime = (Date.now() - guardianStartTime) / 1000;

                const { isViolation, reasoning } = parseGuardianResponse(result);

                const status = isViolation ? "⚠️  VIOLATION" : "✅ COMPLIANT";
                console.log(`   • ${policy.number}: ${status} (${guardianTime.toFixed(2)}s)`);

                if (reasoning) {
                    console.log(`      Reasoning: ${reasoning.substring(0, 120)}...`);
                }

                if (isViolation) {
                    const graniteDetail = graniteFindings.find((f) => f.policyNumber === policy.number);

                    verifiedViolations.push({
                        policyNumber: policy.number,
                        violation:
                            graniteDetail?.violation ||
                            `Contract violates ${policy.number}: ${policy.description}`,
                        text: graniteDetail?.text || "Violation detected by Guardian risk assessment",
                    });
                }
            } catch (guardianError) {
                console.error(`   ❌ Guardian error for ${policy.number}:`, guardianError);
            }
        }

        console.log(`\n✨ Analysis complete!`);
        console.log(`🚩 Final verified violations: ${verifiedViolations.length}`);
        verifiedViolations.forEach((clause) => {
            console.log(`   • ${clause.policyNumber}: ${clause.violation}`);
        });
        console.log("");

        return NextResponse.json({ flaggedClauses: verifiedViolations });
    } catch (error) {
        console.error("❌ Error analyzing contract:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        );
    }
}
