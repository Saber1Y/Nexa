import { ExternalLink } from "lucide-react";

interface ConsensusLoaderProps {
  genLayerHash?: string | null;
  statusMessage?: string | null;
}

const ConsensusLoader = ({ genLayerHash, statusMessage }: ConsensusLoaderProps) => {
  return (
    <div className="flex flex-col items-center gap-6 py-12">
      {/* Spinning hexagonal indicator */}
      <div className="relative">
        <div className="w-20 h-20 flex items-center justify-center animate-pulse-glow border-2" style={{ borderColor: "var(--neon-green)", boxShadow: "0 0 15px rgba(0,255,136,0.2)" }}>
          <div className="w-8 h-8 border-2 animate-spin" style={{ borderColor: "var(--neon-green) transparent transparent transparent" }} />
        </div>
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-sm font-display font-bold uppercase tracking-wider">
          AI Validators Reaching Consensus
          <span className="animate-blink" style={{ color: "var(--neon-green)" }}>_</span>
        </h3>
        <p className="text-[10px] text-muted-foreground tracking-wide">&gt; Resume audited onchain by decentralized AI nodes</p>
        {statusMessage && (
          <p className="text-[10px] font-mono mt-1" style={{ color: "var(--neon-cyan)" }}>&gt; {statusMessage}</p>
        )}
      </div>
      <div className="w-64 h-1 bg-border overflow-hidden">
        <div className="h-full animate-shimmer" style={{ width: "70%", background: "linear-gradient(90deg, var(--neon-green), var(--neon-cyan))" }} />
      </div>

      {genLayerHash && (
        <a
          href={`https://explorer-studio.genlayer.com/transactions/${genLayerHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 border transition-all group cyber-chamfer-sm"
          style={{ borderColor: "rgba(255,0,255,0.2)", background: "rgba(255,0,255,0.03)" }}
        >
          <ExternalLink className="w-3 h-3" style={{ color: "var(--neon-magenta)" }} />
          <div className="text-left">
            <p className="text-[10px] font-display font-bold uppercase tracking-wider group-hover:neon-text-magenta transition-all">View Consensus</p>
            <p className="text-[9px] font-mono text-muted-foreground">{genLayerHash.slice(0, 10)}...{genLayerHash.slice(-8)}</p>
          </div>
        </a>
      )}
    </div>
  );
};

export default ConsensusLoader;
