import { useNavigate } from "react-router-dom";
import BridgeAnimation from "@/components/BridgeAnimation";
import {
  BrainCircuit,
  ShieldCheck,
  Scale,
  ArrowRight,
  ChevronRight,
  Cpu,
  Globe,
  Lock,
  Rocket,
  Fuel,
  Award,
  Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import LanguageMarquee from "@/components/LanguageMarquee";
import RoadmapBento from "@/components/RoadmapBento";
import ProofFooter from "@/components/ProofFooter";
import BridgeAnalytics from "@/components/BridgeAnalytics";
import { BOT_CHAIN_NAME } from "@/utils/botChain";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Circuit grid background */}
      <div className="fixed inset-0 pointer-events-none circuit-bg" />
      {/* Neon ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[150px]" style={{ background: "rgba(0,255,136,0.04)" }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full blur-[120px]" style={{ background: "rgba(255,0,255,0.03)" }} />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full blur-[100px]" style={{ background: "rgba(0,212,255,0.03)" }} />
      </div>

      <Navbar />

      {/* ═══════ HERO ═══════ */}
      <section className="relative pt-28 pb-0 md:pt-40 md:pb-32">
        <div className="container mx-auto px-4 relative z-10 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-4 items-center">
            {/* Left — Text & CTA (7 cols) */}
            <div className="md:col-span-7 md:pl-8 lg:pl-16 text-center md:text-left relative z-10">
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-[0.12em] leading-[1.05] mb-6 font-display uppercase">
                <span
                  className="cyber-glitch block"
                  data-text="AUTONOMOUS"
                  style={{ color: "var(--neon-green)", textShadow: "0 0 20px rgba(0,255,136,0.4)" }}
                >
                  AUTONOMOUS
                </span>
                <span className="block text-foreground mt-2" style={{ fontSize: "0.65em" }}>
                  AI BRIDGE
                </span>
              </h1>

              <p className="text-sm md:text-base text-muted-foreground max-w-xl mb-10 leading-relaxed tracking-wide mx-auto md:mx-0">
                <span style={{ color: "var(--neon-green)" }}>&gt;</span> The native payment infrastructure for{" "}
                <span className="text-foreground font-bold">AI services</span>, paid directly in USDT on {BOT_CHAIN_NAME}.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
                <Button
                  size="lg"
                  onClick={() => navigate("/audit")}
                  className="font-display text-sm font-bold uppercase tracking-[0.15em] px-10 py-6 border-2 transition-all duration-150 hover:neon-glow-lg cyber-chamfer group"
                  style={{ borderColor: "var(--neon-green)", color: "#0a0a0f", background: "var(--neon-green)" }}
                >
                  LAUNCH BRIDGE
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </div>

            {/* Right — Cyber Animation (5 cols) */}
            <div className="md:col-span-5 h-[200px] sm:h-[300px] md:h-[520px] flex items-center justify-center mt-[-20px] md:mt-0">
              <BridgeAnimation />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ BRIDGE ANALYTICS ═══════ */}
      <section className="relative py-12 border-t" style={{ borderColor: "rgba(0,255,136,0.1)" }}>
        <div className="container mx-auto px-4 max-w-6xl">
          <BridgeAnalytics />
        </div>
      </section>

      {/* ═══════ MARQUEE ═══════ */}
      <LanguageMarquee />

      {/* ═══════ WHY NEXA ═══════ */}
      <section className="relative py-24 border-t" style={{ borderColor: "rgba(0,255,136,0.1)" }}>
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <p className="font-label text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: "var(--neon-green)" }}>
              &gt; WHY_NEXA
            </p>
            <h2 className="text-3xl md:text-5xl font-black text-foreground font-display uppercase tracking-wider">
              Built for <span className="gradient-text">Agentic Economies</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Cpu,
                title: "USDT Payment Rails",
                description: "0.10 USDT audits paid directly through NexaGateway on BOT Chain Mainnet.",
                neon: "var(--neon-green)",
              },
              {
                icon: ShieldCheck,
                title: "Payment and Result Proof",
                description: "Every audit returns its payment transaction, a SHA-256 result hash, and an on-chain receipt.",
                neon: "var(--neon-cyan)",
              },
              {
                icon: Globe,
                title: "Transparent Payment",
                description: "Your wallet calls NexaGateway directly. The API verifies the payment before running the audit.",
                neon: "var(--neon-magenta)",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="cyber-card p-8 group transition-all duration-200 hover:-translate-y-1"
              >
                <div
                  className="w-12 h-12 flex items-center justify-center mb-5 border transition-colors"
                  style={{ borderColor: feature.neon, boxShadow: `0 0 8px ${feature.neon}30` }}
                >
                  <feature.icon className="w-6 h-6" style={{ color: feature.neon }} />
                </div>
                <h3 className="text-sm font-display font-bold text-foreground mb-2 uppercase tracking-wider">
                  {feature.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed tracking-wide">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ DIRECT PAYMENT FLOW ═══════ */}
      <section className="relative py-24 border-t" style={{ borderColor: "rgba(0,255,136,0.1)", background: "rgba(0,255,136,0.01)" }}>
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16">
            <p className="font-label text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: "var(--neon-cyan)" }}>
              &gt; DIRECT_GATEWAY_FLOW
            </p>
            <h2 className="text-3xl md:text-5xl font-black text-foreground font-display uppercase tracking-wider">
              The <span className="gradient-text">Payment</span> Flow
            </h2>
            <p className="text-sm text-muted-foreground mt-4 max-w-2xl mx-auto tracking-wide">
              Connect your wallet, confirm the USDT payment, and receive an auditable result.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: "01", icon: ShieldCheck, title: "Approve", description: "Approve USDT for NexaGateway if your wallet has not approved it yet." },
              { step: "02", icon: Wallet, title: "Pay", description: "Confirm the 0.10 USDT NexaGateway payment in your wallet." },
              { step: "03", icon: BrainCircuit, title: "Audit", description: "Gemini analyzes the resume after the API verifies your payment." },
              { step: "04", icon: Award, title: "Verify", description: "Check the payment transaction and result receipt on BOT Scan." },
            ].map((step, i) => (
              <div key={step.step} className="relative group">
                <div className="cyber-card p-6 h-full bg-background/50">
                  <span className="text-3xl font-black font-display block mb-3" style={{ color: "var(--neon-green)", opacity: 0.15 }}>
                    {step.step}
                  </span>
                  <div className="w-10 h-10 flex items-center justify-center mb-4 border" style={{ borderColor: "var(--neon-green)", boxShadow: "0 0 6px rgba(0,255,136,0.15)" }}>
                    <step.icon className="w-5 h-5" style={{ color: "var(--neon-green)" }} />
                  </div>
                  <h3 className="text-sm font-display font-bold text-foreground mb-1.5 uppercase tracking-wider">
                    {step.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed tracking-wide">
                    {step.description}
                  </p>
                </div>
                {i < 3 && (
                  <ChevronRight className="hidden md:block absolute top-1/2 -right-4 w-5 h-5 -translate-y-1/2 z-10" style={{ color: "var(--neon-green)", opacity: 0.3 }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ VERIFIABLE PAYMENTS ═══════ */}
      <section className="relative py-24 border-t" style={{ borderColor: "rgba(0,255,136,0.1)" }}>
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <p className="font-label text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: "var(--neon-magenta)" }}>
              &gt; ONCHAIN_VERIFICATION
            </p>
            <h2 className="text-3xl md:text-5xl font-black text-foreground font-display uppercase tracking-wider">
              Built for <span className="gradient-text">Verification</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Lock, title: "Direct Wallet Payment", description: "The user signs the payment transaction from their wallet to NexaGateway." },
              { icon: Scale, title: "On-chain Service Terms", description: "The registry stores the active service, its provider, payment asset, and price." },
              { icon: Rocket, title: "Verifiable Receipts", description: "A result hash and payment details can be checked against BOT Chain records." },
            ].map((feature) => (
              <div key={feature.title} className="cyber-card p-8 group hover:-translate-y-1 transition-all duration-200">
                <div className="w-12 h-12 flex items-center justify-center mb-5 border" style={{ borderColor: "var(--neon-magenta)", boxShadow: "0 0 8px rgba(255,0,255,0.15)" }}>
                  <feature.icon className="w-6 h-6" style={{ color: "var(--neon-magenta)" }} />
                </div>
                <h3 className="text-sm font-display font-bold text-foreground mb-2 uppercase tracking-wider">{feature.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed tracking-wide">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {[
              { icon: Fuel, label: "Direct USDT Payment", color: "var(--neon-green)" },
              { icon: ShieldCheck, label: "On-chain Receipt", color: "var(--neon-cyan)" },
              { icon: Globe, label: BOT_CHAIN_NAME, color: "var(--neon-magenta)" },
            ].map((badge) => (
              <span
                key={badge.label}
                className="inline-flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.15em] border cyber-chamfer-sm"
                style={{ borderColor: `${badge.color}40`, color: badge.color, background: `${badge.color}08` }}
              >
                <badge.icon className="w-3.5 h-3.5" /> {badge.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FINAL CTA ═══════ */}
      <section className="relative py-32">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-3xl md:text-5xl font-black text-foreground mb-6 font-display uppercase tracking-wider">
            Ready to <span className="gradient-text">bridge</span>
            <span className="animate-blink" style={{ color: "var(--neon-green)" }}>_</span>
          </h2>
          <p className="text-muted-foreground mb-10 text-sm tracking-wide">
            Experience the future of autonomous value transfer on BOT Chain.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/audit")}
            className="font-display text-base font-bold uppercase tracking-[0.15em] px-12 py-8 border-2 transition-all duration-150 hover:neon-glow-lg cyber-chamfer group"
            style={{ borderColor: "var(--neon-green)", color: "#0a0a0f", background: "var(--neon-green)" }}
          >
            LAUNCH BRIDGE
            <ArrowRight className="w-6 h-6 ml-2 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </section>

      <ProofFooter />
    </div>
  );
};

export default Landing;
