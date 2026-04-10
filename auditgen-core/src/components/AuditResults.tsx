import ScoreRing from "./ScoreRing";
import { CheckCircle, XCircle, Quote } from "lucide-react";

interface AuditResultsProps {
  data: {
    match_score: number;
    verdict: string;
    seniority: string;
    matched_skills: string[];
    missing_skills: string[];
    explanation: string;
  };
}

const verdictNeon: Record<string, string> = {
  Qualified: "var(--neon-green)",
  Maybe: "var(--neon-cyan)",
  "Not Qualified": "var(--neon-red)",
};

const AuditResults = ({ data }: AuditResultsProps) => {
  const neon = verdictNeon[data.verdict] || "var(--neon-cyan)";

  return (
    <div className="space-y-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      {/* Score + Badges */}
      <div className="flex flex-col items-center gap-4">
        <ScoreRing score={data.match_score} />
        <div className="flex items-center gap-3">
          <span
            className="px-4 py-1.5 text-[10px] font-display font-bold uppercase tracking-[0.15em] border"
            style={{ borderColor: `${neon}40`, color: neon, background: `${neon}08` }}
          >
            {data.verdict}
          </span>
          <span className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider border border-border">
            {data.seniority}
          </span>
        </div>
      </div>

      {/* Skills */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="cyber-card p-4 space-y-3" style={{ borderColor: "rgba(0,255,136,0.15)" }}>
          <h4 className="font-label text-[9px] uppercase tracking-[0.2em] flex items-center gap-2" style={{ color: "var(--neon-green)" }}>
            <CheckCircle className="w-3.5 h-3.5" /> Matched Skills
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {data.matched_skills.map((s) => (
              <span key={s} className="px-2 py-0.5 text-[9px] font-bold border uppercase tracking-wider" style={{ borderColor: "rgba(0,255,136,0.2)", color: "var(--neon-green)", background: "rgba(0,255,136,0.05)" }}>{s}</span>
            ))}
            {data.matched_skills.length === 0 && <span className="text-[10px] text-muted-foreground">None detected</span>}
          </div>
        </div>
        <div className="cyber-card p-4 space-y-3" style={{ borderColor: "rgba(255,51,102,0.15)" }}>
          <h4 className="font-label text-[9px] uppercase tracking-[0.2em] flex items-center gap-2" style={{ color: "var(--neon-red)" }}>
            <XCircle className="w-3.5 h-3.5" /> Missing Skills
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {data.missing_skills.map((s) => (
              <span key={s} className="px-2 py-0.5 text-[9px] font-bold border uppercase tracking-wider" style={{ borderColor: "rgba(255,51,102,0.2)", color: "var(--neon-red)", background: "rgba(255,51,102,0.05)" }}>{s}</span>
            ))}
            {data.missing_skills.length === 0 && <span className="text-[10px] text-muted-foreground">None — great match!</span>}
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div className="cyber-card p-5" style={{ borderLeft: "3px solid var(--neon-green)" }}>
        <div className="flex items-start gap-3">
          <Quote className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "var(--neon-green)" }} />
          <div>
            <h4 className="text-xs font-display font-bold uppercase tracking-wider mb-1">Key Audit Insight</h4>
            <p className="text-xs italic text-muted-foreground leading-relaxed tracking-wide">{data.explanation}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditResults;
