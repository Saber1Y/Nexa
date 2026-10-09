import { useState, type ReactNode } from "react";
import { Search, ShieldCheck, ExternalLink, CheckCircle2, XCircle, AlertTriangle, Copy, Check, Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import ScoreRing from "@/components/ScoreRing";
import { explorerTxUrl, BOT_USDT_DECIMALS } from "@/utils/botChain";
import { API_BASE } from "@/utils/apiBase";


const PAYMENT_ID_PATTERN = /^0x[0-9a-fA-F]{64}$/;

interface ScreeningResults {
  verdict: string;
  match_score: number;
  seniority: string;
  matched_skills: string[];
  missing_skills: string[];
  explanation: string;
  confidence?: number;
}

interface OnChainReceipt {
  found: boolean;
  recorded: boolean;
  registry?: string;
  paymentId?: string;
  serviceId?: string;
  payer?: string;
  provider?: string;
  asset?: string;
  amount?: string;
  resultHash?: string;
  tx?: string;
  blockNumber?: string;
  explorerUrl?: string | null;
}

interface VerifyAudit {
  paymentId?: string;
  screeningId?: string;
  service?: { id?: string; version?: string };
  jobTitle?: string;
  results?: ScreeningResults;
  resultHash?: string;
  paymentTx?: string | null;
  receiptTx?: string | null;
  recorded?: boolean;
  payer?: string;
  amount?: string;
  asset?: string;
  completedAt?: string;
  onChain?: OnChainReceipt;
}

interface VerifyResponse {
  found: boolean;
  error?: string;
  hashMatches?: boolean | null;
  audit?: VerifyAudit;
}

const formatTusdt = (atomic?: string): string => {
  if (!atomic) return "--";
  return `${(Number(atomic) / 10 ** BOT_USDT_DECIMALS).toFixed(BOT_USDT_DECIMALS)} USDT`;
};

const shorten = (value?: string | null, head = 10, tail = 8): string => {
  if (!value) return "--";
  return value.length > head + tail + 3 ? `${value.slice(0, head)}...${value.slice(-tail)}` : value;
};

const verdictColor: Record<string, string> = {
  STRONG_FIT: "var(--neon-green)",
  PARTIAL_FIT: "var(--neon-cyan)",
  NOT_FIT: "var(--neon-red)",
  Qualified: "var(--neon-green)",
  Maybe: "var(--neon-cyan)",
  "Not Qualified": "var(--neon-red)",
};

const verdictIcon: Record<string, ReactNode> = {
  STRONG_FIT: <CheckCircle2 className="w-5 h-5" style={{ color: "var(--neon-green)" }} />,
  PARTIAL_FIT: <AlertTriangle className="w-5 h-5" style={{ color: "var(--neon-cyan)" }} />,
  NOT_FIT: <XCircle className="w-5 h-5" style={{ color: "var(--neon-red)" }} />,
  Qualified: <CheckCircle2 className="w-5 h-5" style={{ color: "var(--neon-green)" }} />,
  Maybe: <AlertTriangle className="w-5 h-5" style={{ color: "var(--neon-cyan)" }} />,
  "Not Qualified": <XCircle className="w-5 h-5" style={{ color: "var(--neon-red)" }} />,
};

const Verify = () => {
  const [paymentId, setPaymentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyAudit | null>(null);
  const [hashMatches, setHashMatches] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleVerify = async () => {
    const id = paymentId.trim();
    if (!id) return;
    setLoading(true);
    setError("");
    setResult(null);
    setHashMatches(null);
    if (!PAYMENT_ID_PATTERN.test(id)) {
      setError("Invalid paymentId. Expected 0x followed by 64 hex characters (32 bytes).");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/verify/${encodeURIComponent(id)}`);
      const data = (await res.json()) as VerifyResponse;
      if (!data.found || !data.audit) {
        setError(data.error || "No audit found for this paymentId.");
      } else {
        setResult(data.audit);
        setHashMatches(data.hashMatches ?? null);
      }
    } catch {
      setError("Failed to connect to the Nexa API.");
    } finally {
      setLoading(false);
    }
  };

  const copyResultHash = () => {
    if (result?.resultHash) {
      navigator.clipboard.writeText(result.resultHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const onChain = result?.onChain;
  const localResults = result?.results;
  const localHash = result?.resultHash;
  const chainHash = onChain?.resultHash;
  const receiptUrl = onChain?.explorerUrl || (onChain?.tx ? explorerTxUrl(onChain.tx) : null);

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
            <span className="gradient-text">Verify Receipt</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-xs tracking-wide leading-relaxed">
            <span style={{ color: "var(--neon-green)" }}>&gt;</span> Paste any <span className="font-bold" style={{ color: "var(--neon-cyan)" }}>paymentId</span> (0x + 64 hex). The local record is cross-checked against the <span className="font-bold" style={{ color: "var(--neon-cyan)" }}>BOT Chain receipt registry</span>.
          </p>
        </div>

        {/* Search */}
        <div className="cyber-card p-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: "var(--neon-green)" }}>&gt;</span>
              <input
                type="text"
                placeholder="0x... paymentId"
                value={paymentId}
                onChange={(e) => setPaymentId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                className="w-full pl-10 pr-4 py-4 bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-neon-green transition-all font-mono tracking-wide cyber-chamfer-sm"
                style={{ caretColor: "var(--neon-green)" }}
              />
            </div>
            <Button
              onClick={handleVerify}
              disabled={loading || !paymentId.trim()}
              className="font-display text-[10px] font-bold uppercase tracking-[0.15em] px-8 border-2 cyber-chamfer-sm"
              style={{ borderColor: "var(--neon-green)", color: "#0a0a0f", background: "var(--neon-green)" }}
            >
              {loading ? <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: "transparent transparent #0a0a0f #0a0a0f" }} /> : <><Search className="w-4 h-4 mr-2" /> Verify</>}
            </Button>
          </div>
        </div>

        {/* Error / Not found */}
        {error && (
          <div className="cyber-card p-6 text-center" style={{ borderColor: "var(--neon-red)" }}>
            <XCircle className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--neon-red)" }} />
            <p className="text-xs" style={{ color: "var(--neon-red)" }}>{error}</p>
            <p className="text-[9px] text-muted-foreground mt-2 tracking-wide">
              &gt; paymentId format: <code style={{ color: "var(--neon-cyan)" }}>0x + 64 hex characters</code>
            </p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
            {/* Integrity Line */}
            <div
              className="cyber-card p-6 text-center"
              style={{
                borderColor: hashMatches === true ? "var(--neon-green)" : hashMatches === false ? "var(--neon-red)" : "rgba(0,212,255,0.4)",
                boxShadow: hashMatches === true ? "0 0 15px rgba(0,255,136,0.15)" : hashMatches === false ? "0 0 15px rgba(255,51,102,0.15)" : "0 0 15px rgba(0,212,255,0.12)",
              }}
            >
              {hashMatches === true && (
                <CheckCircle2 className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--neon-green)", filter: "drop-shadow(0 0 8px rgba(0,255,136,0.4))" }} />
              )}
              {hashMatches === false && (
                <XCircle className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--neon-red)", filter: "drop-shadow(0 0 8px rgba(255,51,102,0.4))" }} />
              )}
              {hashMatches === null && (
                <Loader2 className="w-10 h-10 mx-auto mb-3 animate-spin" style={{ color: "var(--neon-cyan)" }} />
              )}
              <h3
                className="text-sm font-display font-bold uppercase tracking-wider neon-text"
                style={{ color: hashMatches === true ? "var(--neon-green)" : hashMatches === false ? "var(--neon-red)" : "var(--neon-cyan)" }}
              >
                {hashMatches === true && "✓ Receipt Integrity Verified"}
                {hashMatches === false && "✗ Result Hash Mismatch"}
                {hashMatches === null && "⧗ Integrity Pending"}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-1 tracking-wide">
                {hashMatches === true && "The local resultHash matches the resultHash anchored on-chain in the receipt registry."}
                {hashMatches === false && "The local resultHash does NOT match the on-chain receipt. Possible tampering."}
                {hashMatches === null && "No on-chain receipt is available yet for this paymentId, so the hashes cannot be compared."}
              </p>
              <p className="text-[9px] text-muted-foreground mt-1 tracking-wide font-mono">
                paymentId {shorten(result.paymentId)}
              </p>
            </div>

            {/* On-Chain Receipt */}
            <div className="cyber-card p-6 space-y-5" style={{ borderColor: "rgba(0,212,255,0.2)" }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center border" style={{ borderColor: "var(--neon-cyan)", boxShadow: "0 0 6px rgba(0,212,255,0.2)" }}>
                  <Globe className="w-4 h-4" style={{ color: "var(--neon-cyan)" }} />
                </div>
                <div>
                  <h4 className="text-xs font-display font-bold uppercase tracking-wider">On-Chain Receipt</h4>
                  <p className="text-[9px] text-muted-foreground tracking-wide">&gt; BOT Chain Mainnet (677) · receipt registry on <code style={{ color: "var(--neon-cyan)" }}>scan.botchain.ai</code></p>
                </div>
              </div>

              {onChain?.found ? (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    {[
                      ["Registry", onChain.registry],
                      ["Payer", onChain.payer],
                      ["Provider", onChain.provider],
                      ["Amount", onChain.amount ? formatTusdt(onChain.amount) : undefined],
                      ["Block", onChain.blockNumber ? `#${onChain.blockNumber}` : undefined],
                      ["Payment Id", onChain.paymentId],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-start justify-between gap-4 text-[10px] py-0.5">
                        <span className="text-muted-foreground shrink-0">{label}</span>
                        <span className="font-mono break-all text-right" style={{ color: "inherit" }}>
                          {value || "--"}
                          {label === "Amount" && onChain.amount ? <span className="text-muted-foreground"> ({onChain.amount} atomic)</span> : null}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-start justify-between gap-4 text-[10px] py-0.5">
                      <span className="text-muted-foreground shrink-0">Status</span>
                      <span className="font-mono" style={{ color: onChain.recorded ? "var(--neon-green)" : "var(--neon-red)" }}>
                        {onChain.recorded ? "✓ Recorded" : "✗ Not recorded"}
                      </span>
                    </div>
                  </div>

                  {receiptUrl && (
                    <a
                      href={receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 border text-[10px] font-mono transition-all cyber-chamfer-sm"
                      style={{ borderColor: "rgba(0,212,255,0.3)", color: "var(--neon-cyan)" }}
                    >
                      Receipt Tx {shorten(onChain.tx, 8, 6)} <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ) : (
                <div className="cyber-card p-4 text-center" style={{ borderColor: "rgba(255,51,102,0.3)", background: "rgba(255,51,102,0.03)" }}>
                  <p className="text-xs font-display font-bold uppercase tracking-wider" style={{ color: "var(--neon-red)" }}>No receipt found on-chain</p>
                  <p className="text-[9px] text-muted-foreground mt-1 tracking-wide">
                    &gt; The payment may not be settled yet, or the registry event is not indexed.
                  </p>
                </div>
              )}
            </div>

            {/* Result Hash Comparison */}
            {onChain?.found && chainHash && localHash && (
              <div className="space-y-3">
                <p className="font-label text-[9px] uppercase tracking-[0.2em] text-muted-foreground">&gt; Result Hash Comparison (SHA-256)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="cyber-card p-3" style={{ borderColor: "rgba(0,212,255,0.15)" }}>
                    <p className="font-label text-[8px] uppercase tracking-[0.2em] mb-1" style={{ color: "var(--neon-cyan)" }}>⛓ From BOT Chain Registry</p>
                    <code className="text-[9px] font-mono text-foreground break-all leading-relaxed">{chainHash}</code>
                  </div>
                  <div className="cyber-card p-3" style={{ borderColor: "rgba(0,255,136,0.15)" }}>
                    <p className="font-label text-[8px] uppercase tracking-[0.2em] mb-1" style={{ color: "var(--neon-green)" }}>🔏 From Nexa Ledger</p>
                    <code className="text-[9px] font-mono text-foreground break-all leading-relaxed">{localHash}</code>
                  </div>
                </div>
              </div>
            )}

            {/* Local Record: Score + Verdict */}
            {localResults ? (
              <div className="cyber-card p-6">
                <p className="font-label text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-4">&gt; Local Audit Record</p>
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <ScoreRing score={localResults.match_score} />
                  <div className="flex-1 space-y-2 text-center md:text-left">
                    <h3 className="text-base font-display font-bold text-foreground uppercase tracking-wider">{result.jobTitle || "Untitled Screening"}</h3>
                    <div className="flex items-center gap-3 justify-center md:justify-start">
                      {verdictIcon[localResults.verdict] ?? <AlertTriangle className="w-5 h-5" style={{ color: "var(--neon-cyan)" }} />}
                      <span className="text-sm font-display font-bold" style={{ color: verdictColor[localResults.verdict] || "var(--neon-cyan)" }}>{localResults.verdict}</span>
                      <span className="px-2 py-0.5 border text-[10px] font-mono uppercase tracking-wider" style={{ borderColor: "hsl(var(--border))" }}>{localResults.seniority}</span>
                      {typeof localResults.confidence === "number" && (
                        <span className="px-2 py-0.5 border text-[10px] font-mono uppercase tracking-wider" style={{ borderColor: "hsl(var(--border))", color: "var(--neon-cyan)" }}>
                          conf {localResults.confidence}%
                        </span>
                      )}
                    </div>
                    <p className="text-xs italic text-muted-foreground leading-relaxed tracking-wide">{localResults.explanation}</p>
                  </div>
                </div>

                {/* Skills */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
                  <div className="cyber-card p-3" style={{ borderColor: "rgba(0,255,136,0.15)" }}>
                    <p className="font-label text-[8px] uppercase tracking-[0.2em] mb-2" style={{ color: "var(--neon-green)" }}>✓ Matched Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {localResults.matched_skills?.map((s) => (
                        <span key={s} className="px-2 py-0.5 text-[9px] font-bold border uppercase tracking-wider" style={{ borderColor: "rgba(0,255,136,0.2)", color: "var(--neon-green)", background: "rgba(0,255,136,0.05)" }}>{s}</span>
                      ))}
                      {(!localResults.matched_skills || localResults.matched_skills.length === 0) && <span className="text-[10px] text-muted-foreground">None</span>}
                    </div>
                  </div>
                  <div className="cyber-card p-3" style={{ borderColor: "rgba(255,51,102,0.15)" }}>
                    <p className="font-label text-[8px] uppercase tracking-[0.2em] mb-2" style={{ color: "var(--neon-red)" }}>✗ Missing Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {localResults.missing_skills?.map((s) => (
                        <span key={s} className="px-2 py-0.5 text-[9px] font-bold border uppercase tracking-wider" style={{ borderColor: "rgba(255,51,102,0.2)", color: "var(--neon-red)", background: "rgba(255,51,102,0.05)" }}>{s}</span>
                      ))}
                      {(!localResults.missing_skills || localResults.missing_skills.length === 0) && <span className="text-[10px] text-muted-foreground">None</span>}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="cyber-card p-6 text-center">
                <AlertTriangle className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--neon-cyan)" }} />
                <p className="text-xs font-display font-bold uppercase tracking-wider" style={{ color: "var(--neon-cyan)" }}>No Local Record</p>
                <p className="text-[10px] text-muted-foreground mt-1 tracking-wide">
                  &gt; This paymentId has an on-chain receipt but no locally stored audit result.
                </p>
              </div>
            )}

            {/* Transaction Links */}
            {(result.paymentTx || result.receiptTx) && (
              <div className="cyber-card p-6 space-y-4">
                <h4 className="font-label text-[9px] uppercase tracking-[0.2em] text-muted-foreground">&gt; Onchain Proof Links</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { hash: result.paymentTx, label: "⭐ Payment Tx", neon: "var(--neon-green)" },
                    { hash: result.receiptTx, label: "🧾 Receipt Tx", neon: "var(--neon-cyan)" },
                  ].filter((link): link is { hash: string; label: string; neon: string } => Boolean(link.hash)).map((link) => (
                    <a key={link.label} href={explorerTxUrl(link.hash)} target="_blank" rel="noopener noreferrer"
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
            )}

            {/* Local Result Hash */}
            {localHash && (
              <div className="cyber-card p-6">
                <h4 className="font-label text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-2">&gt; Local Result Hash (SHA-256)</h4>
                <div className="flex items-center gap-2 bg-background px-4 py-3 border border-border">
                  <code className="text-[10px] font-mono text-foreground flex-1 break-all">{localHash}</code>
                  <button onClick={copyResultHash} className="text-muted-foreground hover:text-foreground transition-colors shrink-0" aria-label="Copy result hash">
                    {copied ? <Check className="w-4 h-4" style={{ color: "var(--neon-green)" }} /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {result.completedAt && (
              <div className="text-center text-[10px] text-muted-foreground tracking-wide">
                Completed {new Date(result.completedAt).toLocaleString()}
                {result.service?.id ? ` · Service ${result.service.id}` : ""}
                {result.screeningId ? ` · Screening ${result.screeningId}` : ""}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Verify;
