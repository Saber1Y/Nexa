import { useState, useEffect, type ReactNode } from "react";
import { Activity, ExternalLink, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, XCircle, Copy, Check, ShieldCheck, ShieldAlert } from "lucide-react";
import Navbar from "@/components/Navbar";
import { explorerTxUrl } from "@/utils/botChain";
import { API_BASE } from "@/utils/apiBase";


interface ScreeningResults {
  verdict: string;
  match_score: number;
  seniority: string;
  matched_skills: string[];
  missing_skills: string[];
  explanation: string;
  confidence?: number;
}

interface AuditEntry {
  paymentId: string;
  screeningId?: string;
  jobTitle: string;
  results: ScreeningResults;
  resultHash?: string;
  paymentTx?: string | null;
  receiptTx?: string | null;
  recorded?: boolean;
  payer?: string;
  amount?: string;
  asset?: string;
  completedAt: string;
}

const verdictStyles: Record<string, { color: string; neon: string; icon: ReactNode }> = {
  STRONG_FIT: { color: "text-neon-green", neon: "var(--neon-green)", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  PARTIAL_FIT: { color: "text-neon-cyan", neon: "var(--neon-cyan)", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  NOT_FIT: { color: "text-neon-red", neon: "var(--neon-red)", icon: <XCircle className="w-3.5 h-3.5" /> },
  Qualified: { color: "text-neon-green", neon: "var(--neon-green)", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  Maybe: { color: "text-neon-cyan", neon: "var(--neon-cyan)", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  "Not Qualified": { color: "text-neon-red", neon: "var(--neon-red)", icon: <XCircle className="w-3.5 h-3.5" /> },
};

const defaultVerdictStyle = { color: "text-neon-cyan", neon: "var(--neon-cyan)", icon: <AlertTriangle className="w-3.5 h-3.5" /> };

const isPositiveVerdict = (verdict: string) => verdict === "STRONG_FIT" || verdict === "Qualified";

const shortenHash = (value?: string | null, head = 10, tail = 8): string => {
  if (!value) return "";
  return value.length > head + tail + 3 ? `${value.slice(0, head)}...${value.slice(-tail)}` : value;
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const History = () => {
  const [audits, setAudits] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchAudits = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/audits`);
      const data = await res.json();
      setAudits(Array.isArray(data.audits) ? data.audits : []);
    } catch { /* retry on next interval */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchAudits();
    const interval = setInterval(fetchAudits, 15000);
    return () => clearInterval(interval);
  }, []);

  const copyPaymentId = (paymentId: string) => {
    navigator.clipboard.writeText(paymentId);
    setCopiedId(paymentId);
    setTimeout(() => setCopiedId((current) => (current === paymentId ? null : current)), 2000);
  };

  return (
    <div className="min-h-screen bg-background circuit-bg">
      <Navbar />
      <main className="container mx-auto px-4 py-8 pt-24 max-w-5xl space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 border text-[10px] font-bold uppercase tracking-[0.2em] cyber-chamfer-sm" style={{ borderColor: "var(--neon-green)", color: "var(--neon-green)", background: "rgba(0,255,136,0.05)" }}>
            <Activity className="w-3 h-3 animate-pulse" /> Live Feed
          </div>
          <h2 className="text-3xl md:text-5xl font-black font-display uppercase tracking-wider">
            <span className="gradient-text">Audit History</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-xs tracking-wide leading-relaxed">
            <span style={{ color: "var(--neon-green)" }}>&gt;</span> Every audit ships a paymentId, a result hash and a verifiable payment receipt on BOT Chain.
          </p>
        </div>

        {/* Stats */}
        {audits.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Total Audits", value: audits.length, neon: "var(--neon-green)" },
              { label: "Avg Score", value: Math.round(audits.reduce((s, a) => s + (a.results?.match_score ?? 0), 0) / audits.length), neon: "var(--neon-cyan)" },
              { label: "Success Rate", value: `${Math.round((audits.filter((a) => isPositiveVerdict(a.results?.verdict ?? "")).length / audits.length) * 100)}%`, neon: "var(--neon-green)" },
              { label: "Latest", value: audits[0] ? timeAgo(audits[0].completedAt) : "--", neon: "var(--neon-magenta)" },
            ].map((stat) => (
              <div key={stat.label} className="cyber-card p-4 text-center">
                <p className="font-label text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-xl font-display font-bold" style={{ color: stat.neon, textShadow: `0 0 8px ${stat.neon}40` }}>{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-t-neon-green rounded-full animate-spin mx-auto mb-4" style={{ borderColor: "var(--neon-green) transparent transparent transparent" }} />
            <p className="text-xs text-muted-foreground tracking-wide">Loading audit history...</p>
          </div>
        ) : audits.length === 0 ? (
          <div className="cyber-card p-12 text-center">
            <Activity className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-sm font-display font-bold text-foreground mb-2 uppercase tracking-wider">No Audits Yet</h3>
            <p className="text-xs text-muted-foreground tracking-wide">Run your first audit to see it here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {audits.map((audit) => {
              const results = audit.results ?? ({} as ScreeningResults);
              const style = verdictStyles[results.verdict] || defaultVerdictStyle;
              const isExpanded = expanded === audit.paymentId;
              const toggle = () => setExpanded(isExpanded ? null : audit.paymentId);
              return (
                <div key={audit.paymentId} className="cyber-card overflow-visible transition-all">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={toggle}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggle();
                      }
                    }}
                    className="w-full flex items-center gap-4 p-4 md:p-5 text-left transition-colors cursor-pointer focus:outline-none"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h4 className="font-bold text-foreground text-xs uppercase tracking-wider truncate">{audit.jobTitle}</h4>
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold border uppercase tracking-wider"
                          style={{ borderColor: `${style.neon}40`, color: style.neon, background: `${style.neon}08` }}
                        >
                          {style.icon} {results.verdict || "Unknown"}
                        </span>
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold border uppercase tracking-wider"
                          style={audit.recorded
                            ? { borderColor: "rgba(0,255,136,0.4)", color: "var(--neon-green)", background: "rgba(0,255,136,0.08)" }
                            : { borderColor: "rgba(255,51,102,0.4)", color: "var(--neon-red)", background: "rgba(255,51,102,0.08)" }}
                        >
                          {audit.recorded ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                          {audit.recorded ? "Recorded" : "Unrecorded"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground tracking-wide">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyPaymentId(audit.paymentId);
                          }}
                          className="inline-flex items-center gap-1 font-mono hover:text-foreground transition-colors"
                          title={audit.paymentId}
                          aria-label="Copy paymentId"
                        >
                          {shortenHash(audit.paymentId, 12, 10)}
                          {copiedId === audit.paymentId ? (
                            <Check className="w-3 h-3" style={{ color: "var(--neon-green)" }} />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                        <span>· {results.seniority || "Unknown"} · {audit.amount ? `${(Number(audit.amount) / 1e6).toFixed(6)} USDT` : ""}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 hidden md:block">
                      <p className="text-lg font-display font-bold" style={{ color: "var(--neon-green)" }}>{results.match_score ?? 0}<span className="text-[10px] text-muted-foreground">/100</span></p>
                      <p className="text-[9px] text-muted-foreground">{timeAgo(audit.completedAt)}</p>
                    </div>
                    <div className="text-lg font-display font-bold md:hidden" style={{ color: "var(--neon-green)" }}>{results.match_score ?? 0}</div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                  </div>

                  {isExpanded && (
                    <div className="px-4 md:px-5 pb-5 space-y-4 border-t border-border/30 pt-4 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                      <p className="text-xs italic text-muted-foreground leading-relaxed">{results.explanation}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <p className="font-label text-[9px] uppercase tracking-[0.2em] mb-2" style={{ color: "var(--neon-green)" }}>&gt; Matched Skills</p>
                          <div className="flex flex-wrap gap-1">
                            {results.matched_skills?.map((s) => (
                              <span key={s} className="px-2 py-0.5 text-[9px] font-bold border uppercase tracking-wider" style={{ borderColor: "rgba(0,255,136,0.2)", color: "var(--neon-green)", background: "rgba(0,255,136,0.05)" }}>{s}</span>
                            ))}
                            {(!results.matched_skills || results.matched_skills.length === 0) && <span className="text-[10px] text-muted-foreground">None</span>}
                          </div>
                        </div>
                        <div>
                          <p className="font-label text-[9px] uppercase tracking-[0.2em] mb-2" style={{ color: "var(--neon-red)" }}>&gt; Missing Skills</p>
                          <div className="flex flex-wrap gap-1">
                            {results.missing_skills?.map((s) => (
                              <span key={s} className="px-2 py-0.5 text-[9px] font-bold border uppercase tracking-wider" style={{ borderColor: "rgba(255,51,102,0.2)", color: "var(--neon-red)", background: "rgba(255,51,102,0.05)" }}>{s}</span>
                            ))}
                            {(!results.missing_skills || results.missing_skills.length === 0) && <span className="text-[10px] text-muted-foreground">None</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 items-center">
                        {audit.paymentTx && (
                          <a href={explorerTxUrl(audit.paymentTx)} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 border text-[10px] font-mono transition-all hover:neon-glow cyber-chamfer-sm"
                            style={{ borderColor: "rgba(0,255,136,0.2)", color: "var(--neon-green)" }}>
                            ⭐ Payment <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {audit.receiptTx && (
                          <a href={explorerTxUrl(audit.receiptTx)} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 border text-[10px] font-mono transition-all hover:neon-glow-cyan cyber-chamfer-sm"
                            style={{ borderColor: "rgba(0,212,255,0.2)", color: "var(--neon-cyan)" }}>
                            🧾 Receipt <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        <button
                          onClick={() => copyPaymentId(audit.paymentId)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 border text-[10px] font-mono transition-all cyber-chamfer-sm"
                          style={{ borderColor: "hsl(var(--border))", color: "var(--neon-magenta)" }}
                          aria-label="Copy paymentId"
                        >
                          {copiedId === audit.paymentId ? "✓ Copied" : "paymentId"} <Copy className="w-3 h-3" />
                        </button>
                      </div>

                      {audit.resultHash && (
                        <div>
                          <p className="font-label text-[9px] uppercase tracking-[0.2em] mb-1 text-muted-foreground">&gt; Result Hash</p>
                          <code className="text-[9px] font-mono text-foreground break-all">{audit.resultHash}</code>
                        </div>
                      )}

                      <p className="text-[9px] text-muted-foreground tracking-wide">
                        Completed {new Date(audit.completedAt).toLocaleString()}
                        {audit.payer ? ` · Payer ${audit.payer.slice(0, 6)}...${audit.payer.slice(-4)}` : ""}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default History;
