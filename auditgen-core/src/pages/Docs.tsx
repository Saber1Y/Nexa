import { 
  ShieldCheck, Zap, Cpu, Network, Scale, ExternalLink,
  ChevronRight, BrainCircuit, CreditCard, Target, Globe,
  Lock, ArrowRight, Rocket
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

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
              <span className="gradient-text">x402-Powered</span>
              <br />
              <span className="text-foreground" style={{ fontSize: "0.7em" }}>AI Bridge</span>
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed tracking-wide">
              <span style={{ color: "var(--neon-green)" }}>&gt;</span> Nexa turns BOT Chain into the autonomous payment infrastructure for AI agents. Pay 0.10 tUSDT via x402 + Permit2, get an AI screening verdict, and verify everything onchain.
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
            
            <div className="cyber-card p-6" style={{ background: "rgba(0,255,136,0.02)" }}>
              <p className="text-[10px] text-muted-foreground leading-relaxed italic tracking-wide">
                <span style={{ color: "var(--neon-green)" }}>&gt;</span> BOT Chain serves as the autonomous payment layer. AI agents pay tUSDT via x402 + Permit2, with an on-chain payment receipt and a signed result hash for every audit.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-sm font-display font-bold uppercase tracking-wider flex items-center gap-2">
                  <Target className="w-4 h-4" style={{ color: "var(--neon-green)" }} /> BOT Chain as Payment Rail
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed tracking-wide">
                  AI agents need <strong className="text-foreground">programmable, low-cost, instant payments</strong>. The x402 protocol and Uniswap's Permit2 make this possible - agents pay via HTTP <code style={{ color: "var(--neon-green)" }}>402 Payment Required</code> with a single EIP-712 signature.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-display font-bold uppercase tracking-wider flex items-center gap-2">
                  <Globe className="w-4 h-4" style={{ color: "var(--neon-cyan)" }} /> Receipts as Proof Layer
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed tracking-wide">
                  Every AI audit result is hashed (SHA-256) and <strong className="text-foreground">bound to its payment receipt</strong>. Tamper-proof, independently verifiable - on-chain and off-chain.
                </p>
              </div>
            </div>
          </section>

          {/* x402 Handshake */}
          <section className="space-y-8 py-8 border-y" style={{ borderColor: "rgba(0,255,136,0.1)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center border" style={{ borderColor: "var(--neon-cyan)", boxShadow: "0 0 6px rgba(0,212,255,0.15)" }}>
                <Zap className="w-5 h-5" style={{ color: "var(--neon-cyan)" }} />
              </div>
              <h2 className="text-xl font-display font-bold uppercase tracking-wider">The x402 Handshake (402)</h2>
            </div>

            <p className="text-xs text-muted-foreground tracking-wide">
              <span style={{ color: "var(--neon-green)" }}>&gt;</span> Autonomous, header-based payment negotiation between agents and services.
            </p>

            <div className="space-y-6">
              {[
                { title: "1. Unauthorized Request (402)", desc: "Agent requests an audit. Service returns '402 Payment Required' with exact price, asset and pay-to terms.", icon: ShieldCheck },
                { title: "2. Autonomous Settlement", desc: "Agent signs an EIP-712 Permit2 authorization for 0.10 tUSDT. Signature sent in the 'PAYMENT-SIGNATURE' header.", icon: CreditCard },
                { title: "3. Onchain Verification", desc: "Service settles the transfer on BOT Chain and returns the signed result with the payment tx.", icon: Zap },
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

          {/* Services */}
          <section className="space-y-8 py-8 border-y" style={{ borderColor: "rgba(0,255,136,0.1)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center border" style={{ borderColor: "var(--neon-cyan)", boxShadow: "0 0 6px rgba(0,212,255,0.15)" }}>
                <Cpu className="w-5 h-5" style={{ color: "var(--neon-cyan)" }} />
              </div>
              <h2 className="text-xl font-display font-bold uppercase tracking-wider">Machine-Payable Services (x402)</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { id: "resume-intelligence-v1", price: "0.10 tUSDT", endpoint: "/api/audit", desc: "AI job/candidate fit audit (score, strengths, gaps, recommendations).", neon: "var(--neon-green)" },
                { id: "jd-resume-match-v1", price: "0.05 tUSDT", endpoint: "/api/match", desc: "Semantic JD↔resume match with overlaps/gaps and verdict.", neon: "var(--neon-cyan)" },
                { id: "skills-extraction-v1", price: "0.025 tUSDT", endpoint: "/api/skills", desc: "Extracts hard/soft skills, tools, frameworks, certifications, years.", neon: "var(--neon-magenta)" },
              ].map((svc) => (
                <div key={svc.id} className="cyber-card p-6 space-y-3" style={{ borderColor: `${svc.neon}20` }}>
                  <div className="font-label text-[8px] font-bold uppercase tracking-[0.3em]" style={{ color: svc.neon }}>{svc.price}</div>
                  <h4 className="text-sm font-display font-bold uppercase tracking-wider">{svc.id}</h4>
                  <p className="text-[9px] text-muted-foreground leading-relaxed tracking-wide font-mono">{svc.endpoint}</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed tracking-wide">{svc.desc}</p>
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
                { layer: "PAYMENT LAYER", title: "tUSDT Receipt", desc: "0.10 tUSDT transfer recorded on BOT Chain. Verified on BOT Scan.", neon: "var(--neon-green)" },
                { layer: "AI CONSENSUS", title: "AI Screening Result", desc: "AI validators screen the resume and return a scored verdict.", neon: "var(--neon-magenta)" },
                { layer: "BRIDGING LAYER", title: "SHA-256 Digest", desc: "Audit results hashed (SHA-256) and bound to the payment receipt.", neon: "var(--neon-cyan)" },
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
                { icon: Lock, title: "BOT-Chain x402", desc: "Built on the x402 payment standard and Uniswap Permit2. One signature per audit.", color: "var(--neon-green)" },
                { icon: Scale, title: "Micro-Payment Economics", desc: "Sub-cent testnet fees. Permit2 approvals are one-time, then each audit is a single signature.", color: "var(--neon-cyan)" },
                { icon: Cpu, title: "Onchain Verification", desc: "Triple-verified: tUSDT payment, result receipt, and AI consensus. Verify at /verify.", color: "var(--neon-magenta)" },
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
              <span style={{ color: "var(--neon-green)", opacity: 0.5 }}>&gt;</span> Nexa Bridge · Decentralized AI on BOT Chain
            </div>
            <p className="text-[10px] text-muted-foreground tracking-[0.2em] uppercase">
              Powered by <span className="font-bold" style={{ color: "var(--neon-green)" }}>BOT Chain</span>
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default Docs;
