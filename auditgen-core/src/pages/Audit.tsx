import { useState, useCallback } from "react";
import { Briefcase, FileSearch, Zap, Sparkles, ExternalLink, RotateCcw, ShieldCheck, CreditCard, Activity, Star, FileDown, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import ResumeInput from "@/components/ResumeInput";
import ConsensusLoader from "@/components/ConsensusLoader";
import AuditResults from "@/components/AuditResults";
import BulkAuditView from "@/components/BulkAuditView";
import { useX402Bot, type AuditScreeningResults, type AuditSuccessResponse, type X402Stage } from "@/hooks/useX402Bot";
import { useWallet } from "@/hooks/useWallet";
import { explorerTxUrl, formatUsdtAmount } from "@/utils/botChain";
import { generateCertificate } from "@/utils/generateCertificate";

const stageHints: Record<X402Stage, string> = {
  quote: "Requesting x402 quote from the audit service...",
  chain: "Switching wallet to BOT Chain (968)...",
  balance: "Verifying tUSDT balance and Permit2 allowance...",
  approve: "ACTION REQUIRED: APPROVE tUSDT IN YOUR WALLET",
  sign: "ACTION REQUIRED: SIGN PAYMENT IN YOUR WALLET",
  settle: "Submitting payment for on-chain settlement...",
  audit: "AI audit complete",
};

const Audit = () => {
  const [auditMode, setAuditMode] = useState<"single" | "bulk">("single");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [mustHaveSkills, setMustHaveSkills] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [loading, setLoading] = useState(false);
  const [payment, setPayment] = useState<AuditSuccessResponse["payment"] | null>(null);
  const [receipt, setReceipt] = useState<AuditSuccessResponse["receipt"] | null>(null);
  const [consensusTx, setConsensusTx] = useState<string | null>(null);
  const [screeningId, setScreeningId] = useState<string | null>(null);
  const [results, setResults] = useState<AuditScreeningResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { runAudit, isPaying, status, setStatus, stage } = useX402Bot();
  const { address, isConnected } = useWallet();

  const handleSubmit = useCallback(async () => {
    if (!jobTitle || !resumeText || !address) return;
    setLoading(true);
    setError(null);
    setResults(null);
    setPayment(null);
    setReceipt(null);
    setConsensusTx(null);
    setScreeningId(null);
    try {
      const apiUrl =
        import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:3402";
      const data = await runAudit(`${apiUrl}/api/audit`, address, {
        jobTitle,
        jobDescription,
        mustHaveSkills,
        resumeText,
      });
      setResults(data.results);
      setPayment(data.payment ?? null);
      setReceipt(data.receipt ?? null);
      setConsensusTx(data.execution?.tx ?? null);
      setScreeningId(data.screeningId ?? null);
      setStatus(null);
    } catch (e: unknown) {
      setError((e as Error)?.message || "Audit process failed");
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [jobTitle, jobDescription, mustHaveSkills, resumeText, runAudit, address, setStatus]);

  const canSubmit =
    jobTitle.trim() && resumeText.trim() && !loading && !isPaying && isConnected && address;

  const inputClass = "w-full bg-background border border-border px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-neon-green transition-all font-mono tracking-wide cyber-chamfer-sm";

  return (
    <div className="min-h-screen bg-background circuit-bg">
      <Navbar />
      <main className="container mx-auto px-4 py-8 pt-24 max-w-5xl space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-5xl font-black font-display uppercase tracking-wider gradient-text">
            Nexa AI Bridge
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-xs leading-relaxed tracking-wide">
            <span style={{ color: "var(--neon-green)" }}>&gt;</span> Execute autonomous AI audits. Pay with <span className="text-foreground font-bold">0.10 tUSDT on BOT Chain</span> (x402 + Permit2) to trigger the AI screening service.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex justify-center mb-4">
          <div className="bg-card border border-border p-1 flex items-center gap-1 cyber-chamfer-sm">
            <button
              onClick={() => setAuditMode("single")}
              className={`px-6 py-2 text-[10px] font-display font-bold uppercase tracking-[0.15em] transition-all cyber-chamfer-sm ${
                auditMode === "single"
                  ? ""
                  : "text-muted-foreground hover:text-foreground"
              }`}
              style={auditMode === "single" ? { background: "var(--neon-green)", color: "#0a0a0f" } : undefined}
            >
              Single Candidate
            </button>
            <button
              onClick={() => setAuditMode("bulk")}
              className={`px-6 py-2 text-[10px] font-display font-bold uppercase tracking-[0.15em] transition-all flex items-center gap-2 cyber-chamfer-sm ${
                auditMode === "bulk"
                  ? ""
                  : "text-muted-foreground hover:text-foreground"
              }`}
              style={auditMode === "bulk" ? { background: "var(--neon-green)", color: "#0a0a0f" } : undefined}
            >
              Bulk Registry
              <span className="px-1.5 py-0.5 text-[7px] uppercase tracking-wider border" style={{ borderColor: auditMode === "bulk" ? "#0a0a0f" : "var(--neon-green)", color: auditMode === "bulk" ? "#0a0a0f" : "var(--neon-green)" }}>Dev</span>
            </button>
          </div>
        </div>

        {auditMode === "bulk" ? (
          <BulkAuditView />
        ) : (
          <>
            {/* Job Details */}
            <div className="cyber-card p-6 space-y-4">
              <h3 className="text-xs font-display font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4" style={{ color: "var(--neon-green)" }} /> Job Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-label text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-1 block">&gt; Job Title *</label>
                  <input className={inputClass} placeholder="e.g. Senior Frontend Engineer" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} style={{ caretColor: "var(--neon-green)" }} />
                </div>
                <div>
                  <label className="font-label text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-1 block">&gt; Must-Have Skills</label>
                  <input className={inputClass} placeholder="e.g. React, TypeScript, Node.js" value={mustHaveSkills} onChange={(e) => setMustHaveSkills(e.target.value)} style={{ caretColor: "var(--neon-green)" }} />
                </div>
              </div>
              <div>
                <label className="font-label text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-1 block">&gt; Job Description</label>
                <textarea className={`${inputClass} resize-none`} rows={3} placeholder="Paste the job description here..." value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} style={{ caretColor: "var(--neon-green)" }} />
              </div>
            </div>

            {/* Resume Input */}
            <div className="space-y-3">
              <h3 className="text-xs font-display font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <FileSearch className="w-4 h-4" style={{ color: "var(--neon-cyan)" }} /> Resume / CV
              </h3>
              <ResumeInput resumeText={resumeText} onResumeTextChange={setResumeText} />
            </div>

            {/* Submit */}
            <div className="flex flex-col items-center gap-3">
              <Button
                size="lg"
                disabled={!canSubmit}
                onClick={handleSubmit}
                className="font-display text-[10px] font-bold uppercase tracking-[0.15em] px-8 py-3 border-2 transition-all duration-150 hover:neon-glow-lg cyber-chamfer disabled:opacity-30"
                style={{ borderColor: "var(--neon-green)", color: "#0a0a0f", background: "var(--neon-green)" }}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Run Decentralized AI Audit
              </Button>
              <p className="text-[9px] text-muted-foreground italic tracking-wide flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" style={{ color: "var(--neon-green)" }} /> 0.10 tUSDT per audit · Permit2 signature, no separate approvals.
              </p>
              {error && (
                <p className="text-xs p-2 border cyber-chamfer-sm" style={{ color: "var(--neon-red)", borderColor: "rgba(255,51,102,0.2)", background: "rgba(255,51,102,0.05)" }}>
                  {error}
                </p>
              )}
            </div>
          </>
        )}

        {/* Insufficient-funds hint */}
        {isConnected && address && !results && !isPaying && (
          <div className="flex items-center gap-3 p-4 border cyber-chamfer-sm animate-in fade-in duration-300" style={{ borderColor: "rgba(0,212,255,0.3)", background: "rgba(0,212,255,0.03)", color: "var(--neon-cyan)" }}>
            <Coins className="w-5 h-5 flex-shrink-0" />
            <div className="text-xs tracking-wide">
              <span className="font-bold">Wallet connected.</span>{" "}
              Each audit costs <span className="font-bold">0.10 tUSDT</span> on BOT Chain testnet - keep enough balance plus a little tBOT for gas.
            </div>
          </div>
        )}

        {/* x402 Payment Monitor */}
        {(loading || isPaying) && (
          <div className="cyber-card p-4 space-y-3 animate-pulse" style={{ borderColor: "rgba(0,255,136,0.2)", background: "rgba(0,255,136,0.02)" }}>
            <h4 className="text-[9px] font-display font-bold uppercase tracking-[0.2em] flex items-center gap-2" style={{ color: "var(--neon-green)" }}>
              <Activity className="w-3 h-3" /> Nexa x402 Payment Flow
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">&gt; Status:</span>
                <span className="font-mono text-foreground">{status || "Connecting to Bridge..."}</span>
              </div>
              {stage && isPaying && (
                <div
                  className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: stage === "approve" || stage === "sign" ? "var(--neon-magenta)" : "var(--neon-cyan)" }}
                >
                  <CreditCard className="w-3 h-3" /> {stageHints[stage]}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading / Results */}
        {loading && (
          <div className="space-y-4">
            <ConsensusLoader genLayerHash={consensusTx} statusMessage={status} />
          </div>
        )}
        {results && !loading && (
          <div className="space-y-6">
            <AuditResults data={results} />

            {/* Onchain Verification */}
            <div className="cyber-card p-5 space-y-4" style={{ borderColor: "rgba(0,255,136,0.15)" }}>
              <h4 className="text-[9px] font-display font-bold uppercase tracking-[0.2em] flex items-center gap-2" style={{ color: "var(--neon-green)" }}>
                <ShieldCheck className="w-4 h-4" /> Onchain Verification
              </h4>
              <p className="text-[10px] text-muted-foreground tracking-wide">
                &gt; Settlement, receipt and consensus records. Click any link to verify.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* tUSDT Payment */}
                {payment ? (
                  <a href={explorerTxUrl(payment.transaction)} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2.5 p-3 border transition-all group cyber-chamfer-sm" style={{ borderColor: "rgba(0,255,136,0.15)" }}>
                    <div className="w-8 h-8 flex items-center justify-center border" style={{ borderColor: "rgba(0,255,136,0.2)" }}>
                      <Star className="w-4 h-4" style={{ color: "var(--neon-green)" }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-display font-bold uppercase tracking-wider">tUSDT Payment</p>
                      <p className="text-[9px] text-muted-foreground font-mono truncate">{formatUsdtAmount(payment.amount)} tUSDT · {payment.transaction.slice(0, 12)}…</p>
                    </div>
                    <ExternalLink className="w-3 h-3 text-muted-foreground ml-auto shrink-0" />
                  </a>
                ) : (
                  <div className="flex items-center gap-2.5 p-3 border cyber-chamfer-sm" style={{ borderColor: "rgba(0,255,136,0.15)" }}>
                    <div className="w-8 h-8 flex items-center justify-center border" style={{ borderColor: "rgba(0,255,136,0.2)" }}>
                      <Star className="w-4 h-4" style={{ color: "var(--neon-green)" }} />
                    </div>
                    <div>
                      <p className="text-[10px] font-display font-bold uppercase tracking-wider">tUSDT Payment</p>
                      <p className="text-[9px] font-bold" style={{ color: "var(--neon-green)" }}>✓ Settled on BOT Chain</p>
                    </div>
                  </div>
                )}

                {/* Result Receipt */}
                {receipt && receipt.tx ? (
                  <a href={explorerTxUrl(receipt.tx)} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2.5 p-3 border transition-all group cyber-chamfer-sm" style={{ borderColor: "rgba(0,212,255,0.15)" }}>
                    <div className="w-8 h-8 flex items-center justify-center border" style={{ borderColor: "rgba(0,212,255,0.2)" }}>
                      <Star className="w-4 h-4" style={{ color: "var(--neon-cyan)" }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-display font-bold uppercase tracking-wider">Result Receipt</p>
                      <p className="text-[9px] text-muted-foreground font-mono truncate">{receipt.resultHash.slice(0, 14)}…</p>
                    </div>
                    <ExternalLink className="w-3 h-3 text-muted-foreground ml-auto shrink-0" />
                  </a>
                ) : (
                  <div className="flex items-center gap-2.5 p-3 border cyber-chamfer-sm" style={{ borderColor: "rgba(0,212,255,0.15)" }}>
                    <div className="w-8 h-8 flex items-center justify-center border" style={{ borderColor: "rgba(0,212,255,0.2)" }}>
                      <Star className="w-4 h-4" style={{ color: "var(--neon-cyan)" }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-display font-bold uppercase tracking-wider">Result Receipt</p>
                      <p className="text-[9px] font-bold truncate" style={{ color: "var(--neon-cyan)" }}>
                        {receipt?.recorded ? "✓ Recorded on-chain" : "✓ Signed receipt issued"}
                      </p>
                    </div>
                  </div>
                )}

                {/* GenLayer Consensus */}
                {consensusTx ? (
                  <a href={`https://explorer-studio.genlayer.com/transactions/${consensusTx}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2.5 p-3 border transition-all group cyber-chamfer-sm" style={{ borderColor: "rgba(255,0,255,0.15)" }}>
                    <div className="w-8 h-8 flex items-center justify-center border" style={{ borderColor: "rgba(255,0,255,0.2)" }}>
                      <Zap className="w-4 h-4" style={{ color: "var(--neon-magenta)" }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-display font-bold uppercase tracking-wider">AI Consensus</p>
                      <p className="text-[9px] text-muted-foreground font-mono truncate">{consensusTx.slice(0, 16)}…</p>
                    </div>
                    <ExternalLink className="w-3 h-3 text-muted-foreground ml-auto shrink-0" />
                  </a>
                ) : (
                  <div className="flex items-center gap-2.5 p-3 border cyber-chamfer-sm" style={{ borderColor: "rgba(255,0,255,0.15)" }}>
                    <div className="w-8 h-8 flex items-center justify-center border" style={{ borderColor: "rgba(255,0,255,0.2)" }}>
                      <Zap className="w-4 h-4" style={{ color: "var(--neon-magenta)" }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-display font-bold uppercase tracking-wider">AI Screening</p>
                      <p className="text-[9px] font-bold truncate" style={{ color: "var(--neon-magenta)" }}>
                        {String(results.confidence != null ? `Confidence ${Math.round(Number(results.confidence) * 100)}%` : "Completed")}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {(receipt?.resultHash || results) && (
                <div className="pt-2 border-t border-border/50">
                  <p className="text-[9px] text-muted-foreground tracking-wide">
                    <span className="font-bold">&gt; Result Hash:</span>{" "}
                    <code className="bg-background px-1.5 py-0.5 text-[9px] font-mono break-all" style={{ color: "var(--neon-green)" }}>
                      {String(receipt?.resultHash || "n/a")}
                    </code>
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-center gap-3">
              <Button
                size="lg"
                onClick={() => { if (results) generateCertificate(results, jobTitle, { screeningId: screeningId ?? undefined, paymentTx: payment?.transaction, receiptTx: receipt?.tx, resultHash: receipt?.resultHash, consensusTx: consensusTx ?? undefined }); }}
                className="font-display text-[10px] font-bold uppercase tracking-[0.15em] px-6 border-2 transition-all hover:neon-glow-cyan cyber-chamfer-sm"
                style={{ borderColor: "var(--neon-cyan)", color: "var(--neon-cyan)", background: "transparent" }}
              >
                <FileDown className="w-4 h-4 mr-2" /> Download Certificate
              </Button>
              <Button
                size="lg"
                onClick={() => { setJobTitle(""); setJobDescription(""); setMustHaveSkills(""); setResumeText(""); setResults(null); setPayment(null); setReceipt(null); setConsensusTx(null); setScreeningId(null); setError(null); }}
                className="font-display text-[10px] font-bold uppercase tracking-[0.15em] px-6 border-2 transition-all hover:neon-glow cyber-chamfer-sm"
                style={{ borderColor: "var(--neon-green)", color: "var(--neon-green)", background: "transparent" }}
              >
                <RotateCcw className="w-4 h-4 mr-2" /> New Review
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t py-8 mt-12" style={{ borderColor: "rgba(0,255,136,0.1)" }}>
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-muted-foreground tracking-[0.15em] uppercase">
          <div><span style={{ color: "var(--neon-green)", opacity: 0.5 }}>&gt;</span> Nexa Bridge · Settlement by BOT Chain · Audit by GenLayer</div>
          <div className="flex gap-4">
            <a href="https://scan.bohr.life" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">BOT Scan</a>
            <a href="https://genlayer.com" target="_blank" className="hover:text-foreground">GenLayer</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Audit;
