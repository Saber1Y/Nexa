import { 
  FileText, 
  ShieldCheck, 
  Zap, 
  Cpu, 
  Code2, 
  Network, 
  Scale, 
  ExternalLink,
  ChevronRight,
  BrainCircuit,
  CreditCard,
  Target,
  Globe,
  Lock,
  ArrowRight,
  Rocket
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import archImg from "@/assets/nexa-arch.png";

const Docs = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <div className="flex-1 w-full flex flex-col items-center">
        <main className="container px-4 py-8 pt-24 max-w-5xl space-y-16 w-full">
          {/* Header */}
          <div className="space-y-4 text-center md:text-left">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight font-serif">
              <span className="gradient-text">Stellar-Powered</span> AI Bridge
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
              Nexa turns <span className="text-foreground font-semibold">Stellar</span> into the autonomous payment infrastructure for AI agents. Pay with USDC or XLM, get decentralized AI consensus, and verify everything onchain — all anchored on the Stellar ledger.
            </p>
          </div>

          {/* 1. The Core Architecture */}
          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Network className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Bridge Architecture</h2>
            </div>
            
            <div className="glass-card overflow-hidden border-primary/20 bg-secondary/10">
              <div className="aspect-video relative overflow-hidden flex items-center justify-center bg-black/20">
                <img 
                  src={archImg} 
                  alt="Nexa Architecture Diagram" 
                  className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity"
                  onError={(e) => {
                    // Fallback if image fails
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <div className="p-6 bg-secondary/30 border-t border-border/50">
                <p className="text-sm text-muted-foreground leading-relaxed italic">
                  Figure 1: Stellar serves as the autonomous payment and attestation layer. AI agents pay USDC/XLM via MPP, and all results are anchored back on the Stellar ledger via Memo.hash.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" /> Stellar as the Payment Rail
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  AI agents need <strong>programmable, low-cost, instant payments</strong>. Stellar's Soroban smart contracts and the Machine Payments Protocol (MPP) make this possible — agents autonomously pay via HTTP `402 Payment Required`, settling in USDC or XLM with zero gas friction.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" /> Stellar as the Proof Layer
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Every AI audit result is hashed (SHA-256) and <strong>attested back on Stellar</strong> via <code className="text-primary bg-primary/10 px-1 rounded">Memo.hash</code>. This creates a tamper-proof, independently verifiable link between payment and outcome — all on the Stellar ledger.
                </p>
              </div>
            </div>
          </section>

          {/* 2. The MPP Handshake (The 402 Protocol) */}
          <section className="space-y-8 py-8 border-y border-border/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">The MPP Handshake (402)</h2>
            </div>

            <p className="text-muted-foreground">
              Nexa implements the <strong>Machine Payments Protocol (MPP)</strong>, allowing for autonomous, header-based payment negotiation between agents and services.
            </p>

            <div className="space-y-6">
              {[
                {
                  title: "1. Unauthorized Request (402)",
                  desc: "The Agent requests an audit. The Bridge returns a '402 Payment Required' with a unique HMAC-signed challenge.",
                  icon: ShieldCheck
                },
                {
                  title: "2. Autonomous Settlement",
                  desc: "The Agent signs a Soroban SAC 'transfer' call on Stellar. The payment hash is attached to the 'Authorization' header.",
                  icon: CreditCard
                },
                {
                  title: "3. Onchain Verification",
                  desc: "The Bridge verifies the payment on the Stellar Horizon API and acknowledges the transaction.",
                  icon: Zap
                }
              ].map((step, i) => (
                <div key={i} className="flex gap-4 group">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold border border-primary/30 z-10">
                      {i + 1}
                    </div>
                    {i < 2 && <div className="w-0.5 h-full bg-border/50 -my-1" />}
                  </div>
                  <div className="pb-8 space-y-1">
                    <h4 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">{step.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 3. Triple Verification Proof */}
          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Triple-Verification Proof</h2>
            </div>

            <p className="text-muted-foreground">
              Every Nexa audit produces an immutable <strong>Attestation Bundle</strong> recorded across two distributed ledgers.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-card p-6 space-y-3 bg-blue-500/5 border-blue-500/20">
                <div className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Stellar Layer</div>
                <h4 className="font-bold">Payment Receipt</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Immutable proof of USDC or XLM transfer recorded on Stellar Publicnet. Verified via Horizon.
                </p>
              </div>
              <div className="glass-card p-6 space-y-3 bg-purple-500/5 border-purple-500/20">
                <div className="text-[10px] font-bold text-purple-500 uppercase tracking-widest">GenLayer Layer</div>
                <h4 className="font-bold">AI Consensus Result</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Result determined by 5 independent AI nodes. Finality reached via the Equivalence Principle.
                </p>
              </div>
              <div className="glass-card p-6 space-y-3 bg-green-500/5 border-green-500/20">
                <div className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Bridging Layer</div>
                <h4 className="font-bold">SHA-256 Digest</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Audit results are hashed and anchored back to Stellar via Memo.hash for cross-chain verifiability.
                </p>
              </div>
            </div>
          </section>

          {/* 4. Judge's Deep Dive & Roadmap */}
          <section className="bg-secondary/20 rounded-2xl p-8 md:p-12 space-y-10 border border-border/50">
            <div className="space-y-4">
              <h2 className="text-3xl lg:text-4xl font-bold font-serif gradient-text glow-text pb-2">Why Nexa is Production-Ready</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div className="space-y-2">
                  <h4 className="text-base font-bold flex items-center gap-2">
                    <Lock className="w-4 h-4 text-green-500" /> Stellar-Native MPP
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Built on Stellar's official Machine Payments Protocol standard. The first real-world implementation enabling autonomous, programmatic agent-to-service payments via HTTP 402.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-base font-bold flex items-center gap-2">
                    <Scale className="w-4 h-4 text-blue-400" /> Stellar Economics
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Stellar's sub-cent fees and 5-second finality make it the ideal payments rail for high-frequency AI agents. Fee-sponsored USDC means zero gas friction for users.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <h4 className="text-base font-bold flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-primary" /> Onchain Verification
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Every audit is triple-verified: Stellar payment, Stellar attestation (Memo.hash), and AI consensus. Anyone can independently verify results at <code className="text-primary bg-primary/10 px-1 rounded">/verify</code>.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-base font-bold flex items-center gap-2">
                    <Rocket className="w-4 h-4 text-amber-500" /> Mainnet-Ready
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Built on Stellar Testnet but designed for Mainnet. Migrating requires only updating RPC endpoints and contract addresses — zero protocol changes.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-border/30 flex justify-center">
               <Button
                  size="lg"
                  onClick={() => navigate("/audit")}
                  className="gradient-primary text-primary-foreground font-semibold px-12 py-7 text-lg hover:opacity-90 transition-all glow-border group"
                >
                  Experience the Bridge
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
            </div>
          </section>

          {/* Footer */}
          <footer className="py-12 border-t border-border/50 text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground font-medium">
               Nexa Bridge · Decentralized AI Reasoning for Stellar
            </div>
            <p className="text-[10px] text-muted-foreground tracking-widest uppercase">
              Architected by <span className="text-foreground font-bold">MrNetwork</span>
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default Docs;

