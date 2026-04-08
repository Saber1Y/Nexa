import { Loader2 } from "lucide-react";

const ConsensusLoader = () => {
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
      </div>
      <div className="w-64 h-2 rounded-full bg-secondary overflow-hidden">
        <div className="h-full rounded-full gradient-primary animate-shimmer" style={{ width: "70%" }} />
      </div>
    </div>
  );
};

export default ConsensusLoader;
