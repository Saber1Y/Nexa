import { useState, useCallback } from "react";
import { Briefcase, FileSearch, Zap, Sparkles, ExternalLink, RotateCcw, ShieldCheck, CreditCard, Activity, Star, Link, Coins, Target, AlertTriangle, Fuel, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import ResumeInput from "@/components/ResumeInput";
import ConsensusLoader from "@/components/ConsensusLoader";
import AuditResults from "@/components/AuditResults";
import BulkAuditView from "@/components/BulkAuditView";
import { useMpp } from "@/hooks/useMpp";
import { useWallet } from "@/hooks/useWallet";
import { generateCertificate } from "@/utils/generateCertificate";

const Audit = () => {
  const [auditMode, setAuditMode] = useState<"single" | "bulk">("single");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [mustHaveSkills, setMustHaveSkills] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [results, setResults] = useState<{
    match_score: number;
    verdict: string;
    seniority: string;
    matched_skills: string[];
    missing_skills: string[];
    explanation: string;
    stellarPaymentHash?: string;
    stellarAttestationHash?: string;
    attestationDigest?: string;
    [key: string]: unknown;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { fetchWithMpp, isPaying, status, txHash: mppTxHash, availableChallenges, setAvailableChallenges } = useMpp();
  const { address, isConnected, hasUsdcTrustline } = useWallet();

  const handleSubmit = useCallback(async () => {
    if (!jobTitle || !resumeText) return;
    setLoading(true);
    setError(null);
    setResults(null);
    setTxHash(null);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3402";
      const data = await fetchWithMpp(`${apiUrl}/api/audit`, address || "", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle, jobDescription, mustHaveSkills, resumeText }),
      });
      if (data?.paymentRequired) { setLoading(false); return; }
      if (data.success) {
        setResults(data.results);
        setTxHash(data.results.txHash || "Finalized on GenLayer");
      } else {
        throw new Error(data.error || "Audit failed");
      }
    } catch (e: unknown) {
      setError((e as Error)?.message || "Audit process failed");
    } finally {
      setLoading(false);
    }
  }, [jobTitle, jobDescription, mustHaveSkills, resumeText, fetchWithMpp, address]);

  const canSubmit = jobTitle.trim() && resumeText.trim() && !loading && !isPaying && isConnected && address;

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
            <span style={{ color: "var(--neon-green)" }}>&gt;</span> Execute autonomous AI audits. Pay with <span className="text-foreground font-bold">USDC or XLM on Stellar</span> to trigger consensus on GenLayer.
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
                <ShieldCheck className="w-3 h-3" style={{ color: "var(--neon-green)" }} /> Agent Mode: Bridge handles autonomous payments.
              </p>
              {error && (
                <p className="text-xs p-2 border cyber-chamfer-sm" style={{ color: "var(--neon-red)", borderColor: "rgba(255,51,102,0.2)", background: "rgba(255,51,102,0.05)" }}>
                  {error}
                </p>
              )}
            </div>
          </>
        )}

        {/* Trustline Warning */}
        {isConnected && hasUsdcTrustline === false && !availableChallenges && !results && (
          <div className="flex items-center gap-3 p-4 border cyber-chamfer-sm animate-in fade-in duration-300" style={{ borderColor: "rgba(0,212,255,0.3)", background: "rgba(0,212,255,0.03)", color: "var(--neon-cyan)" }}>
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <div className="text-xs tracking-wide">
              <span className="font-bold">USDC Trustline Missing.</span>{" "}
              You can still pay with XLM, or{" "}
              <a href="https://laboratory.stellar.org/#trust?network=test" target="_blank" rel="noopener noreferrer" className="font-bold underline hover:no-underline">add trustline →</a>
            </div>
          </div>
        )}

        {/* Currency Selection */}
        {availableChallenges && (
          <div className="cyber-card p-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ borderColor: "var(--neon-green)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center border" style={{ borderColor: "var(--neon-green)", boxShadow: "0 0 6px rgba(0,255,136,0.15)" }}>
                <Coins className="w-6 h-6" style={{ color: "var(--neon-green)" }} />
              </div>
              <div>
                <h3 className="text-sm font-display font-bold uppercase tracking-wider">Select Payment</h3>
                <p className="text-[10px] text-muted-foreground tracking-wide">MPP micro-payment required</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableChallenges.map((challenge, idx) => {
                const { amount, currency } = challenge.request as { amount: string; currency: string };
                const isUsdc = currency === "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";
                const assetName = isUsdc ? "USDC" : "XLM";
                const humanAmount = (Number(amount) / 1e7).toFixed(2);
                const neon = isUsdc ? "var(--neon-cyan)" : "var(--neon-green)";

                return (
                  <button
                    key={idx}
                    onClick={async () => {
                      setAvailableChallenges(null);
                      setLoading(true);
                      setError(null);
                      try {
                        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3402";
                        const data = await fetchWithMpp(`${apiUrl}/api/audit`, address || "", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ jobTitle, jobDescription, mustHaveSkills, resumeText }),
                        }, challenge);
                        if (data?.success) {
                          setResults(data.results);
                          setTxHash(data.results.txHash || "Finalized on GenLayer");
                        }
                      } catch (e: unknown) {
                        setError((e as Error)?.message || "Payment failed");
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="flex items-center justify-between p-4 border transition-all group text-left cyber-chamfer-sm"
                    style={{ borderColor: `${neon}30`, background: `${neon}05` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 flex items-center justify-center border" style={{ borderColor: neon, color: neon }}>
                        {isUsdc ? <span className="text-[10px] font-display font-bold">U</span> : <Target className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-display font-bold uppercase tracking-wider">{assetName}</p>
                          {isUsdc && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 border text-[7px] font-bold uppercase tracking-wider" style={{ borderColor: "rgba(0,255,136,0.3)", color: "var(--neon-green)" }}>
                              <Fuel className="w-2.5 h-2.5" /> Zero Gas
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground tracking-wide">Stellar {isUsdc ? 'USDC SAC · Fee Sponsored' : 'Native Asset'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-display font-bold" style={{ color: neon }}>{humanAmount}</p>
                      <p className="text-[8px] text-muted-foreground uppercase tracking-wider">Per Audit</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground text-[10px] uppercase tracking-wider"
              onClick={() => { setAvailableChallenges(null); setLoading(false); }}
            >
              Cancel
            </Button>
          </div>
        )}

        {/* MPP Handshake Monitor */}
        {(loading || isPaying) && (
          <div className="cyber-card p-4 space-y-3 animate-pulse" style={{ borderColor: "rgba(0,255,136,0.2)", background: "rgba(0,255,136,0.02)" }}>
            <h4 className="text-[9px] font-display font-bold uppercase tracking-[0.2em] flex items-center gap-2" style={{ color: "var(--neon-green)" }}>
              <Activity className="w-3 h-3" /> Nexa Protocol Handshake
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">&gt; Status:</span>
                <span className="font-mono text-foreground">{status || "Connecting to Bridge..."}</span>
              </div>
              {isPaying && (
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--neon-cyan)" }}>
                  <CreditCard className="w-3 h-3" /> ACTION REQUIRED: SIGN IN FREIGHTER
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading / Results */}
        {loading && (
          <div className="space-y-4">
            <ConsensusLoader genLayerHash={txHash || mppTxHash} statusMessage={status} />
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
                &gt; Triple-verified across two blockchains. Click any link to verify.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Stellar Payment */}
                {results.stellarPaymentHash ? (
                  <a href={`https://stellar.expert/explorer/testnet/tx/${results.stellarPaymentHash}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2.5 p-3 border transition-all group cyber-chamfer-sm" style={{ borderColor: "rgba(0,255,136,0.15)" }}>
                    <div className="w-8 h-8 flex items-center justify-center border" style={{ borderColor: "rgba(0,255,136,0.2)" }}>
                      <Star className="w-4 h-4" style={{ color: "var(--neon-green)" }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-display font-bold uppercase tracking-wider">{String(results.paymentAssetLabel || "Stellar Payment")}</p>
                      <p className="text-[9px] text-muted-foreground font-mono truncate">{String(results.stellarPaymentHash).slice(0, 16)}…</p>
                    </div>
                    <ExternalLink className="w-3 h-3 text-muted-foreground ml-auto shrink-0" />
                  </a>
                ) : (
                  <div className="flex items-center gap-2.5 p-3 border cyber-chamfer-sm" style={{ borderColor: "rgba(0,255,136,0.15)" }}>
                    <div className="w-8 h-8 flex items-center justify-center border" style={{ borderColor: "rgba(0,255,136,0.2)" }}>
                      <Star className="w-4 h-4" style={{ color: "var(--neon-green)" }} />
                    </div>
                    <div>
                      <p className="text-[10px] font-display font-bold uppercase tracking-wider">Stellar Payment</p>
                      <p className="text-[9px] font-bold" style={{ color: "var(--neon-green)" }}>✓ Verified via MPP</p>
                    </div>
                  </div>
                )}

                {/* Attestation */}
                {results.stellarAttestationHash && (
                  <a href={`https://stellar.expert/explorer/testnet/tx/${results.stellarAttestationHash}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2.5 p-3 border transition-all group cyber-chamfer-sm" style={{ borderColor: "rgba(0,212,255,0.15)" }}>
                    <div className="w-8 h-8 flex items-center justify-center border" style={{ borderColor: "rgba(0,212,255,0.2)" }}>
                      <Link className="w-4 h-4" style={{ color: "var(--neon-cyan)" }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-display font-bold uppercase tracking-wider">Attestation</p>
                      <p className="text-[9px] text-muted-foreground font-mono truncate">{String(results.stellarAttestationHash).slice(0, 16)}…</p>
                    </div>
                    <ExternalLink className="w-3 h-3 text-muted-foreground ml-auto shrink-0" />
                  </a>
                )}

                {/* GenLayer */}
                {txHash && (
                  <a href={`https://explorer-studio.genlayer.com/transactions/${txHash}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2.5 p-3 border transition-all group cyber-chamfer-sm" style={{ borderColor: "rgba(255,0,255,0.15)" }}>
                    <div className="w-8 h-8 flex items-center justify-center border" style={{ borderColor: "rgba(255,0,255,0.2)" }}>
                      <Zap className="w-4 h-4" style={{ color: "var(--neon-magenta)" }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-display font-bold uppercase tracking-wider">AI Consensus</p>
                      <p className="text-[9px] text-muted-foreground font-mono truncate">{txHash.slice(0, 16)}…</p>
                    </div>
                    <ExternalLink className="w-3 h-3 text-muted-foreground ml-auto shrink-0" />
                  </a>
                )}
              </div>

              {results.attestationDigest && (
                <div className="pt-2 border-t border-border/50">
                  <p className="text-[9px] text-muted-foreground tracking-wide">
                    <span className="font-bold">&gt; Attestation Digest:</span>{" "}
                    <code className="bg-background px-1.5 py-0.5 text-[9px] font-mono break-all" style={{ color: "var(--neon-green)" }}>{String(results.attestationDigest)}</code>
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-center gap-3">
              <Button
                size="lg"
                onClick={() => { if (results) generateCertificate(results, jobTitle, txHash || undefined); }}
                className="font-display text-[10px] font-bold uppercase tracking-[0.15em] px-6 border-2 transition-all hover:neon-glow-cyan cyber-chamfer-sm"
                style={{ borderColor: "var(--neon-cyan)", color: "var(--neon-cyan)", background: "transparent" }}
              >
                <FileDown className="w-4 h-4 mr-2" /> Download Certificate
              </Button>
              <Button
                size="lg"
                onClick={() => { setJobTitle(""); setJobDescription(""); setMustHaveSkills(""); setResumeText(""); setResults(null); setTxHash(null); setError(null); }}
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
          <div><span style={{ color: "var(--neon-green)", opacity: 0.5 }}>&gt;</span> Nexa Bridge · Settlement by Stellar · Audit by GenLayer</div>
          <div className="flex gap-4">
            <a href="https://stellar.org" target="_blank" className="hover:text-foreground">Stellar</a>
            <a href="https://genlayer.com" target="_blank" className="hover:text-foreground">GenLayer</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Audit;
