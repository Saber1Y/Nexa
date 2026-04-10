import { useState } from "react";
import { Search, ShieldCheck, ExternalLink, CheckCircle2, XCircle, AlertTriangle, Hash, Copy, Check, Globe, Loader2, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import ScoreRing from "@/components/ScoreRing";

const STELLAR_EXPLORER = "https://stellar.expert/explorer/testnet/tx/";
const HORIZON_URL = "https://horizon-testnet.stellar.org";

interface StellarTxData {
  memo?: string;
  memo_type?: string;
  created_at?: string;
  source_account?: string;
  fee_charged?: string;
  successful?: boolean;
  ledger?: number;
}

function base64ToHex(b64: string): string {
  const raw = atob(b64);
  return Array.from(raw, (c) => c.charCodeAt(0).toString(16).padStart(2, "0")).join("");
}

const Verify = () => {
  const [hash, setHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Stellar Horizon live verification state
  const [stellarVerification, setStellarVerification] = useState<{
    loading: boolean;
    attestationTx: StellarTxData | null;
    paymentTx: StellarTxData | null;
    memoHex: string | null;
    digestMatch: boolean | null;
    error: string | null;
  }>({ loading: false, attestationTx: null, paymentTx: null, memoHex: null, digestMatch: null, error: null });

  const fetchStellarTx = async (txHash: string): Promise<StellarTxData | null> => {
    try {
      const res = await fetch(`${HORIZON_URL}/transactions/${txHash}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  };

  const verifyStellar = async (audit: any) => {
    setStellarVerification({ loading: true, attestationTx: null, paymentTx: null, memoHex: null, digestMatch: null, error: null });

    try {
      const [attestationTx, paymentTx] = await Promise.all([
        audit.stellarAttestationHash ? fetchStellarTx(audit.stellarAttestationHash) : null,
        audit.stellarPaymentHash ? fetchStellarTx(audit.stellarPaymentHash) : null,
      ]);

      let memoHex: string | null = null;
      let digestMatch: boolean | null = null;

      if (attestationTx?.memo && attestationTx?.memo_type === "hash") {
        memoHex = base64ToHex(attestationTx.memo);
        if (audit.attestationDigest) {
          digestMatch = memoHex === audit.attestationDigest;
        }
      }

      setStellarVerification({
        loading: false,
        attestationTx,
        paymentTx,
        memoHex,
        digestMatch,
        error: !attestationTx && !paymentTx ? "Could not fetch transactions from Stellar Horizon. The transactions may not have been confirmed yet." : null,
      });
    } catch {
      setStellarVerification((prev) => ({ ...prev, loading: false, error: "Failed to connect to Stellar Horizon API." }));
    }
  };

  const handleVerify = async () => {
    if (!hash.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    setStellarVerification({ loading: false, attestationTx: null, paymentTx: null, memoHex: null, digestMatch: null, error: null });

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${apiUrl}/api/verify/${encodeURIComponent(hash.trim())}`);
      const data = await res.json();

      if (!data.found) {
        setError("No audit found for this hash. Make sure you're using a valid Stellar attestation, payment, or GenLayer consensus hash.");
      } else {
        setResult(data.audit);
        // Automatically trigger live Stellar verification
        verifyStellar(data.audit);
      }
    } catch {
      setError("Failed to connect to the bridge. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyDigest = () => {
    if (result?.attestationDigest) {
      navigator.clipboard.writeText(result.attestationDigest);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const verdictColor: Record<string, string> = {
    Qualified: "text-emerald-400",
    Maybe: "text-amber-400",
    "Not Qualified": "text-red-400",
  };

  const verdictIcon: Record<string, any> = {
    Qualified: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
    Maybe: <AlertTriangle className="w-5 h-5 text-amber-400" />,
    "Not Qualified": <XCircle className="w-5 h-5 text-red-400" />,
  };

  const sv = stellarVerification;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 pt-24 max-w-4xl space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
            <ShieldCheck className="w-3 h-3" /> Trustless Verification
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold gradient-text glow-text font-serif">
            Verify Any Audit
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm leading-relaxed">
            Paste a <span className="text-foreground font-semibold">Stellar attestation hash</span>, <span className="text-foreground font-semibold">payment hash</span>, or <span className="text-foreground font-semibold">GenLayer consensus hash</span> to independently verify an audit result onchain via the <span className="text-primary font-semibold">Stellar Horizon API</span>.
          </p>
        </div>

        {/* Search Bar */}
        <div className="glass-card p-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Paste a Stellar or GenLayer transaction hash..."
                value={hash}
                onChange={(e) => setHash(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-secondary/80 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all font-mono"
              />
            </div>
            <Button
              onClick={handleVerify}
              disabled={loading || !hash.trim()}
              className="gradient-primary text-primary-foreground font-semibold px-8 rounded-xl"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Search className="w-4 h-4 mr-2" /> Verify</>
              )}
            </Button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="glass-card p-6 border-red-500/20 text-center">
            <XCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
            {/* Verified Badge */}
            <div className="glass-card p-6 border-emerald-500/20 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-emerald-400">Audit Verified Onchain ✓</h3>
              <p className="text-xs text-muted-foreground mt-1">This audit result has been independently verified on the Stellar and GenLayer blockchains.</p>
            </div>

            {/* ═══════ LIVE STELLAR VERIFICATION ═══════ */}
            <div className="glass-card p-6 space-y-5 border-blue-500/20 bg-blue-500/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Live Stellar Horizon Verification</h4>
                  <p className="text-[10px] text-muted-foreground">Data fetched directly from <code className="text-blue-400">horizon-testnet.stellar.org</code> — not from our server</p>
                </div>
              </div>

              {sv.loading && (
                <div className="flex items-center justify-center gap-2 py-6">
                  <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                  <p className="text-sm text-muted-foreground">Querying Stellar Horizon API...</p>
                </div>
              )}

              {sv.error && (
                <div className="text-center py-4">
                  <p className="text-xs text-amber-400">{sv.error}</p>
                </div>
              )}

              {/* Digest Match Result */}
              {sv.digestMatch !== null && (
                <div className={`rounded-xl p-4 border ${sv.digestMatch ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"}`}>
                  <div className="flex items-center gap-3">
                    {sv.digestMatch ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-400 shrink-0" />
                    )}
                    <div>
                      <p className={`text-sm font-bold ${sv.digestMatch ? "text-emerald-400" : "text-red-400"}`}>
                        {sv.digestMatch ? "✓ Memo.hash Matches Attestation Digest" : "✗ Memo.hash Does NOT Match"}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {sv.digestMatch
                          ? "The SHA-256 digest anchored on Stellar exactly matches the audit attestation. This result is cryptographically verified."
                          : "The Memo.hash on chain does not match the expected digest. This may indicate tampering."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Side-by-side Hash Comparison */}
              {sv.memoHex && result.attestationDigest && (
                <div className="space-y-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Digest Comparison</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-lg bg-secondary/60 px-4 py-3 border border-border/50">
                      <p className="text-[9px] uppercase tracking-wider text-blue-400 font-bold mb-1">📡 From Stellar Horizon (Memo.hash)</p>
                      <code className="text-[10px] font-mono text-foreground break-all leading-relaxed">{sv.memoHex}</code>
                    </div>
                    <div className="rounded-lg bg-secondary/60 px-4 py-3 border border-border/50">
                      <p className="text-[9px] uppercase tracking-wider text-primary font-bold mb-1">🔏 From Nexa Ledger (Attestation Digest)</p>
                      <code className="text-[10px] font-mono text-foreground break-all leading-relaxed">{result.attestationDigest}</code>
                    </div>
                  </div>
                </div>
              )}

              {/* Stellar Transaction Details */}
              {(sv.attestationTx || sv.paymentTx) && (
                <div className="space-y-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Stellar Transaction Data</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {sv.attestationTx && (
                      <div className="rounded-lg bg-secondary/40 px-4 py-3 border border-border/50 space-y-2">
                        <p className="text-[9px] uppercase tracking-wider text-emerald-400 font-bold">🔗 Attestation Transaction</p>
                        <div className="space-y-1 text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Status</span>
                            <span className={sv.attestationTx.successful ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                              {sv.attestationTx.successful ? "✓ Confirmed" : "✗ Failed"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Ledger</span>
                            <span className="text-foreground font-mono">#{sv.attestationTx.ledger}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Fee</span>
                            <span className="text-foreground font-mono">{sv.attestationTx.fee_charged ? (parseInt(sv.attestationTx.fee_charged) / 10000000).toFixed(7) : "?"} XLM</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Memo Type</span>
                            <span className="text-blue-400 font-mono font-bold">{sv.attestationTx.memo_type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Time</span>
                            <span className="text-foreground">{sv.attestationTx.created_at ? new Date(sv.attestationTx.created_at).toLocaleString() : "?"}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    {sv.paymentTx && (
                      <div className="rounded-lg bg-secondary/40 px-4 py-3 border border-border/50 space-y-2">
                        <p className="text-[9px] uppercase tracking-wider text-amber-400 font-bold">⭐ Payment Transaction</p>
                        <div className="space-y-1 text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Status</span>
                            <span className={sv.paymentTx.successful ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                              {sv.paymentTx.successful ? "✓ Confirmed" : "✗ Failed"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Ledger</span>
                            <span className="text-foreground font-mono">#{sv.paymentTx.ledger}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Fee</span>
                            <span className="text-foreground font-mono">{sv.paymentTx.fee_charged ? (parseInt(sv.paymentTx.fee_charged) / 10000000).toFixed(7) : "?"} XLM</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Payer</span>
                            <span className="text-foreground font-mono text-[9px]">{sv.paymentTx.source_account?.slice(0, 8)}...{sv.paymentTx.source_account?.slice(-8)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Time</span>
                            <span className="text-foreground">{sv.paymentTx.created_at ? new Date(sv.paymentTx.created_at).toLocaleString() : "?"}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Score + Verdict */}
            <div className="glass-card p-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <ScoreRing score={result.matchScore} />
                <div className="flex-1 space-y-2 text-center md:text-left">
                  <h3 className="text-xl font-bold text-foreground">{result.jobTitle}</h3>
                  <div className="flex items-center gap-3 justify-center md:justify-start">
                    {verdictIcon[result.verdict]}
                    <span className={`text-lg font-bold ${verdictColor[result.verdict] || "text-foreground"}`}>
                      {result.verdict}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-secondary text-xs font-mono border border-border">
                      {result.seniority}
                    </span>
                  </div>
                  <p className="text-sm italic text-muted-foreground leading-relaxed">{result.explanation}</p>
                </div>
              </div>
            </div>

            {/* Onchain Proofs */}
            <div className="glass-card p-6 space-y-4">
              <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Onchain Proof Links</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {result.stellarPaymentHash && (
                  <a
                    href={`${STELLAR_EXPLORER}${result.stellarPaymentHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-card p-4 hover:border-primary/40 transition-all group"
                  >
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">⭐ Stellar Payment</p>
                    <p className="text-xs font-mono text-primary truncate group-hover:underline">
                      {result.stellarPaymentHash.slice(0, 16)}...
                    </p>
                    <ExternalLink className="w-3 h-3 text-muted-foreground mt-2" />
                  </a>
                )}
                {result.stellarAttestationHash && (
                  <a
                    href={`${STELLAR_EXPLORER}${result.stellarAttestationHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-card p-4 hover:border-primary/40 transition-all group"
                  >
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">🔗 Stellar Attestation</p>
                    <p className="text-xs font-mono text-primary truncate group-hover:underline">
                      {result.stellarAttestationHash.slice(0, 16)}...
                    </p>
                    <ExternalLink className="w-3 h-3 text-muted-foreground mt-2" />
                  </a>
                )}
                {result.genLayerHash && (
                  <a
                    href={`https://studio.genlayer.com/explorer/tx/${result.genLayerHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-card p-4 hover:border-primary/40 transition-all group"
                  >
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">🧠 GenLayer Consensus</p>
                    <p className="text-xs font-mono text-primary truncate group-hover:underline">
                      {result.genLayerHash.slice(0, 16)}...
                    </p>
                    <ExternalLink className="w-3 h-3 text-muted-foreground mt-2" />
                  </a>
                )}
              </div>
            </div>

            {/* Attestation Digest */}
            {result.attestationDigest && (
              <div className="glass-card p-6">
                <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-2">Attestation Digest (SHA-256)</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  This digest is anchored as a <code className="text-primary">Memo.hash</code> in the Stellar attestation transaction above. Compare it to verify integrity.
                </p>
                <div className="flex items-center gap-2 bg-secondary/80 rounded-lg px-4 py-3 border border-border/50">
                  <code className="text-xs font-mono text-foreground flex-1 break-all">{result.attestationDigest}</code>
                  <button onClick={copyDigest} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Timestamp */}
            <div className="text-center text-xs text-muted-foreground">
              Audit completed on {new Date(result.completedAt).toLocaleString()} • Consensus in {result.elapsedSeconds}s
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Verify;
