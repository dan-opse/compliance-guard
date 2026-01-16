import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

interface AnalyzeRequest {
    contractText: string;
    policies: Array<{ number: string; description: string }>;
}

interface FlaggedClause {
    text: string;
    policyNumber: string;
    violation: string;
}

// Initialize Replicate client
const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

// Replicate Granite model (using 3.3 8b for best accuracy)
const GRANITE_MODEL = "ibm-granite/granite-3.3-8b-instruct";

// Call Replicate with Granite model (with retry logic for rate limits)
async function callGranite(
    systemPrompt: string,
    userMessage: string,
    temperature: number = 0.1,
    maxRetries: number = 3
): Promise<string> {
    const prompt = `System: ${systemPrompt}\n\nUser: ${userMessage}\n\nAssistant:`;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const output = await replicate.run(GRANITE_MODEL, {
                input: {
                    prompt: prompt,
                    max_tokens: 2048,
                    temperature: temperature,
                    top_p: 0.9,
                },
            }) as string[];

            return Array.isArray(output) ? output.join("") : String(output);
        } catch (error: any) {
            // Handle rate limit errors (429)
            if (error.response?.status === 429 && attempt < maxRetries) {
                const retryAfter = error.response.headers?.get('retry-after') || 10;
                const waitTime = parseInt(retryAfter) + 1; // Add 1 second buffer
                console.log(`   ⏳ Rate limited. Waiting ${waitTime}s before retry (attempt ${attempt + 1}/${maxRetries})...`);
                await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
                continue;
            }
            throw error;
        }
    }
    
    throw new Error("Max retries exceeded");
}

// Parse Guardian response for violation detection
function parseGuardianResponse(response: string): { isViolation: boolean; reasoning: string } {
    const lowerResponse = response.toLowerCase();
    const reasoning = response.trim();
    
    // Extract the first word to check primary answer (COMPLIANT or VIOLATION)
    const firstWord = lowerResponse.trim().split(/\s+/)[0];
    
    // Check for explicit COMPLIANT at start of response
    const startsWithCompliant = firstWord === "compliant" || 
                                firstWord === "compliant:" ||
                                firstWord === "compliant-";
    
    // Check for explicit VIOLATION at start of response
    const startsWithViolation = firstWord === "violation" || 
                               firstWord === "violation:" ||
                               firstWord === "violation-";
    
    // If starts with COMPLIANT explicitly
    if (startsWithCompliant) {
        return { isViolation: false, reasoning };
    }
    
    // If starts with VIOLATION explicitly
    if (startsWithViolation) {
        return { isViolation: true, reasoning };
    }
    
    // Fallback: look for keywords but exclude "non-compliant"
    const isNonCompliant = lowerResponse.includes("non-compliant") || 
                           lowerResponse.includes("non compliant");
    
    const hasExplicitCompliant = (lowerResponse.includes("compliant") || 
                                  lowerResponse.includes("complies") ||
                                  lowerResponse.includes("satisfies") ||
                                  lowerResponse.includes("meets the requirement")) && 
                                 !isNonCompliant;
    
    const hasViolation = lowerResponse.includes("violation") || 
                        lowerResponse.includes("violates") ||
                        lowerResponse.includes("does not comply") ||
                        lowerResponse.includes("fails to meet") ||
                        isNonCompliant;
    
    // Default to violation if unclear (conservative approach)
    if (hasExplicitCompliant && !hasViolation) {
        return { isViolation: false, reasoning };
    }
    
    return { isViolation: true, reasoning };
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
        // STAGE 1: Granite Analysis (detailed violation detection)
        // Using Replicate for fast GPU inference
        // ============================================
        console.log("\n🔍 STAGE 1: Granite Analysis (via Replicate)");
        console.log(`🤖 Calling ${GRANITE_MODEL}...`);

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
        const graniteResponse = await callGranite(graniteSystemPrompt, graniteUserMessage, 0.1);
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
                "⚠️  JSON parse error in Granite response (continuing with verification):",
                graniteResponse.substring(0, 200)
            );
        }

        // ============================================
        // STAGE 2: Granite Verification (via Replicate)
        // Using 3.3 Instruct with specialized prompting for verification
        // ============================================
        console.log("\n🛡️  STAGE 2: Granite Verification (via Replicate)");
        console.log(`🤖 Calling ${GRANITE_MODEL}...`);
        console.log("   Mode: Binary risk classification");
        console.log("   Temperature: 0.0 (deterministic scoring)");

        const verifiedViolations: FlaggedClause[] = [];

        for (const policy of policies) {
            const guardianSystemPrompt = `You are a contract compliance verifier checking if contract terms MEET OR EXCEED policy requirements.

CRITICAL RULE: If a contract term meets or exceeds a minimum requirement, the contract is COMPLIANT.
- "At least 90 days" + contract has "120 days" = COMPLIANT (120 >= 90, exceeds minimum)
- "At least 90 days" + contract has "30 days" = VIOLATION (30 < 90, below minimum)
- "At least 90 days" + contract has "90 days" = COMPLIANT (90 >= 90, meets minimum)

Answer ONLY with "COMPLIANT" or "VIOLATION" followed by brief explanation.

Examples:
- Policy: "at least 90 days" | Contract: "120 days" → "COMPLIANT - 120 days exceeds the 90-day minimum"
- Policy: "at least 90 days" | Contract: "30 days" → "VIOLATION - 30 days is less than the 90-day minimum"
- Policy: "payments in USD" | Contract: "payments in EUR" → "VIOLATION - payments in EUR, not USD"
- Policy: "annual audit rights" | Contract: "may request review" → "VIOLATION - 'upon request' does not guarantee annual rights"
- Policy: "annual audit rights" | Contract: "annual audits permitted" → "COMPLIANT - provides annual audit rights"`;

            const guardianUserMessage = `POLICY REQUIREMENT: ${policy.description}

CONTRACT TEXT:
${contractText}

Check if the contract MEETS OR EXCEEDS this requirement. Respond with "COMPLIANT" or "VIOLATION" and explain.`;

            const guardianStartTime = Date.now();
            try {
                const result = await callGranite(guardianSystemPrompt, guardianUserMessage, 0.0);
                const guardianTime = (Date.now() - guardianStartTime) / 1000;

                const { isViolation, reasoning } = parseGuardianResponse(result);

                const status = isViolation ? "⚠️  VIOLATION" : "✅ COMPLIANT";
                console.log(`   • ${policy.number}: ${status} (${guardianTime.toFixed(2)}s)`);

                if (reasoning) {
                    console.log(`      Reasoning: ${reasoning}`);
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
