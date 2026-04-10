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
import BridgeAnalytics from "@/components/BridgeAnalytics";

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
            {/* Left — Text & CTA */}
            <div className="md:pl-8 lg:pl-16 text-center md:text-left">
              <h1 className="text-5xl md:text-6xl lg:text-8xl font-black tracking-widest leading-[1.05] mb-6 font-display uppercase">
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
                <span className="text-foreground font-bold">Stellar Agents</span>, anchored by decentralized AI consensus.
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

            {/* Right — Cyber Animation */}
            <div className="h-[200px] sm:h-[300px] md:h-[520px] flex items-center justify-center mt-[-20px] md:mt-0">
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
                title: "Stellar Asset Rails",
                description: "Native USDC & XLM micropayments via Soroban SAC. Fee-sponsored USDC transfers mean agents pay zero gas.",
                neon: "var(--neon-green)",
              },
              {
                icon: ShieldCheck,
                title: "Triple-Verified Proof",
                description: "Every audit anchors a SHA-256 digest on Stellar, a consensus artifact on GenLayer, and a USDC receipt.",
                neon: "var(--neon-cyan)",
              },
              {
                icon: Globe,
                title: "Chain Abstraction",
                description: "Hold USDC or XLM on Stellar. Get AI results from GenLayer. Nexa abstracts multi-chain complexity.",
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

      {/* ═══════ MPP 402 FLOW ═══════ */}
      <section className="relative py-24 border-t" style={{ borderColor: "rgba(0,255,136,0.1)", background: "rgba(0,255,136,0.01)" }}>
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16">
            <p className="font-label text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: "var(--neon-cyan)" }}>
              &gt; PROTOCOL_HANDSHAKE
            </p>
            <h2 className="text-3xl md:text-5xl font-black text-foreground font-display uppercase tracking-wider">
              The <span className="gradient-text">MPP 402</span> Flow
            </h2>
            <p className="text-sm text-muted-foreground mt-4 max-w-2xl mx-auto tracking-wide">
              Autonomous payment negotiation via HTTP 402 — AI agents pay without human intervention.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: "01", icon: ShieldCheck, title: "Challenge", description: "Bridge issues 402 challenge with HMAC-bound ID." },
              { step: "02", icon: Wallet, title: "Settle", description: "Agent signs 1 USDC or XLM Soroban transfer on Stellar." },
              { step: "03", icon: BrainCircuit, title: "Audit", description: "5 GenLayer AI nodes reach consensus on the resume." },
              { step: "04", icon: Award, title: "Anchor", description: "SHA-256 proof is anchored back on Stellar Memo." },
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

      {/* ═══════ PRODUCTION READY ═══════ */}
      <section className="relative py-24 border-t" style={{ borderColor: "rgba(0,255,136,0.1)" }}>
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <p className="font-label text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: "var(--neon-magenta)" }}>
              &gt; PRODUCTION_GRADE
            </p>
            <h2 className="text-3xl md:text-5xl font-black text-foreground font-display uppercase tracking-wider">
              Production <span className="gradient-text">Ready</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Lock, title: "Trust Selection", description: "Agent reputation scoring via onchain attestation history. Each audit builds a verifiable trust graph." },
              { icon: Scale, title: "Built-in Arbitration", description: "GenLayer's Equivalence Principle provides consensus across 5 independent AI validators." },
              { icon: Rocket, title: "Stellar-Scale Throughput", description: "5-second finality and sub-cent fees enable high-volume audit registries at scale." },
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
              { icon: Fuel, label: "Fee-Sponsored USDC", color: "var(--neon-green)" },
              { icon: ShieldCheck, label: "OpenZeppelin Compatible", color: "var(--neon-cyan)" },
              { icon: Globe, label: "Mainnet Ready", color: "var(--neon-magenta)" },
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
            Experience the future of autonomous value transfer on the Stellar network.
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

      {/* ═══════ FOOTER ═══════ */}
      <footer className="border-t py-12" style={{ borderColor: "rgba(0,255,136,0.1)" }}>
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] text-muted-foreground tracking-[0.15em] uppercase">
          <div>
            <span style={{ color: "var(--neon-green)", opacity: 0.5 }}>&gt;</span> Nexa Bridge · Agents on Stellar
          </div>
          <div>
            Created by{" "}
            <a href="https://x.com/encrypt_wizard" target="_blank" rel="noopener noreferrer" className="font-bold hover:underline" style={{ color: "var(--neon-green)" }}>
              MrNetwork
            </a>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://stellar.org" target="_blank" className="hover:text-foreground transition-colors">Stellar</a>
            <a href="https://genlayer.com" target="_blank" className="hover:text-foreground transition-colors">GenLayer</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
