import { useState } from "react";
import { Search, ShieldCheck, ExternalLink, CheckCircle2, XCircle, AlertTriangle, Hash, Copy, Check, Globe, Loader2 } from "lucide-react";
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

  const [sv, setSv] = useState<{
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
    } catch { return null; }
  };

  const verifyStellar = async (audit: any) => {
    setSv({ loading: true, attestationTx: null, paymentTx: null, memoHex: null, digestMatch: null, error: null });
    try {
      const [attestationTx, paymentTx] = await Promise.all([
        audit.stellarAttestationHash ? fetchStellarTx(audit.stellarAttestationHash) : null,
        audit.stellarPaymentHash ? fetchStellarTx(audit.stellarPaymentHash) : null,
      ]);
      let memoHex: string | null = null;
      let digestMatch: boolean | null = null;
      if (attestationTx?.memo && attestationTx?.memo_type === "hash") {
        memoHex = base64ToHex(attestationTx.memo);
        if (audit.attestationDigest) digestMatch = memoHex === audit.attestationDigest;
      }
      setSv({ loading: false, attestationTx, paymentTx, memoHex, digestMatch, error: !attestationTx && !paymentTx ? "Could not fetch from Stellar Horizon." : null });
    } catch {
      setSv((p) => ({ ...p, loading: false, error: "Failed to connect to Stellar Horizon API." }));
    }
  };

  const handleVerify = async () => {
    if (!hash.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    setSv({ loading: false, attestationTx: null, paymentTx: null, memoHex: null, digestMatch: null, error: null });
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${apiUrl}/api/verify/${encodeURIComponent(hash.trim())}`);
      const data = await res.json();
      if (!data.found) {
        setError("No audit found for this hash.");
      } else {
        setResult(data.audit);
        verifyStellar(data.audit);
      }
    } catch {
      setError("Failed to connect to the bridge.");
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

  const verdictColor: Record<string, string> = { Qualified: "var(--neon-green)", Maybe: "var(--neon-cyan)", "Not Qualified": "var(--neon-red)" };
  const verdictIcon: Record<string, any> = {
    Qualified: <CheckCircle2 className="w-5 h-5" style={{ color: "var(--neon-green)" }} />,
    Maybe: <AlertTriangle className="w-5 h-5" style={{ color: "var(--neon-cyan)" }} />,
    "Not Qualified": <XCircle className="w-5 h-5" style={{ color: "var(--neon-red)" }} />,
  };

  return (
    <div className="min-h-screen bg-background circuit-bg">
      <Navbar />
      <main className="container mx-auto px-4 py-8 pt-24 max-w-4xl space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 border text-[10px] font-bold uppercase tracking-[0.2em] cyber-chamfer-sm" style={{ borderColor: "var(--neon-green)", color: "var(--neon-green)", background: "rgba(0,255,136,0.05)" }}>
            <ShieldCheck className="w-3 h-3" /> Trustless Verification
          </div>
          <h2 className="text-3xl md:text-5xl font-black font-display uppercase tracking-wider">
            <span className="gradient-text">Verify Audit</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-xs tracking-wide leading-relaxed">
            <span style={{ color: "var(--neon-green)" }}>&gt;</span> Paste any Stellar or GenLayer hash. Results are cryptographically verified via the <span className="font-bold" style={{ color: "var(--neon-cyan)" }}>Stellar Horizon API</span>.
          </p>
        </div>

        {/* Search */}
        <div className="cyber-card p-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: "var(--neon-green)" }}>&gt;</span>
              <input
                type="text"
                placeholder="Paste tx hash..."
                value={hash}
                onChange={(e) => setHash(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                className="w-full pl-10 pr-4 py-4 bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-neon-green transition-all font-mono tracking-wide cyber-chamfer-sm"
                style={{ caretColor: "var(--neon-green)" }}
              />
            </div>
            <Button
              onClick={handleVerify}
              disabled={loading || !hash.trim()}
              className="font-display text-[10px] font-bold uppercase tracking-[0.15em] px-8 border-2 cyber-chamfer-sm"
              style={{ borderColor: "var(--neon-green)", color: "#0a0a0f", background: "var(--neon-green)" }}
            >
              {loading ? <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: "transparent transparent #0a0a0f #0a0a0f" }} /> : <><Search className="w-4 h-4 mr-2" /> Verify</>}
            </Button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="cyber-card p-6 text-center" style={{ borderColor: "var(--neon-red)" }}>
            <XCircle className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--neon-red)" }} />
            <p className="text-xs" style={{ color: "var(--neon-red)" }}>{error}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
            {/* Verified Badge */}
            <div className="cyber-card p-6 text-center" style={{ borderColor: "var(--neon-green)", boxShadow: "0 0 15px rgba(0,255,136,0.15)" }}>
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--neon-green)", filter: "drop-shadow(0 0 8px rgba(0,255,136,0.4))" }} />
              <h3 className="text-sm font-display font-bold uppercase tracking-wider neon-text" style={{ color: "var(--neon-green)" }}>Audit Verified Onchain ✓</h3>
              <p className="text-[10px] text-muted-foreground mt-1 tracking-wide">Independently verified on Stellar and GenLayer blockchains.</p>
            </div>

            {/* ═══ LIVE STELLAR HORIZON VERIFICATION ═══ */}
            <div className="cyber-card p-6 space-y-5" style={{ borderColor: "rgba(0,212,255,0.2)" }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center border" style={{ borderColor: "var(--neon-cyan)", boxShadow: "0 0 6px rgba(0,212,255,0.2)" }}>
                  <Globe className="w-4 h-4" style={{ color: "var(--neon-cyan)" }} />
                </div>
                <div>
                  <h4 className="text-xs font-display font-bold uppercase tracking-wider">Live Stellar Verification</h4>
                  <p className="text-[9px] text-muted-foreground tracking-wide">&gt; Data from <code style={{ color: "var(--neon-cyan)" }}>horizon-testnet.stellar.org</code></p>
                </div>
              </div>

              {sv.loading && (
                <div className="flex items-center justify-center gap-2 py-6">
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--neon-cyan)" }} />
                  <p className="text-xs text-muted-foreground">Querying Stellar Horizon...</p>
                </div>
              )}

              {sv.error && <p className="text-center text-xs py-4" style={{ color: "var(--neon-red)" }}>{sv.error}</p>}

              {/* Digest Match */}
              {sv.digestMatch !== null && (
                <div className="cyber-card p-4" style={{ borderColor: sv.digestMatch ? "rgba(0,255,136,0.3)" : "rgba(255,51,102,0.3)", background: sv.digestMatch ? "rgba(0,255,136,0.03)" : "rgba(255,51,102,0.03)" }}>
                  <div className="flex items-center gap-3">
                    {sv.digestMatch ? <CheckCircle2 className="w-6 h-6 shrink-0" style={{ color: "var(--neon-green)" }} /> : <XCircle className="w-6 h-6 shrink-0" style={{ color: "var(--neon-red)" }} />}
                    <div>
                      <p className="text-xs font-display font-bold uppercase tracking-wider" style={{ color: sv.digestMatch ? "var(--neon-green)" : "var(--neon-red)" }}>
                        {sv.digestMatch ? "✓ Memo.hash Matches Digest" : "✗ Memo.hash Mismatch"}
                      </p>
                      <p className="text-[9px] text-muted-foreground mt-0.5 tracking-wide">
                        {sv.digestMatch ? "SHA-256 digest on Stellar matches attestation. Cryptographically verified." : "The on-chain Memo.hash does not match. Possible tampering."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Digest Comparison */}
              {sv.memoHex && result.attestationDigest && (
                <div className="space-y-3">
                  <p className="font-label text-[9px] uppercase tracking-[0.2em] text-muted-foreground">&gt; Digest Comparison</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="cyber-card p-3" style={{ borderColor: "rgba(0,212,255,0.15)" }}>
                      <p className="font-label text-[8px] uppercase tracking-[0.2em] mb-1" style={{ color: "var(--neon-cyan)" }}>📡 From Stellar Horizon</p>
                      <code className="text-[9px] font-mono text-foreground break-all leading-relaxed">{sv.memoHex}</code>
                    </div>
                    <div className="cyber-card p-3" style={{ borderColor: "rgba(0,255,136,0.15)" }}>
                      <p className="font-label text-[8px] uppercase tracking-[0.2em] mb-1" style={{ color: "var(--neon-green)" }}>🔏 From Nexa Ledger</p>
                      <code className="text-[9px] font-mono text-foreground break-all leading-relaxed">{result.attestationDigest}</code>
                    </div>
                  </div>
                </div>
              )}

              {/* Tx Details */}
              {(sv.attestationTx || sv.paymentTx) && (
                <div className="space-y-3">
                  <p className="font-label text-[9px] uppercase tracking-[0.2em] text-muted-foreground">&gt; Stellar Transaction Data</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {sv.attestationTx && (
                      <div className="cyber-card p-3 space-y-1.5" style={{ borderColor: "rgba(0,255,136,0.15)" }}>
                        <p className="font-label text-[8px] uppercase tracking-[0.2em]" style={{ color: "var(--neon-green)" }}>🔗 Attestation Tx</p>
                        {[
                          ["Status", sv.attestationTx.successful ? "✓ Confirmed" : "✗ Failed"],
                          ["Ledger", `#${sv.attestationTx.ledger}`],
                          ["Fee", `${sv.attestationTx.fee_charged ? (parseInt(sv.attestationTx.fee_charged) / 10000000).toFixed(7) : "?"} XLM`],
                          ["Memo", sv.attestationTx.memo_type || "none"],
                          ["Time", sv.attestationTx.created_at ? new Date(sv.attestationTx.created_at).toLocaleString() : "?"],
                        ].map(([k, v]) => (
                          <div key={k} className="flex justify-between text-[10px]">
                            <span className="text-muted-foreground">{k}</span>
                            <span className="font-mono" style={{ color: k === "Status" ? (sv.attestationTx!.successful ? "var(--neon-green)" : "var(--neon-red)") : "inherit" }}>{v}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {sv.paymentTx && (
                      <div className="cyber-card p-3 space-y-1.5" style={{ borderColor: "rgba(0,212,255,0.15)" }}>
                        <p className="font-label text-[8px] uppercase tracking-[0.2em]" style={{ color: "var(--neon-cyan)" }}>⭐ Payment Tx</p>
                        {[
                          ["Status", sv.paymentTx.successful ? "✓ Confirmed" : "✗ Failed"],
                          ["Ledger", `#${sv.paymentTx.ledger}`],
                          ["Fee", `${sv.paymentTx.fee_charged ? (parseInt(sv.paymentTx.fee_charged) / 10000000).toFixed(7) : "?"} XLM`],
                          ["Payer", `${sv.paymentTx.source_account?.slice(0, 6)}...${sv.paymentTx.source_account?.slice(-6)}`],
                          ["Time", sv.paymentTx.created_at ? new Date(sv.paymentTx.created_at).toLocaleString() : "?"],
                        ].map(([k, v]) => (
                          <div key={k} className="flex justify-between text-[10px]">
                            <span className="text-muted-foreground">{k}</span>
                            <span className="font-mono" style={{ color: k === "Status" ? (sv.paymentTx!.successful ? "var(--neon-green)" : "var(--neon-red)") : "inherit" }}>{v}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Score + Verdict */}
            <div className="cyber-card p-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <ScoreRing score={result.matchScore} />
                <div className="flex-1 space-y-2 text-center md:text-left">
                  <h3 className="text-base font-display font-bold text-foreground uppercase tracking-wider">{result.jobTitle}</h3>
                  <div className="flex items-center gap-3 justify-center md:justify-start">
                    {verdictIcon[result.verdict]}
                    <span className="text-sm font-display font-bold" style={{ color: verdictColor[result.verdict] }}>{result.verdict}</span>
                    <span className="px-2 py-0.5 border text-[10px] font-mono uppercase tracking-wider" style={{ borderColor: "hsl(var(--border))" }}>{result.seniority}</span>
                  </div>
                  <p className="text-xs italic text-muted-foreground leading-relaxed tracking-wide">{result.explanation}</p>
                </div>
              </div>
            </div>

            {/* Onchain Links */}
            <div className="cyber-card p-6 space-y-4">
              <h4 className="font-label text-[9px] uppercase tracking-[0.2em] text-muted-foreground">&gt; Onchain Proof Links</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { hash: result.stellarPaymentHash, label: "⭐ Stellar Payment", url: `${STELLAR_EXPLORER}${result.stellarPaymentHash}`, neon: "var(--neon-green)" },
                  { hash: result.stellarAttestationHash, label: "🔗 Attestation", url: `${STELLAR_EXPLORER}${result.stellarAttestationHash}`, neon: "var(--neon-cyan)" },
                  { hash: result.genLayerHash, label: "🧠 GenLayer", url: `https://studio.genlayer.com/explorer/tx/${result.genLayerHash}`, neon: "var(--neon-magenta)" },
                ].filter((l) => l.hash).map((link) => (
                  <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer"
                    className="cyber-card p-4 transition-all group"
                    style={{ borderColor: `${link.neon}20` }}
                  >
                    <p className="font-label text-[9px] uppercase tracking-[0.2em] mb-1" style={{ color: link.neon }}>{link.label}</p>
                    <p className="text-[10px] font-mono truncate group-hover:underline" style={{ color: link.neon }}>{link.hash.slice(0, 16)}...</p>
                    <ExternalLink className="w-3 h-3 text-muted-foreground mt-2" />
                  </a>
                ))}
              </div>
            </div>

            {/* Attestation Digest */}
            {result.attestationDigest && (
              <div className="cyber-card p-6">
                <h4 className="font-label text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-2">&gt; Attestation Digest (SHA-256)</h4>
                <div className="flex items-center gap-2 bg-background px-4 py-3 border border-border">
                  <code className="text-[10px] font-mono text-foreground flex-1 break-all">{result.attestationDigest}</code>
                  <button onClick={copyDigest} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
                    {copied ? <Check className="w-4 h-4" style={{ color: "var(--neon-green)" }} /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <div className="text-center text-[10px] text-muted-foreground tracking-wide">
              Completed {new Date(result.completedAt).toLocaleString()} · Consensus in {result.elapsedSeconds}s
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Verify;
