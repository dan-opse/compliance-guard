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
  const [activeTab, setActiveTab] = useState<"upload" | "results">("upload");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setContractText(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleAnalyze = async () => {
    if (!contractText.trim()) {
      alert("Please upload or paste a contract first");
      return;
    }

    setIsAnalyzing(true);
    // TODO: Call backend API to analyze contract
    // For now, showing mock data
    setTimeout(() => {
      setFlaggedClauses([
        {
          text: 'The vendor may terminate this agreement with 30 days notice.',
          policyNumber: "POL-001",
          violation: "Policy requires minimum 90 days termination notice"
        },
        {
          text: 'All data shall be processed in any jurisdiction as determined by vendor.',
          policyNumber: "POL-015",
          violation: "Policy mandates data processing only in approved US regions"
        }
      ]);
      setActiveTab("results");
      setIsAnalyzing(false);
    }, 1500);
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
                  <div 
                    className="drop-zone"
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          setContractText(event.target?.result as string);
                        };
                        reader.readAsText(file);
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
                      <p className="text-xs mt-2" style={{ color: '#8d8d8d' }}>or click to browse (PDF, TXT, DOCX)</p>
                    </label>
                  </div>
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
