import { Loader2, ExternalLink } from "lucide-react";

interface ConsensusLoaderProps {
  genLayerHash?: string | null;
  statusMessage?: string | null;
}

const ConsensusLoader = ({ genLayerHash, statusMessage }: ConsensusLoaderProps) => {
  return (
    <div className="flex flex-col items-center gap-6 py-12">
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-4 border-primary/20 flex items-center justify-center animate-pulse-glow">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
        <div className="absolute -inset-2 rounded-full border border-primary/10 animate-ping" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-foreground">AI Validators Reaching Consensus...</h3>
        <p className="text-sm text-muted-foreground">Your resume is being audited onchain by decentralized AI nodes</p>
        {statusMessage && (
          <p className="text-xs font-mono text-primary/80 mt-1">{statusMessage}</p>
        )}
      </div>
      <div className="w-64 h-2 rounded-full bg-secondary overflow-hidden">
        <div className="h-full rounded-full gradient-primary animate-shimmer" style={{ width: "70%" }} />
      </div>

      {/* GenLayer Explorer Link — appears as soon as tx hash is available */}
      {genLayerHash && (
        <a
          href={`https://explorer-studio.genlayer.com/transactions/${genLayerHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary/10 border border-primary/25 hover:bg-primary/20 hover:border-primary/40 transition-all group"
        >
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
            <ExternalLink className="w-3 h-3 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
              View Consensus Progress
            </p>
            <p className="text-[10px] font-mono text-muted-foreground">
              {genLayerHash.slice(0, 10)}...{genLayerHash.slice(-8)}
            </p>
          </div>
        </a>
      )}
    </div>
  );
};

export default ConsensusLoader;
