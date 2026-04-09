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
  ArrowRight
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import archImg from "@/assets/nexa-arch.png";

const Docs = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 pt-24 max-w-5xl space-y-16">
        {/* Header */}
        <div className="space-y-4 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest">
            <Code2 className="w-3 h-3" /> Technical Documentation v1.0
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight font-serif">
            The <span className="gradient-text">Nexa</span> Protocol
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            A specialized bridge connecting the <span className="text-foreground font-semibold">Stellar</span> asset layer to the <span className="text-foreground font-semibold">GenLayer</span> reasoning layer for autonomous AI services.
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
          
          <div className="glass-card overflow-hidden border-primary/20">
            <img 
              src={archImg} 
              alt="Nexa Architecture Diagram" 
              className="w-full h-auto object-cover opacity-90 hover:opacity-100 transition-opacity"
            />
            <div className="p-6 bg-secondary/30 border-t border-border/50">
              <p className="text-sm text-muted-foreground leading-relaxed italic">
                Figure 1: The Nexa Bridge acts as an autonomous mediator. It uses the Machine Payments Protocol (MPP) to negotiate payments on Stellar and triggers decentralized AI consensus on GenLayer.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" /> The Reasoning Gap
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Modern AI agents excel at execution but lack a <strong>Decentralized Reasoning Layer</strong>. How does an agent know it actually performed a quality task? Nexa fills this gap by providing third-party, consensus-based validation for agentic activities.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" /> Multi-Chain Abstraction
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                High-frequency AI services shouldn't be limited by chain UX. Nexa abstracts the multi-chain complexity. Users pay in <strong>USDC on Stellar</strong> (fast, low-cost) and receive results from <strong>GenLayer</strong> (powerful AI consensus).
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
                title: "3. On-Chain Verification",
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
                Immutable proof of USDC transfer recorded on Stellar Publicnet/Testnet. Verified via Horizon.
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
            <h2 className="text-3xl font-bold font-serif italic text-primary">For the Hackathon Judges</h2>
            <p className="text-muted-foreground text-sm uppercase font-bold tracking-[0.2em]">Why Nexa is Production-Ready</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div className="space-y-2">
                <h4 className="text-base font-bold flex items-center gap-2">
                  <Lock className="w-4 h-4 text-green-500" /> Decentralized Trust
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Unlike centralized LLM APIs, Nexa ensures no single provider can bias an audit. Consensus is handled by a permissionless network of AI validators.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="text-base font-bold flex items-center gap-2">
                  <Scale className="w-4 h-4 text-blue-400" /> Scalable Economics
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  By using Stellar's Asset rails, we support micropayments that are cost-prohibitive on other L1s. Fee-sponsored USDC means zero friction for users.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <h4 className="text-base font-bold flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-primary" /> Stateless Scaling
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The Nexa Bridge is stateless, allowing for horizontal scaling across millions of agents. All state is maintained on the ledgers themselves.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="text-base font-bold flex items-center gap-2">
                  <Rocket className="w-4 h-4 text-amber-500" /> The Road to Publicnet
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Our architecture is publicnet-ready. Migrating requires only updating RPC endpoints and contract addresses—zero protocol changes needed.
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
  );
};

export default Docs;
