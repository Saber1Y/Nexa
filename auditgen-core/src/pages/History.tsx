import { useState, useEffect } from "react";
import { Activity, ExternalLink, Clock, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
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

const verdictStyles: Record<string, { color: string; bg: string; icon: any }> = {
  Qualified: { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  Maybe: { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  "Not Qualified": { color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", icon: <XCircle className="w-3.5 h-3.5" /> },
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
    } catch {
      /* silently retry on next interval */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudits();
    const interval = setInterval(fetchAudits, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 pt-24 max-w-5xl space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest">
            <Activity className="w-3 h-3 animate-pulse" /> Live Feed
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold gradient-text glow-text font-serif">
            Audit History
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm leading-relaxed">
            Every audit that passes through the Nexa Bridge is recorded here with verifiable onchain proofs.
          </p>
        </div>

        {/* Stats Summary */}
        {audits.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="glass-card p-4 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Total Audits</p>
              <p className="text-2xl font-bold text-foreground font-mono">{audits.length}</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Avg Score</p>
              <p className="text-2xl font-bold text-primary font-mono">
                {Math.round(audits.reduce((s, a) => s + a.matchScore, 0) / audits.length)}
              </p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Success Rate</p>
              <p className="text-2xl font-bold text-emerald-400 font-mono">
                {Math.round((audits.filter((a) => a.verdict === "Qualified").length / audits.length) * 100)}%
              </p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Latest</p>
              <p className="text-lg font-bold text-foreground font-mono">
                {audits[0] ? timeAgo(audits[0].completedAt) : "--"}
              </p>
            </div>
          </div>
        )}

        {/* Audit List */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Loading audit history...</p>
          </div>
        ) : audits.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Activity className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">No Audits Yet</h3>
            <p className="text-sm text-muted-foreground">Run your first audit to see it appear here with full onchain verification.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {audits.map((audit) => {
              const style = verdictStyles[audit.verdict] || verdictStyles["Maybe"];
              const isExpanded = expanded === audit.id;

              return (
                <div key={audit.id + audit.completedAt} className="glass-card overflow-hidden transition-all">
                  {/* Row */}
                  <button
                    onClick={() => setExpanded(isExpanded ? null : audit.id)}
                    className="w-full flex items-center gap-4 p-4 md:p-5 text-left hover:bg-primary/5 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-bold text-foreground text-sm truncate">{audit.jobTitle}</h4>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${style.bg} ${style.color}`}>
                          {style.icon} {audit.verdict}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {audit.id} • {audit.seniority} • {audit.paymentAsset}
                      </p>
                    </div>
                    <div className="text-right shrink-0 hidden md:block">
                      <p className="text-lg font-bold font-mono text-foreground">{audit.matchScore}<span className="text-xs text-muted-foreground">/100</span></p>
                      <p className="text-[10px] text-muted-foreground">{timeAgo(audit.completedAt)}</p>
                    </div>
                    <div className="text-lg font-bold font-mono text-foreground md:hidden">{audit.matchScore}</div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 md:px-5 pb-5 space-y-4 border-t border-border/30 pt-4 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                      <p className="text-sm italic text-muted-foreground leading-relaxed">{audit.explanation}</p>

                      {/* Skills */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold mb-2">Matched Skills</p>
                          <div className="flex flex-wrap gap-1">
                            {audit.matchedSkills?.map((s) => (
                              <span key={s} className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">{s}</span>
                            ))}
                            {(!audit.matchedSkills || audit.matchedSkills.length === 0) && <span className="text-xs text-muted-foreground">None</span>}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-red-400 font-bold mb-2">Missing Skills</p>
                          <div className="flex flex-wrap gap-1">
                            {audit.missingSkills?.map((s) => (
                              <span key={s} className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 text-[10px] font-bold border border-red-500/20">{s}</span>
                            ))}
                            {(!audit.missingSkills || audit.missingSkills.length === 0) && <span className="text-xs text-muted-foreground">None</span>}
                          </div>
                        </div>
                      </div>

                      {/* Proof Links */}
                      <div className="flex flex-wrap gap-2">
                        {audit.stellarPaymentHash && (
                          <a href={`${STELLAR_EXPLORER}${audit.stellarPaymentHash}`} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/80 border border-border/50 text-xs font-mono text-primary hover:border-primary/40 transition-all">
                            ⭐ Payment <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {audit.stellarAttestationHash && (
                          <a href={`${STELLAR_EXPLORER}${audit.stellarAttestationHash}`} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/80 border border-border/50 text-xs font-mono text-primary hover:border-primary/40 transition-all">
                            🔗 Attestation <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {audit.genLayerHash && (
                          <a href={`https://studio.genlayer.com/explorer/tx/${audit.genLayerHash}`} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/80 border border-border/50 text-xs font-mono text-primary hover:border-primary/40 transition-all">
                            🧠 GenLayer <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      <p className="text-[10px] text-muted-foreground">
                        Completed {new Date(audit.completedAt).toLocaleString()} • Consensus in {audit.elapsedSeconds}s
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
