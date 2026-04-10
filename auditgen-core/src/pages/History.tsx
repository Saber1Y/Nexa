import { useState, useEffect } from "react";
import { Activity, ExternalLink, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import Navbar from "@/components/Navbar";

const STELLAR_EXPLORER = "https://stellar.expert/explorer/testnet/tx/";

interface AuditEntry {
  id: string;
  jobTitle: string;
  verdict: string;
  matchScore: number;
  seniority: string;
  explanation: string;
  matchedSkills: string[];
  missingSkills: string[];
  stellarPaymentHash: string;
  stellarAttestationHash: string;
  genLayerHash: string;
  attestationDigest: string;
  paymentAsset: string;
  elapsedSeconds: number;
  completedAt: string;
}

const verdictStyles: Record<string, { color: string; neon: string; icon: any }> = {
  Qualified: { color: "text-neon-green", neon: "var(--neon-green)", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  Maybe: { color: "text-neon-cyan", neon: "var(--neon-cyan)", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  "Not Qualified": { color: "text-neon-red", neon: "var(--neon-red)", icon: <XCircle className="w-3.5 h-3.5" /> },
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

  const fetchAudits = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${apiUrl}/api/audits`);
      const data = await res.json();
      setAudits(data.audits || []);
    } catch { /* retry on next interval */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchAudits();
    const interval = setInterval(fetchAudits, 15000);
    return () => clearInterval(interval);
  }, []);

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
            <span style={{ color: "var(--neon-green)" }}>&gt;</span> Every audit is recorded with verifiable onchain proofs on Stellar.
          </p>
        </div>

        {/* Stats */}
        {audits.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Total Audits", value: audits.length, neon: "var(--neon-green)" },
              { label: "Avg Score", value: Math.round(audits.reduce((s, a) => s + a.matchScore, 0) / audits.length), neon: "var(--neon-cyan)" },
              { label: "Success Rate", value: `${Math.round((audits.filter((a) => a.verdict === "Qualified").length / audits.length) * 100)}%`, neon: "var(--neon-green)" },
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
              const style = verdictStyles[audit.verdict] || verdictStyles["Maybe"];
              const isExpanded = expanded === audit.id;
              return (
                <div key={audit.id + audit.completedAt} className="cyber-card overflow-visible transition-all">
                  <button
                    onClick={() => setExpanded(isExpanded ? null : audit.id)}
                    className="w-full flex items-center gap-4 p-4 md:p-5 text-left transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-bold text-foreground text-xs uppercase tracking-wider truncate">{audit.jobTitle}</h4>
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold border uppercase tracking-wider"
                          style={{ borderColor: `${style.neon}40`, color: style.neon, background: `${style.neon}08` }}
                        >
                          {style.icon} {audit.verdict}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground tracking-wide">{audit.id} · {audit.seniority} · {audit.paymentAsset}</p>
                    </div>
                    <div className="text-right shrink-0 hidden md:block">
                      <p className="text-lg font-display font-bold" style={{ color: "var(--neon-green)" }}>{audit.matchScore}<span className="text-[10px] text-muted-foreground">/100</span></p>
                      <p className="text-[9px] text-muted-foreground">{timeAgo(audit.completedAt)}</p>
                    </div>
                    <div className="text-lg font-display font-bold md:hidden" style={{ color: "var(--neon-green)" }}>{audit.matchScore}</div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                  </button>

                  {isExpanded && (
                    <div className="px-4 md:px-5 pb-5 space-y-4 border-t border-border/30 pt-4 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                      <p className="text-xs italic text-muted-foreground leading-relaxed">{audit.explanation}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <p className="font-label text-[9px] uppercase tracking-[0.2em] mb-2" style={{ color: "var(--neon-green)" }}>&gt; Matched Skills</p>
                          <div className="flex flex-wrap gap-1">
                            {audit.matchedSkills?.map((s) => (
                              <span key={s} className="px-2 py-0.5 text-[9px] font-bold border uppercase tracking-wider" style={{ borderColor: "rgba(0,255,136,0.2)", color: "var(--neon-green)", background: "rgba(0,255,136,0.05)" }}>{s}</span>
                            ))}
                            {(!audit.matchedSkills || audit.matchedSkills.length === 0) && <span className="text-[10px] text-muted-foreground">None</span>}
                          </div>
                        </div>
                        <div>
                          <p className="font-label text-[9px] uppercase tracking-[0.2em] mb-2" style={{ color: "var(--neon-red)" }}>&gt; Missing Skills</p>
                          <div className="flex flex-wrap gap-1">
                            {audit.missingSkills?.map((s) => (
                              <span key={s} className="px-2 py-0.5 text-[9px] font-bold border uppercase tracking-wider" style={{ borderColor: "rgba(255,51,102,0.2)", color: "var(--neon-red)", background: "rgba(255,51,102,0.05)" }}>{s}</span>
                            ))}
                            {(!audit.missingSkills || audit.missingSkills.length === 0) && <span className="text-[10px] text-muted-foreground">None</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {audit.stellarPaymentHash && (
                          <a href={`${STELLAR_EXPLORER}${audit.stellarPaymentHash}`} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 border text-[10px] font-mono transition-all hover:neon-glow cyber-chamfer-sm"
                            style={{ borderColor: "rgba(0,255,136,0.2)", color: "var(--neon-green)" }}>
                            ⭐ Payment <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {audit.stellarAttestationHash && (
                          <a href={`${STELLAR_EXPLORER}${audit.stellarAttestationHash}`} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 border text-[10px] font-mono transition-all hover:neon-glow-cyan cyber-chamfer-sm"
                            style={{ borderColor: "rgba(0,212,255,0.2)", color: "var(--neon-cyan)" }}>
                            🔗 Attestation <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {audit.genLayerHash && (
                          <a href={`https://studio.genlayer.com/explorer/tx/${audit.genLayerHash}`} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 border text-[10px] font-mono transition-all hover:neon-glow-magenta cyber-chamfer-sm"
                            style={{ borderColor: "rgba(255,0,255,0.2)", color: "var(--neon-magenta)" }}>
                            🧠 GenLayer <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      <p className="text-[9px] text-muted-foreground tracking-wide">
                        Completed {new Date(audit.completedAt).toLocaleString()} · Consensus in {audit.elapsedSeconds}s
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
