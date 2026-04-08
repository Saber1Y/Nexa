import { useState, useCallback } from "react";
import { Briefcase, FileSearch, Zap, Sparkles, ExternalLink, RotateCcw, ShieldCheck, CreditCard, Activity, Star, Link, Coins, Target, AlertTriangle, Fuel } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import ResumeInput from "@/components/ResumeInput";
import ConsensusLoader from "@/components/ConsensusLoader";
import AuditResults from "@/components/AuditResults";
import BulkAuditView from "@/components/BulkAuditView";
import { useMpp } from "@/hooks/useMpp";
import { useWallet } from "@/hooks/useWallet";

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

  const { 
    fetchWithMpp, 
    isPaying, 
    status, 
    txHash: mppTxHash, 
    availableChallenges, 
    setAvailableChallenges 
  } = useMpp();
  const { address, isConnected, hasUsdcTrustline } = useWallet();

  const handleSubmit = useCallback(async () => {
    if (!jobTitle || !resumeText) return;
    setLoading(true);
    setError(null);
    setResults(null);
    setTxHash(null);

    try {
      // Call the Nexa Bridge instead of direct GenLayer
      const data = await fetchWithMpp("http://localhost:3402/api/audit", address || "", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle,
          jobDescription,
          mustHaveSkills,
          resumeText,
        }),
      });

      // If the hook detected multiple payment methods, it returns
      // { paymentRequired: true } and populates availableChallenges.
      // We stop loading so the currency selection UI can render.
      if (data?.paymentRequired) {
        setLoading(false);
        return;
      }

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 pt-24 max-w-5xl space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest mx-auto">
            <Zap className="w-3 h-3" /> Stellar ↔ GenLayer Protocol
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold gradient-text glow-text font-serif">
            Nexa AI Bridge
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm leading-relaxed">
            Execute autonomous AI audits across chain rails. Pay with <span className="text-foreground font-semibold">USDC on Stellar</span> to trigger <span className="text-foreground font-semibold">Consensus on GenLayer</span>.
          </p>
        </div>

        {/* Audit Mode Switcher */}
        <div className="flex justify-center mb-4">
          <div className="bg-secondary/50 p-1 rounded-xl border border-border flex items-center gap-1 group">
            <button
              onClick={() => setAuditMode("single")}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                auditMode === "single" 
                  ? "bg-primary text-primary-foreground shadow-lg" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Single Candidate
            </button>
            <button
              onClick={() => setAuditMode("bulk")}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                auditMode === "bulk" 
                  ? "bg-primary text-primary-foreground shadow-lg" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Bulk Registry
              <div className="px-1.5 py-0.5 rounded bg-primary-foreground/20 text-[8px] uppercase tracking-tighter">In Dev</div>
            </button>
          </div>
        </div>

        {auditMode === "bulk" ? (
          <BulkAuditView />
        ) : (
          <>
            {/* Job Details */}
            <div className="glass-card p-6 space-y-4">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" /> Job Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Job Title *</label>
                  <input
                    className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="e.g. Senior Frontend Engineer"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Must-Have Skills</label>
                  <input
                    className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="e.g. React, TypeScript, Node.js"
                    value={mustHaveSkills}
                    onChange={(e) => setMustHaveSkills(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Job Description</label>
                <textarea
                  className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                  rows={3}
                  placeholder="Paste the job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
              </div>
            </div>

            {/* Resume Input */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <FileSearch className="w-4 h-4 text-primary" /> Resume / CV
              </h3>
              <ResumeInput resumeText={resumeText} onResumeTextChange={setResumeText} />
            </div>

            {/* Submit */}
            <div className="flex flex-col items-center gap-3">
              <Button
                size="lg"
                disabled={!canSubmit}
                onClick={handleSubmit}
                className="gradient-primary text-primary-foreground font-semibold px-8 py-3 text-base hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Run Decentralized AI Audit
              </Button>
              <p className="text-xs text-muted-foreground italic flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Agent Mode: Bridge will handle autonomous payments.
              </p>
              {error && (
                <p className="text-sm text-destructive font-medium bg-destructive/5 p-2 rounded border border-destructive/10">{error}</p>
              )}
            </div>
          </>
        )}

        {/* Trustline Warning */}
        {isConnected && hasUsdcTrustline === false && !availableChallenges && !results && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 animate-in fade-in duration-300">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <div className="text-sm">
              <span className="font-semibold">USDC Trustline Missing.</span>{" "}
              You can still pay with XLM, or{" "}
              <a href="https://laboratory.stellar.org/#trust?network=test" target="_blank" rel="noopener noreferrer" className="font-bold underline hover:no-underline">
                add trustline →
              </a>
            </div>
          </div>
        )}

        {/* Currency Selection UI */}
        {availableChallenges && (
          <div className="glass-card p-6 space-y-4 border-primary animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Coins className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Select Payment Method</h3>
                <p className="text-sm text-muted-foreground">The Nexa Bridge requires a micro-payment via MPP.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableChallenges.map((challenge, idx) => {
                const { amount, currency } = challenge.request as { amount: string; currency: string };
                const isUsdc = currency === "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";
                const assetName = isUsdc ? "USDC" : "XLM";
                const humanAmount = (Number(amount) / 1e7).toFixed(2);

                return (
                  <button
                    key={idx}
                    onClick={async () => {
                      setAvailableChallenges(null);
                      setLoading(true);
                      setError(null);
                      try {
                        const data = await fetchWithMpp("http://localhost:3402/api/audit", address || "", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            jobTitle,
                            jobDescription,
                            mustHaveSkills,
                            resumeText,
                          }),
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
                    className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border hover:border-primary hover:bg-primary/5 transition-all group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isUsdc ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'}`}>
                        {isUsdc ? <div className="text-[10px] font-bold">U</div> : <Target className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-foreground">{assetName}</p>
                          {isUsdc && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/30 text-[9px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">
                              <Fuel className="w-2.5 h-2.5" /> Zero Gas
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">Stellar {isUsdc ? 'USDC SAC · Fee Sponsored' : 'Native Asset'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono font-bold text-primary">{humanAmount}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Per Audit</p>
                    </div>
                  </button>
                );
              })}
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-muted-foreground text-xs"
              onClick={() => {
                setAvailableChallenges(null);
                setLoading(false);
              }}
            >
              Cancel Audit
            </Button>
          </div>
        )}

        {/* MPP Handshake Monitor */}
        {(loading || isPaying) && (
          <div className="glass-card p-4 space-y-3 border-primary/20 bg-primary/5 animate-pulse">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
              <Activity className="w-3 h-3" /> Nexa Protocol Handshake
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-mono text-foreground">{status || "Connecting to Bridge..."}</span>
              </div>
              {isPaying && (
                <div className="flex items-center gap-2 text-xs text-amber-500 font-medium">
                  <CreditCard className="w-3 h-3" /> ACTION REQUIRED: PLEASE SIGN IN FREIGHTER
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading / Results */}
        {loading && (
          <div className="space-y-4">
            <ConsensusLoader />
            {txHash && (
              <div className="text-center">
                <a
                  href={`https://explorer-studio.genlayer.com/transactions/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Track on GenLayer Explorer
                </a>
              </div>
            )}
          </div>
        )}
        {results && !loading && (
          <div className="space-y-6">
            <AuditResults data={results} />

            {/* Onchain Verification Panel */}
            <div className="glass-card p-5 space-y-4 border-primary/20">
              <h4 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Onchain Verification
              </h4>
              <p className="text-xs text-muted-foreground">
                Every audit is triple-verified across two blockchains. Click any link to verify independently.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Stellar Payment */}
                {results.stellarPaymentHash ? (
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${results.stellarPaymentHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 p-3 rounded-lg bg-secondary/50 border border-border hover:border-primary/40 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                      <Star className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground">{results.paymentAssetLabel || "Stellar Payment"}</p>
                      <p className="text-[10px] text-muted-foreground font-mono truncate">
                        {String(results.stellarPaymentHash).slice(0, 16)}…
                      </p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground ml-auto shrink-0 group-hover:text-primary transition-colors" />
                  </a>
                ) : (
                  <div className="flex items-center gap-2.5 p-3 rounded-lg bg-secondary/50 border border-emerald-500/20">
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                      <Star className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground">Stellar Payment</p>
                      <p className="text-[10px] text-emerald-500 font-semibold">✓ Verified via MPP</p>
                    </div>
                  </div>
                )}

                {/* Stellar Attestation */}
                {results.stellarAttestationHash && (
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${results.stellarAttestationHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 p-3 rounded-lg bg-secondary/50 border border-border hover:border-primary/40 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Link className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground">Attestation</p>
                      <p className="text-[10px] text-muted-foreground font-mono truncate">
                        {String(results.stellarAttestationHash).slice(0, 16)}…
                      </p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground ml-auto shrink-0 group-hover:text-primary transition-colors" />
                  </a>
                )}

                {/* GenLayer Consensus */}
                {txHash && (
                  <a
                    href={`https://explorer-studio.genlayer.com/transactions/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 p-3 rounded-lg bg-secondary/50 border border-border hover:border-primary/40 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center shrink-0">
                      <Zap className="w-4 h-4 text-violet-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground">AI Consensus</p>
                      <p className="text-[10px] text-muted-foreground font-mono truncate">
                        {txHash.slice(0, 16)}…
                      </p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground ml-auto shrink-0 group-hover:text-primary transition-colors" />
                  </a>
                )}
              </div>

              {/* Attestation Digest */}
              {results.attestationDigest && (
                <div className="pt-2 border-t border-border/50">
                  <p className="text-[10px] text-muted-foreground">
                    <span className="font-semibold">Attestation Digest (SHA-256):</span>{" "}
                    <code className="bg-secondary/70 px-1.5 py-0.5 rounded text-[10px] font-mono break-all">
                      {String(results.attestationDigest)}
                    </code>
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-center">
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  setJobTitle("");
                  setJobDescription("");
                  setMustHaveSkills("");
                  setResumeText("");
                  setResults(null);
                  setTxHash(null);
                  setError(null);
                }}
                className="font-semibold"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                New Review
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 mt-12">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-muted-foreground font-medium">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-primary" />
            Nexa Bridge · Settlement by Stellar · Audit by GenLayer
          </div>
          <div className="flex gap-4">
            <a href="https://stellar.org" target="_blank" className="hover:text-foreground">Stellar</a>
            <a href="https://genlayer.com" target="_blank" className="hover:text-foreground">GenLayer</a>
            <a href="https://paymentauth.org" target="_blank" className="hover:text-primary">MPP Protocol</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Audit;
