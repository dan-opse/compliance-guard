"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { SAMPLE_CONTRACTS } from "@/lib/sample-contracts";
import { POLICY_TEMPLATES, DEFAULT_TEMPLATE, Policy } from "@/lib/policy-templates";

interface FlaggedClause {
  text: string;
  policyNumber: string;
  violation: string;
}

interface AnalysisHistory {
  id: string;
  date: string;
  contractText: string;
  flaggedClauses: FlaggedClause[];
  template: string;
}

export default function Home() {
  const [contractText, setContractText] = useState("");
  const [flaggedClauses, setFlaggedClauses] = useState<FlaggedClause[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"upload" | "results" | "history">("upload");
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStage, setAnalysisStage] = useState("");
  const [analysisCompleted, setAnalysisCompleted] = useState(false);
  
  // Policy management
  const [selectedTemplate, setSelectedTemplate] = useState(DEFAULT_TEMPLATE);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [showPolicyEditor, setShowPolicyEditor] = useState(false);
  
  // Drag & drop state
  const [isDragging, setIsDragging] = useState(false);
  
  // Contract history
  const [contractHistory, setContractHistory] = useState<AnalysisHistory[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<AnalysisHistory | null>(null);

  // Load policy template on mount and when template changes
  useEffect(() => {
    const template = POLICY_TEMPLATES.find(t => t.id === selectedTemplate);
    if (template) {
      setPolicies(template.policies.map(p => ({ ...p, enabled: true })));
    }
  }, [selectedTemplate]);
  
  // Load contract history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('analysisHistory');
    if (saved) {
      setContractHistory(JSON.parse(saved));
    }
  }, []);
  
  // Save analysis to history
  const saveToHistory = (text: string, clauses: FlaggedClause[]) => {
    const newEntry: AnalysisHistory = {
      id: Date.now().toString(),
      date: new Date().toLocaleString(),
      contractText: text,
      flaggedClauses: clauses,
      template: selectedTemplate
    };
    const updated = [newEntry, ...contractHistory].slice(0, 20);
    setContractHistory(updated);
    localStorage.setItem('analysisHistory', JSON.stringify(updated));
  };
  
  // Export policies as JSON
  const exportPolicies = () => {
    const data = JSON.stringify(policies, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `policies-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  // Import policies from JSON
  const importPolicies = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string);
          if (Array.isArray(imported)) {
            setPolicies(imported);
            setSelectedTemplate(''); // Clear template since custom
          }
        } catch (error) {
          alert('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsLoadingFile(true);
      setLoadingError(null);
      
      // Validate file size (max 10MB)
      const MAX_FILE_SIZE = 10 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        setLoadingError("File is too large. Maximum file size is 10MB.");
        setIsLoadingFile(false);
        return;
      }

      const timeoutId = setTimeout(() => {
        setIsLoadingFile(false);
        setLoadingError("File processing timed out. Please try a smaller file.");
      }, 30000);

      try {
        let text = "";
        const isPDF = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
        const isDOCX = file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
                      file.name.toLowerCase().endsWith(".docx");

        // Show that PDF/DOCX are coming soon
        if (isPDF || isDOCX) {
          clearTimeout(timeoutId);
          setLoadingError("PDF and DOCX capabilities coming soon. Please use TXT files for now.");
          setIsLoadingFile(false);
          return;
        }

        // Read as plain text
        console.log(`📄 Processing text file: ${file.name}`);
        const reader = new FileReader();
        text = await new Promise((resolve, reject) => {
          reader.onload = (event) => {
            const result = event.target?.result as string;
            if (!result || !result.trim()) {
              reject(new Error("Text file appears to be empty"));
            } else {
              resolve(result);
            }
          };
          reader.onerror = () => {
            reject(new Error("Failed to read text file"));
          };
          reader.readAsText(file);
        });
        console.log(`✅ Successfully read ${text.length} characters from text file`);

        clearTimeout(timeoutId);
        setContractText(text);
        setLoadingError(null);
        setIsLoadingFile(false);
      } catch (error) {
        clearTimeout(timeoutId);
        const errorMsg = error instanceof Error ? error.message : "Error reading file. Please try a valid text file.";
        console.error("Error reading file:", errorMsg);
        setLoadingError(errorMsg);
        setIsLoadingFile(false);
      }
    }
  };

  const handleAnalyze = async () => {
    if (!contractText.trim()) {
      alert("Please upload or paste a contract first");
      return;
    }
    
    const enabledPolicies = policies.filter(p => p.enabled);
    if (enabledPolicies.length === 0) {
      alert("Please enable at least one policy to check");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisStage("Preparing analysis...");
    setAnalysisCompleted(false);
    
    // More realistic progress simulation
    let currentProgress = 0;
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        // Slow down as we approach completion
        if (prev < 20) return prev + 5;  // Fast start
        if (prev < 50) return prev + 3;  // Medium speed
        if (prev < 85) return prev + 1;  // Slow down
        return prev; // Stop at 85% until actual completion
      });
    }, 1500);
    
    try {
      setAnalysisProgress(10);
      setAnalysisStage("Stage 1: Analyzing contract with Granite AI...");
      
      // Add small delay to show stage update
      await new Promise(resolve => setTimeout(resolve, 500));
      setAnalysisProgress(20);
      const response = await fetch("/api/analyze-contract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contractText,
          policies: enabledPolicies,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze contract");
      }

      setAnalysisProgress(60);
      setAnalysisStage("Stage 2: Verifying with Granite Guardian...");
      
      const data = await response.json();
      const violations = data.flaggedClauses || [];
      setFlaggedClauses(violations);
      
      // Save to history with violations
      saveToHistory(contractText, violations);
      
      clearInterval(progressInterval);
      setAnalysisProgress(100);
      setAnalysisStage("✓ Analysis complete!");
      setAnalysisCompleted(true);
      
      // Wait a moment to show 100% before switching tabs
      setTimeout(() => {
        setActiveTab("results");
        setAnalysisProgress(0);
        setAnalysisStage("");
      }, 800);
    } catch (error) {
      clearInterval(progressInterval);
      console.error("Error analyzing contract:", error);
      alert("Error analyzing contract. Please try again.");
      setAnalysisProgress(0);
      setAnalysisStage("");
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
                      <div className="text-[#da1e28] font-bold shrink-0">!</div>
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
                    className={`drop-zone transition-all ${isDragging ? 'border-[#0f62fe] bg-[#0f62fe]/10' : ''}`}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        const event = { target: { files: e.dataTransfer.files } } as any;
                        handleFileUpload(event);
                      }
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                  >
                    <input
                      type="file"
                      accept=".pdf,.txt,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="block cursor-pointer">
                      <p className="text-sm" style={{ color: isDragging ? '#78a9ff' : '#a8a8a8' }}>
                        {isDragging ? 'Drop file here' : 'Drag and drop your contract here'}
                      </p>
                      <p className="text-xs mt-2" style={{ color: '#8d8d8d' }}>PDF and DOCX capabilities coming soon. Currently TXT files only.</p>
                    </label>
                  </div>
                  
                  {/* Sample Contracts */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold" style={{ color: '#8d8d8d' }}>QUICK START</p>
                    <div className="grid grid-cols-1 gap-2">
                      {SAMPLE_CONTRACTS.map(sample => (
                        <button
                          key={sample.id}
                          onClick={() => setContractText(sample.content)}
                          className="text-left px-3 py-2 rounded-lg text-sm transition-colors"
                          style={{ 
                            backgroundColor: '#262626',
                            border: '1px solid #393939',
                            color: '#c6c6c6'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#353535'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#262626'}
                        >
                          <div className="font-semibold" style={{ color: '#78a9ff' }}>{sample.name}</div>
                          <div className="text-xs mt-1" style={{ color: '#8d8d8d' }}>{sample.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="text-center text-xs" style={{ color: '#6f6f6f' }}>OR</div>
                  
                  {isAnalyzing && (
                    <div className="space-y-2 mb-4 p-3 rounded-lg" style={{ backgroundColor: '#262626' }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="animate-spin w-4 h-4 border-2 border-[#0f62fe] border-t-transparent rounded-full"></div>
                          <p className="text-sm font-medium" style={{ color: '#f4f4f4' }}>{analysisStage}</p>
                        </div>
                        <span className="text-sm font-semibold" style={{ color: '#78a9ff' }}>{Math.round(analysisProgress)}%</span>
                      </div>
                      <div className="w-full bg-[#393939] rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full bg-[#0f62fe] transition-all duration-500 ease-out"
                          style={{ width: `${analysisProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  <textarea
                    placeholder="Paste your contract text here..."
                    value={contractText}
                    onChange={(e) => setContractText(e.target.value)}
                    className="w-full h-96 p-6 rounded-lg bg-white border border-[#e0e0e0] focus:border-[#0f62fe] focus:ring-1 focus:ring-[#0f62fe] focus:outline-none text-base resize-none"
                    style={{ 
                      color: '#161616',
                      lineHeight: '1.6',
                      fontFamily: 'Segoe UI, system-ui, sans-serif',
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#d0d0d0 #f5f5f5'
                    }}
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
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold" style={{ color: '#f4f4f4' }}>Compliance Policies</h2>
                  <button
                    onClick={() => setShowPolicyEditor(!showPolicyEditor)}
                    className="text-xs px-2 py-1 rounded"
                    style={{ backgroundColor: '#262626', color: '#78a9ff', border: '1px solid #393939' }}
                  >
                    {showPolicyEditor ? 'Hide Editor' : 'Edit'}
                  </button>
                </div>
                
                {/* Policy Template Selector */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold mb-2" style={{ color: '#8d8d8d' }}>
                    POLICY TEMPLATE
                  </label>
                  <div className="relative">
                    <select
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-[#0f62fe] to-[#0353e9] border-none text-white font-medium text-sm cursor-pointer appearance-none pr-10 transition-all duration-200 hover:from-[#0353e9] hover:to-[#0043ce] focus:outline-none focus:ring-2 focus:ring-[#78a9ff]"
                      style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                    >
                      {POLICY_TEMPLATES.map(template => (
                        <option key={template.id} value={template.id} className="bg-[#161616] text-[#c6c6c6]">
                          {template.name} ({template.policies.length} policies)
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#ffffff' }}>
                      ▼
                    </div>
                  </div>
                  <p className="text-xs mt-2" style={{ color: '#8d8d8d' }}>
                    {POLICY_TEMPLATES.find(t => t.id === selectedTemplate)?.description}
                  </p>
                </div>
                
                {/* Policy List with Toggles */}
                <div className="card-content space-y-2">
                  {policies.map((policy, index) => (
                    <div key={policy.number} className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={policy.enabled}
                        onChange={(e) => {
                          const updated = [...policies];
                          updated[index].enabled = e.target.checked;
                          setPolicies(updated);
                        }}
                        className="mt-1 w-4 h-4 rounded border-[#525252] text-[#0f62fe] focus:ring-[#0f62fe]"
                        style={{ accentColor: '#0f62fe' }}
                      />
                      <div className="flex-1">
                        <span className="font-semibold" style={{ color: policy.enabled ? '#78a9ff' : '#6f6f6f' }}>
                          {policy.number}:
                        </span>{' '}
                        <span style={{ color: policy.enabled ? '#c6c6c6' : '#6f6f6f' }}>
                          {policy.description}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-2 mt-2 border-t" style={{ borderColor: '#393939' }}>
                    <button
                      onClick={() => setPolicies(policies.map(p => ({ ...p, enabled: true })))}
                      className="text-xs mr-2" style={{ color: '#78a9ff' }}
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => setPolicies(policies.map(p => ({ ...p, enabled: false })))}
                      className="text-xs" style={{ color: '#78a9ff' }}
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                
                {/* Policy Editor (expandable) */}
                {showPolicyEditor && (
                  <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: '#262626', border: '1px solid #393939' }}>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          const newPolicy = {
                            number: `CUSTOM-${policies.length + 1}`,
                            description: "New custom policy",
                            enabled: true
                          };
                          setPolicies([...policies, newPolicy]);
                        }}
                        className="text-sm px-3 py-1 rounded"
                        style={{ backgroundColor: '#0f62fe', color: '#fff' }}
                      >
                        + Add Policy
                      </button>
                      
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={exportPolicies}
                          className="text-xs px-3 py-1 rounded"
                          style={{ backgroundColor: '#262626', color: '#78a9ff', border: '1px solid #393939' }}
                        >
                          Export JSON
                        </button>
                        <label className="text-xs px-3 py-1 rounded cursor-pointer"
                          style={{ backgroundColor: '#262626', color: '#78a9ff', border: '1px solid #393939' }}
                        >
                          Import JSON
                          <input
                            type="file"
                            accept=".json"
                            onChange={importPolicies}
                            className="hidden"
                          />
                        </label>
                      </div>
                      
                      <div className="text-xs space-y-1" style={{ color: '#8d8d8d' }}>
                        <p>• Click checkboxes to enable/disable policies</p>
                        <p>• Add custom policies for your specific needs</p>
                        <p>• Export/import policies to share across teams</p>
                      </div>
                    </div>
                  </div>
                )}
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
                <button
                  onClick={() => setActiveTab("history")}
                  disabled={contractHistory.length === 0}
                  className={`tab-button ${
                    activeTab === "history"
                      ? "tab-active"
                      : `tab-inactive ${contractHistory.length === 0 ? "disabled:text-slate-600 disabled:cursor-not-allowed" : ""}`
                  }`}
                >
                  History ({contractHistory.length})
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === "upload" ? (
                  <div>
                    {contractText.trim() ? (
                      <div className="rounded p-6 text-sm max-h-96 overflow-y-auto" style={{ backgroundColor: '#f5f5f5', color: '#161616', lineHeight: '1.8', border: '1px solid #e0e0e0' }}>
                        {contractText.split('\n').map((line, idx) => (
                          <div key={idx} className="whitespace-pre-wrap">{line}</div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <p style={{ color: '#a8a8a8' }}>No contract uploaded yet</p>
                        <p className="text-sm mt-2" style={{ color: '#8d8d8d' }}>Upload a contract to get started</p>
                      </div>
                    )}
                  </div>
                ) : activeTab === "results" ? (
                  <div className="space-y-4">
                    {flaggedClauses.length > 0 ? (
                      <div className="space-y-6">
                        {/* Contract with highlights */}
                        <div>
                          <p className="text-sm font-semibold mb-3" style={{ color: '#8d8d8d' }}>CONTRACT WITH VIOLATIONS HIGHLIGHTED</p>
                          <div className="rounded p-6 text-sm max-h-64 overflow-y-auto whitespace-pre-wrap" style={{ backgroundColor: '#f5f5f5', color: '#161616', lineHeight: '1.8', border: '1px solid #e0e0e0' }}>
                            {(() => {
                              let highlightedText = contractText;
                              const violations = flaggedClauses.map(c => c.text).sort((a, b) => b.length - a.length);
                              
                              violations.forEach(violationText => {
                                const regex = new RegExp(`(${violationText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                                highlightedText = highlightedText.replace(regex, '<<<HIGHLIGHT>>>$1<<<END_HIGHLIGHT>>>');
                              });
                              
                              return highlightedText.split(/<<<HIGHLIGHT>>>|<<<END_HIGHLIGHT>>>/).map((text, idx) => {
                                if (idx % 2 === 1) {
                                  return <mark key={idx} style={{ backgroundColor: '#ffd666', color: '#161616', fontWeight: 'bold', padding: '2px 4px', borderRadius: '2px' }}>{text}</mark>;
                                }
                                return text;
                              });
                            })()}
                          </div>
                        </div>
                        
                        {/* Violations list */}
                        <div>
                          <p className="text-sm font-semibold mb-3" style={{ color: '#8d8d8d' }}>VIOLATIONS IDENTIFIED</p>
                          {flaggedClauses.map((clause, idx) => (
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
                          ))}
                        </div>
                      </div>
                    ) : analysisCompleted ? (
                      <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: '#24a148' }}>
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <h3 className="text-xl font-semibold mb-2" style={{ color: '#42be65' }}>Contract Approved</h3>
                        <p style={{ color: '#a8a8a8' }}>No policy violations detected. This contract is compliant.</p>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <p style={{ color: '#a8a8a8' }}>No results yet</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {contractHistory.length > 0 ? (
                      <div>
                        <p className="text-sm font-semibold mb-4" style={{ color: '#8d8d8d' }}>ANALYSIS HISTORY</p>
                        <div className="space-y-2">
                          {contractHistory.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => setSelectedHistoryItem(item)}
                              className="w-full text-left p-4 rounded-lg transition-colors"
                              style={{ 
                                backgroundColor: selectedHistoryItem?.id === item.id ? '#0f62fe' : '#262626',
                                border: '1px solid #393939',
                                color: selectedHistoryItem?.id === item.id ? '#fff' : '#c6c6c6'
                              }}
                              onMouseEnter={(e) => {
                                if (selectedHistoryItem?.id !== item.id) {
                                  e.currentTarget.style.backgroundColor = '#353535';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (selectedHistoryItem?.id !== item.id) {
                                  e.currentTarget.style.backgroundColor = '#262626';
                                }
                              }}
                            >
                              <div className="font-semibold text-sm">{item.date}</div>
                              <div className="text-xs mt-1" style={{ color: selectedHistoryItem?.id === item.id ? '#e0e0e0' : '#8d8d8d' }}>
                                {item.flaggedClauses.length} violation{item.flaggedClauses.length !== 1 ? 's' : ''}
                              </div>
                              <div className="text-xs mt-2 line-clamp-2" style={{ color: selectedHistoryItem?.id === item.id ? '#d0d0d0' : '#6f6f6f' }}>
                                {item.contractText.substring(0, 100)}...
                              </div>
                            </button>
                          ))}
                        </div>
                        
                        {selectedHistoryItem && (
                          <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: '#262626', border: '1px solid #393939' }}>
                            <p className="font-semibold mb-3" style={{ color: '#78a9ff' }}>Analysis from {selectedHistoryItem.date}</p>
                            <div className="space-y-3">
                              {selectedHistoryItem.flaggedClauses.length > 0 ? (
                                selectedHistoryItem.flaggedClauses.map((clause, idx) => (
                                  <div key={idx} className="p-3 rounded-lg" style={{ backgroundColor: '#1a1a1a', border: '1px solid #525252' }}>
                                    <p className="font-semibold text-sm mb-1" style={{ color: '#ffb3b8' }}>{clause.policyNumber}</p>
                                    <p className="text-xs mb-2" style={{ color: '#a8a8a8' }}>{clause.text}</p>
                                    <p className="text-xs" style={{ color: '#8d8d8d' }}>Reason: {clause.violation}</p>
                                  </div>
                                ))
                              ) : (
                                <p style={{ color: '#42be65' }}>✓ No violations detected</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <p style={{ color: '#a8a8a8' }}>No analysis history yet</p>
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
