"use client";

import Image from "next/image";
import { useState } from "react";

interface FlaggedClause {
  text: string;
  policyNumber: string;
  violation: string;
}
const POLICIES = [
  { number: "POL-001", description: "Minimum 90 days termination notice required" },
  { number: "POL-005", description: "All payments must be in USD" },
  { number: "POL-010", description: "Liability cap cannot exceed contract value" },
  { number: "POL-015", description: "Data processing only in approved US regions" },
  { number: "POL-020", description: "Annual audit rights required" },
];
export default function Home() {
  const [contractText, setContractText] = useState("");
  const [flaggedClauses, setFlaggedClauses] = useState<FlaggedClause[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"upload" | "results">("upload");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsLoadingFile(true);
      setLoadingError(null);
      
      const timeoutId = setTimeout(() => {
        setIsLoadingFile(false);
        setLoadingError("File processing timed out. Please try a smaller file.");
      }, 30000);

      try {
        let text = "";

        if (file.type === "application/pdf") {
          // Send to server for PDF parsing
          const formData = new FormData();
          formData.append("file", file);

          const response = await fetch("/api/parse-pdf", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error("Failed to parse PDF");
          }

          const data = await response.json();
          text = data.text;
        } else {
          // Read as plain text
          const reader = new FileReader();
          text = await new Promise((resolve, reject) => {
            reader.onload = (event) => {
              resolve(event.target?.result as string);
            };
            reader.onerror = () => {
              reject(new Error("Failed to read file"));
            };
            reader.readAsText(file);
          });
        }

        clearTimeout(timeoutId);
        setContractText(text);
        setIsLoadingFile(false);
      } catch (error) {
        clearTimeout(timeoutId);
        console.error("Error reading file:", error);
        setLoadingError(
          error instanceof Error ? error.message : "Error reading file. Please try a valid PDF or text file."
        );
        setIsLoadingFile(false);
      }
    }
  };

  const handleAnalyze = async () => {
    if (!contractText.trim()) {
      alert("Please upload or paste a contract first");
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/analyze-contract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contractText,
          policies: POLICIES,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze contract");
      }

      const data = await response.json();
      setFlaggedClauses(data.flaggedClauses || []);
      setActiveTab("results");
    } catch (error) {
      console.error("Error analyzing contract:", error);
      alert("Error analyzing contract. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #161616, #262626, #161616)' }}>
      {/* Header */}
      <div className="border-b backdrop-blur" style={{ borderColor: '#393939', backgroundColor: 'rgba(22, 22, 22, 0.5)' }}>
        <div className="max-w-7xl mx-auto px-6 py-2 flex items-center gap-3">
          <Image
            src="/logos/submark-transparent.png"
            alt="ComplianceGuard logo"
            width={52}
            height={52}
          />
          <h1 className="text-2xl font-bold" style={{ color: '#f4f4f4' }}>ComplianceGuard</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Upload & Policy */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Upload Section */}
              <div className="card">
                <h2 className="text-lg font-semibold mb-4" style={{ color: '#f4f4f4' }}>Upload Contract</h2>
                <div className="space-y-4">
                  {loadingError && (
                    <div className="bg-[#a2191f]/20 border border-[#da1e28] rounded-lg p-3 flex items-start gap-2">
                      <div className="text-[#da1e28] font-bold flex-shrink-0">!</div>
                      <p className="text-sm" style={{ color: '#ffb3b8' }}>{loadingError}</p>
                    </div>
                  )}
                  {isLoadingFile && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin w-4 h-4 border-2 border-[#0f62fe] border-t-transparent rounded-full"></div>
                        <p className="text-sm" style={{ color: '#a8a8a8' }}>Processing file...</p>
                      </div>
                      <div className="w-full bg-[#393939] rounded-full h-1 overflow-hidden">
                        <div className="h-full bg-[#0f62fe] animate-pulse" style={{ width: '100%' }}></div>
                      </div>
                    </div>
                  )}
                  <div 
                    className="drop-zone"
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        const event = { target: { files: e.dataTransfer.files } } as any;
                        handleFileUpload(event);
                      }
                    }}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <input
                      type="file"
                      accept=".pdf,.txt,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="block cursor-pointer">
                      <p className="text-sm" style={{ color: '#a8a8a8' }}>Drag and drop your contract here</p>
                      <p className="text-xs mt-2" style={{ color: '#8d8d8d' }}>or click to browse (TXT files recommended)</p>
                    </label>
                  </div>
                  <div className="text-center text-xs" style={{ color: '#6f6f6f' }}>OR</div>
                  <textarea
                    placeholder="Paste your contract text here..."
                    value={contractText}
                    onChange={(e) => setContractText(e.target.value)}
                    className="w-full h-32 p-3 rounded-lg bg-[#161616] border border-[#525252] focus:border-[#0f62fe] focus:outline-none text-sm font-mono resize-none"
                    style={{ color: '#c6c6c6' }}
                  />
                  <button
                    onClick={handleAnalyze}
                    disabled={!contractText.trim() || isAnalyzing}
                    className="w-full btn-primary"
                  >
                    {isAnalyzing ? "Analyzing..." : "Analyze Contract"}
                  </button>
                </div>
              </div>

              {/* Policy Section */}
              <div className="card">
                <h2 className="text-lg font-semibold mb-4" style={{ color: '#f4f4f4' }}>Company Policy</h2>
                <div className="card-content space-y-2">
                  {POLICIES.map((policy) => (
                    <div key={policy.number}>
                      <span className="font-semibold" style={{ color: '#78a9ff' }}>{policy.number}:</span> <span style={{ color: '#c6c6c6' }}>{policy.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Contract & Results */}
          <div className="lg:col-span-2">
            <div className="card overflow-hidden">
              {/* Tabs */}
              <div className="flex" style={{ borderBottom: '1px solid #393939' }}>
                <button
                  onClick={() => setActiveTab("upload")}
                  className={`tab-button ${
                    activeTab === "upload" ? "tab-active" : "tab-inactive"
                  }`}
                >
                  Contract Text
                </button>
                <button
                  onClick={() => setActiveTab("results")}
                  disabled={flaggedClauses.length === 0}
                  className={`tab-button ${
                    activeTab === "results"
                      ? "tab-active"
                      : `tab-inactive ${flaggedClauses.length === 0 ? "disabled:text-slate-600 disabled:cursor-not-allowed" : ""}`
                  }`}
                >
                  Flagged Clauses ({flaggedClauses.length})
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === "upload" ? (
                  <div>
                    {contractText.trim() ? (
                      <div className="rounded p-4 text-sm max-h-96 overflow-y-auto whitespace-pre-wrap font-mono" style={{ backgroundColor: '#161616', color: '#c6c6c6' }}>
                        {contractText}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <p style={{ color: '#a8a8a8' }}>No contract uploaded yet</p>
                        <p className="text-sm mt-2" style={{ color: '#8d8d8d' }}>Upload a contract to get started</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {flaggedClauses.length > 0 ? (
                      flaggedClauses.map((clause, idx) => (
                        <div key={idx} className="violation-box">
                          <div className="flex items-start gap-3">
                            <div className="violation-icon">!</div>
                            <div className="flex-1">
                              <p className="font-semibold mb-2" style={{ color: '#ffb3b8' }}>Policy Violation: {clause.policyNumber}</p>
                              <p className="mb-2" style={{ color: '#c6c6c6' }}>
                                <span className="font-semibold" style={{ color: '#ff8389' }}>Flagged Clause:</span> {clause.text}
                              </p>
                              <p className="text-sm" style={{ color: '#a8a8a8' }}>
                                <span className="font-semibold">Reason:</span> {clause.violation}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <p style={{ color: '#a8a8a8' }}>No results yet</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
