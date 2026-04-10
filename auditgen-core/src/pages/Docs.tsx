import { 
  ShieldCheck, Zap, Cpu, Network, Scale, ExternalLink,
  ChevronRight, BrainCircuit, CreditCard, Target, Globe,
  Lock, ArrowRight, Rocket
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import archImg from "@/assets/nexa-arch.png";

const Docs = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col circuit-bg">
      <Navbar />
      
      <div className="flex-1 w-full flex flex-col items-center">
        <main className="container px-4 py-8 pt-24 max-w-5xl space-y-16 w-full">
          {/* Header */}
          <div className="space-y-4 text-center md:text-left">
            <h1 className="text-4xl md:text-6xl font-black tracking-widest font-display uppercase">
              <span className="gradient-text">Stellar-Powered</span>
              <br />
              <span className="text-foreground" style={{ fontSize: "0.7em" }}>AI Bridge</span>
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed tracking-wide">
              <span style={{ color: "var(--neon-green)" }}>&gt;</span> Nexa turns Stellar into the autonomous payment infrastructure for AI agents. Pay with USDC or XLM, get decentralized AI consensus, and verify everything onchain.
            </p>
          </div>

          {/* Architecture */}
          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center border" style={{ borderColor: "var(--neon-green)", boxShadow: "0 0 6px rgba(0,255,136,0.15)" }}>
                <Network className="w-5 h-5" style={{ color: "var(--neon-green)" }} />
              </div>
              <h2 className="text-xl font-display font-bold uppercase tracking-wider">Bridge Architecture</h2>
            </div>
            
            <div className="cyber-card overflow-hidden">
              <div className="aspect-video relative overflow-hidden flex items-center justify-center bg-black/20">
                <img src={archImg} alt="Nexa Architecture Diagram" className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              </div>
              <div className="p-6 border-t border-border/50" style={{ background: "rgba(0,255,136,0.02)" }}>
                <p className="text-[10px] text-muted-foreground leading-relaxed italic tracking-wide">
                  <span style={{ color: "var(--neon-green)" }}>&gt;</span> Stellar serves as the autonomous payment and attestation layer. AI agents pay USDC/XLM via MPP, all results anchored on the Stellar ledger via Memo.hash.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-sm font-display font-bold uppercase tracking-wider flex items-center gap-2">
                  <Target className="w-4 h-4" style={{ color: "var(--neon-green)" }} /> Stellar as Payment Rail
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed tracking-wide">
                  AI agents need <strong className="text-foreground">programmable, low-cost, instant payments</strong>. Stellar's Soroban smart contracts and the Machine Payments Protocol (MPP) make this possible — agents pay via HTTP <code style={{ color: "var(--neon-green)" }}>402 Payment Required</code>.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-display font-bold uppercase tracking-wider flex items-center gap-2">
                  <Globe className="w-4 h-4" style={{ color: "var(--neon-cyan)" }} /> Stellar as Proof Layer
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed tracking-wide">
                  Every AI audit result is hashed (SHA-256) and <strong className="text-foreground">attested back on Stellar</strong> via <code style={{ color: "var(--neon-cyan)" }}>Memo.hash</code>. Tamper-proof, independently verifiable — all on the Stellar ledger.
                </p>
              </div>
            </div>
          </section>

          {/* MPP Handshake */}
          <section className="space-y-8 py-8 border-y" style={{ borderColor: "rgba(0,255,136,0.1)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center border" style={{ borderColor: "var(--neon-cyan)", boxShadow: "0 0 6px rgba(0,212,255,0.15)" }}>
                <Zap className="w-5 h-5" style={{ color: "var(--neon-cyan)" }} />
              </div>
              <h2 className="text-xl font-display font-bold uppercase tracking-wider">The MPP Handshake (402)</h2>
            </div>

            <p className="text-xs text-muted-foreground tracking-wide">
              <span style={{ color: "var(--neon-green)" }}>&gt;</span> Autonomous, header-based payment negotiation between agents and services.
            </p>

            <div className="space-y-6">
              {[
                { title: "1. Unauthorized Request (402)", desc: "Agent requests an audit. Bridge returns '402 Payment Required' with an HMAC-signed challenge.", icon: ShieldCheck },
                { title: "2. Autonomous Settlement", desc: "Agent signs a Soroban SAC 'transfer' on Stellar. Payment hash attached to 'Authorization' header.", icon: CreditCard },
                { title: "3. Onchain Verification", desc: "Bridge verifies the payment on Stellar Horizon API and acknowledges the transaction.", icon: Zap },
              ].map((step, i) => (
                <div key={i} className="flex gap-4 group">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 flex items-center justify-center text-xs font-display font-bold border z-10" style={{ borderColor: "var(--neon-green)", color: "var(--neon-green)", boxShadow: "0 0 4px rgba(0,255,136,0.15)" }}>
                      {i + 1}
                    </div>
                    {i < 2 && <div className="w-0.5 h-full -my-1" style={{ background: "rgba(0,255,136,0.15)" }} />}
                  </div>
                  <div className="pb-8 space-y-1">
                    <h4 className="text-xs font-display font-bold text-foreground uppercase tracking-wider group-hover:neon-text transition-all">{step.title}</h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed tracking-wide">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Triple Verification */}
          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center border" style={{ borderColor: "var(--neon-magenta)", boxShadow: "0 0 6px rgba(255,0,255,0.15)" }}>
                <ShieldCheck className="w-5 h-5" style={{ color: "var(--neon-magenta)" }} />
              </div>
              <h2 className="text-xl font-display font-bold uppercase tracking-wider">Triple-Verification Proof</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { layer: "STELLAR LAYER", title: "Payment Receipt", desc: "USDC or XLM transfer recorded on Stellar. Verified via Horizon.", neon: "var(--neon-green)" },
                { layer: "AI CONSENSUS", title: "GenLayer Result", desc: "5 independent AI nodes. Finality via the Equivalence Principle.", neon: "var(--neon-magenta)" },
                { layer: "BRIDGING LAYER", title: "SHA-256 Digest", desc: "Audit results hashed and anchored on Stellar via Memo.hash.", neon: "var(--neon-cyan)" },
              ].map((card) => (
                <div key={card.title} className="cyber-card p-6 space-y-3" style={{ borderColor: `${card.neon}20` }}>
                  <div className="font-label text-[8px] font-bold uppercase tracking-[0.3em]" style={{ color: card.neon }}>{card.layer}</div>
                  <h4 className="text-sm font-display font-bold uppercase tracking-wider">{card.title}</h4>
                  <p className="text-[10px] text-muted-foreground leading-relaxed tracking-wide">{card.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Production Ready */}
          <section className="cyber-card p-8 md:p-12 space-y-10" style={{ borderColor: "rgba(0,255,136,0.15)" }}>
            <h2 className="text-2xl lg:text-3xl font-black font-display uppercase tracking-wider gradient-text">
              Why Nexa is Production-Ready
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {[
                { icon: Lock, title: "Stellar-Native MPP", desc: "Built on Stellar's official Machine Payments Protocol. First real-world implementation.", color: "var(--neon-green)" },
                { icon: Scale, title: "Stellar Economics", desc: "Sub-cent fees and 5-second finality. Fee-sponsored USDC means zero gas friction.", color: "var(--neon-cyan)" },
                { icon: Cpu, title: "Onchain Verification", desc: "Triple-verified: Stellar payment, attestation, and AI consensus. Verify at /verify.", color: "var(--neon-magenta)" },
                { icon: Rocket, title: "Mainnet-Ready", desc: "Built on Testnet, designed for Mainnet. Only RPC endpoints and contract addresses change.", color: "var(--neon-green)" },
              ].map((item) => (
                <div key={item.title} className="space-y-2">
                  <h4 className="text-xs font-display font-bold uppercase tracking-wider flex items-center gap-2">
                    <item.icon className="w-4 h-4" style={{ color: item.color }} /> {item.title}
                  </h4>
                  <p className="text-[10px] text-muted-foreground leading-relaxed tracking-wide">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="pt-8 border-t border-border/30 flex justify-center">
              <Button
                size="lg"
                onClick={() => navigate("/audit")}
                className="font-display text-sm font-bold uppercase tracking-[0.15em] px-12 py-7 border-2 transition-all duration-150 hover:neon-glow-lg cyber-chamfer group"
                style={{ borderColor: "var(--neon-green)", color: "#0a0a0f", background: "var(--neon-green)" }}
              >
                Experience the Bridge
                <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </section>

          {/* Footer */}
          <footer className="py-12 border-t text-center space-y-4" style={{ borderColor: "rgba(0,255,136,0.1)" }}>
            <div className="text-[10px] text-muted-foreground tracking-[0.15em] uppercase">
              <span style={{ color: "var(--neon-green)", opacity: 0.5 }}>&gt;</span> Nexa Bridge · Decentralized AI on Stellar
            </div>
            <p className="text-[10px] text-muted-foreground tracking-[0.2em] uppercase">
              Architected by <span className="font-bold" style={{ color: "var(--neon-green)" }}>MrNetwork</span>
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default Docs;
