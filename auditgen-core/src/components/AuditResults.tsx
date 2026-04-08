import ScoreRing from "./ScoreRing";
import { Badge } from "@/components/ui/badge";
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

const verdictColor: Record<string, string> = {
  Qualified: "bg-success/20 text-success border-success/30",
  Maybe: "bg-warning/20 text-warning border-warning/30",
  "Not Qualified": "bg-destructive/20 text-destructive border-destructive/30",
};

const AuditResults = ({ data }: AuditResultsProps) => {
  return (
    <div className="space-y-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      {/* Score + Badges */}
      <div className="flex flex-col items-center gap-4">
        <ScoreRing score={data.match_score} />
        <div className="flex items-center gap-3">
          <span className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${verdictColor[data.verdict] || verdictColor["Maybe"]}`}>
            {data.verdict}
          </span>
          <span className="px-3 py-1 rounded bg-secondary text-secondary-foreground text-xs font-mono tracking-wider border border-border">
            {data.seniority}
          </span>
        </div>
      </div>

      {/* Skills */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-4 space-y-3">
          <h4 className="text-sm font-semibold text-success flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Matched Skills
          </h4>
          <div className="flex flex-wrap gap-2">
            {data.matched_skills.map((s) => (
              <Badge key={s} variant="secondary" className="bg-success/10 text-success border-success/20">
                {s}
              </Badge>
            ))}
            {data.matched_skills.length === 0 && <span className="text-xs text-muted-foreground">None detected</span>}
          </div>
        </div>
        <div className="glass-card p-4 space-y-3">
          <h4 className="text-sm font-semibold text-destructive flex items-center gap-2">
            <XCircle className="w-4 h-4" /> Missing Skills
          </h4>
          <div className="flex flex-wrap gap-2">
            {data.missing_skills.map((s) => (
              <Badge key={s} variant="secondary" className="bg-destructive/10 text-destructive border-destructive/20">
                {s}
              </Badge>
            ))}
            {data.missing_skills.length === 0 && <span className="text-xs text-muted-foreground">None — great match!</span>}
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div className="glass-card p-5 border-l-4 border-l-primary">
        <div className="flex items-start gap-3">
          <Quote className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-1">Key Audit Insight</h4>
            <p className="text-sm italic text-muted-foreground leading-relaxed">{data.explanation}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditResults;
