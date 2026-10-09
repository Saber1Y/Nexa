import { 
  ShieldCheck, Zap, Cpu, Network, Scale,
  CreditCard, Target, Globe,
  Lock, ArrowRight, Rocket
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import ProofFooter from "@/components/ProofFooter";

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
              <span className="gradient-text">BOT Chain-Paid</span>
              <br />
              <span className="text-foreground" style={{ fontSize: "0.7em" }}>AI Bridge</span>
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed tracking-wide">
              <span style={{ color: "var(--neon-green)" }}>&gt;</span> Pay 0.10 USDT through NexaGateway, receive a Gemini-powered audit, and verify its payment and result receipt on BOT Chain Mainnet.
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
                <span style={{ color: "var(--neon-green)" }}>&gt;</span> Your wallet pays NexaGateway directly. The API verifies the transaction before the audit runs and writes a result receipt afterward.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-sm font-display font-bold uppercase tracking-wider flex items-center gap-2">
                  <Target className="w-4 h-4" style={{ color: "var(--neon-green)" }} /> BOT Chain as Payment Rail
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed tracking-wide">
                  Nexa uses <strong className="text-foreground">direct wallet payments</strong>. Approve USDT for NexaGateway if needed, then confirm the 0.10 USDT `pay` transaction on BOT Chain Mainnet.
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

          {/* Direct Gateway Flow */}
          <section className="space-y-8 py-8 border-y" style={{ borderColor: "rgba(0,255,136,0.1)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center border" style={{ borderColor: "var(--neon-cyan)", boxShadow: "0 0 6px rgba(0,212,255,0.15)" }}>
                <Zap className="w-5 h-5" style={{ color: "var(--neon-cyan)" }} />
              </div>
              <h2 className="text-xl font-display font-bold uppercase tracking-wider">Direct Gateway Payment</h2>
            </div>

            <p className="text-xs text-muted-foreground tracking-wide">
              <span style={{ color: "var(--neon-green)" }}>&gt;</span> The connected wallet pays on-chain, and the API verifies that exact transaction.
            </p>

            <div className="space-y-6">
              {[
                { title: "1. Approve USDT", desc: "The wallet grants NexaGateway an allowance if the existing allowance is insufficient.", icon: ShieldCheck },
                { title: "2. Pay on BOT Chain", desc: "The wallet calls NexaGateway.pay and transfers 0.10 USDT to the registered provider.", icon: CreditCard },
                { title: "3. Verify and Audit", desc: "The API validates the payment event, runs the Gemini audit, and records the result receipt.", icon: Zap },
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
              <h2 className="text-xl font-display font-bold uppercase tracking-wider">Mainnet Service</h2>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {[
                { id: "resume-intelligence-v1", price: "0.10 USDT", endpoint: "/api/audit", desc: "AI job/candidate fit audit (score, strengths, gaps, recommendations).", neon: "var(--neon-green)" },
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


          {/* Audit Evidence */}
          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center border" style={{ borderColor: "var(--neon-magenta)", boxShadow: "0 0 6px rgba(255,0,255,0.15)" }}>
                <ShieldCheck className="w-5 h-5" style={{ color: "var(--neon-magenta)" }} />
              </div>
              <h2 className="text-xl font-display font-bold uppercase tracking-wider">Audit Evidence</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { layer: "PAYMENT PROOF", title: "NexaGateway Event", desc: "Payer, service, amount, and request hash are emitted on BOT Chain Mainnet.", neon: "var(--neon-green)" },
                { layer: "AI AUDIT", title: "Gemini Result", desc: "Gemini analyzes the job requirements against the submitted resume.", neon: "var(--neon-magenta)" },
                { layer: "RESULT INTEGRITY", title: "SHA-256 Digest", desc: "The result hash is written to the receipt registry for independent verification.", neon: "var(--neon-cyan)" },
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
              Why Nexa is Verifiable
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {[
                { icon: Lock, title: "Direct Wallet Payment", desc: "The customer signs and broadcasts the NexaGateway payment from their own wallet.", color: "var(--neon-green)" },
                { icon: Scale, title: "Registered Service", desc: "Mainnet registry records the provider, USDT asset, active status, and 0.10 USDT price.", color: "var(--neon-cyan)" },
                { icon: Cpu, title: "Gemini Inference", desc: "The API runs the AI audit only after verifying the on-chain payment.", color: "var(--neon-magenta)" },
                { icon: Rocket, title: "On-chain Proof", desc: "Gateway and receipt-registry transactions are available on BOT Scan.", color: "var(--neon-green)" },
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
          <ProofFooter />
        </main>
      </div>
    </div>
  );
};

export default Docs;
