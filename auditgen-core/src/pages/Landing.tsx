import { useNavigate } from "react-router-dom";
import HeroAuditAnimation from "@/components/HeroAuditAnimation";
import {
  BrainCircuit,
  ShieldCheck,
  Scale,
  Upload,
  Search,
  Network,
  Award,
  ArrowRight,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import LanguageMarquee from "@/components/LanguageMarquee";
import RoadmapBento from "@/components/RoadmapBento";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Mesh background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-accent/5 blur-[100px]" />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-primary/3 blur-[80px]" />
      </div>

      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-28 pb-20 md:pt-40 md:pb-32">
        <div className="container mx-auto px-4 relative z-10 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-8 items-center">
            {/* Left Column – Text & CTA */}
            <div className="md:pl-8 lg:pl-16 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 font-serif">
                <span className="gradient-text glow-text">Decentralized AI</span>
                <br />
                <span className="text-foreground">Hiring Consensus</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-lg mb-10 leading-relaxed mx-auto md:mx-0">
                Verify talent with the power of onchain AI. No human bias, just
                immutable consensus on the GenLayer blockchain.
              </p>

              <div className="flex items-center justify-center md:justify-start">
                <Button
                  size="lg"
                  onClick={() => navigate("/audit")}
                  className="gradient-primary text-primary-foreground font-semibold px-10 py-6 text-lg hover:opacity-90 transition-all glow-border group"
                >
                  
                  Audit Your CV
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </div>

            {/* Right Column – Audit Animation */}
            <div className="h-[400px] md:h-[520px]">
              <HeroAuditAnimation />
            </div>
          </div>
        </div>

        {/* Decorative grid */}
        <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--border)/0.03)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border)/0.03)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />
      </section>

      {/* Language Marquee */}
      <LanguageMarquee />

      {/* Why AuditGen Section */}
      <section className="relative py-24 border-t border-border/30">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">
              Why AuditGen?
            </p>
            <h2 className="text-3xl md:text-5xl font-extrabold text-foreground font-serif">
              Hiring, <span className="gradient-text">reimagined</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: BrainCircuit,
                title: "AI-Native Consensus",
                description:
                  "Uses the Equivalence Principle to reach agreement across multiple independent AI validators.",
                accent: "primary",
              },
              {
                icon: ShieldCheck,
                title: "Immutable Proof",
                description:
                  "Every audit is permanently recorded onchain, creating a transparent record of candidate fit.",
                accent: "accent",
              },
              {
                icon: Scale,
                title: "Zero Bias",
                description:
                  "AI validators don't care about names, genders, or backgrounds—only skills and raw potential.",
                accent: "success",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="glass-card p-8 group hover:border-primary/30 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="relative py-24 border-t border-border/30">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">
              How It Works
            </p>
            <h2 className="text-3xl md:text-5xl font-extrabold text-foreground font-serif">
              Four steps to <span className="gradient-text">verified talent</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                icon: Upload,
                title: "Submit",
                description: "Input the role and CV data.",
              },
              {
                step: "02",
                icon: Search,
                title: "Validate",
                description:
                  "Five independent AI validators analyze the fit.",
              },
              {
                step: "03",
                icon: Network,
                title: "Consensus",
                description:
                  "Agreement is reached onchain via the GenLayer StudioNet.",
              },
              {
                step: "04",
                icon: Award,
                title: "Verified Audit",
                description:
                  "The final score, verdict, and seniority insights are generated.",
              },
            ].map((step, i) => (
              <div key={step.step} className="relative group">
                <div className="glass-card p-6 h-full hover:border-primary/30 transition-all duration-300 hover:-translate-y-1">
                  <span className="text-3xl font-extrabold text-primary/20 font-mono block mb-3">
                    {step.step}
                  </span>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <step.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-1.5">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
                {i < 3 && (
                  <ChevronRight className="hidden md:block absolute top-1/2 -right-4 w-5 h-5 text-border -translate-y-1/2 z-10" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Powered by GenLayer */}
      <section className="relative py-24 border-t border-border/30">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="glass-card p-10 md:p-14 border-l-4 border-l-primary relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-4">
              Powered by GenLayer
            </p>
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-5 font-serif">
              The GenVM Advantage
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed mb-8 max-w-3xl">
              Built on the GenVM (GenLayer Virtual Machine), AuditGen is the
              first of its kind to leverage cross-model LLM consensus at the
              protocol level. We don't just use AI; we use{" "}
              <span className="text-foreground font-semibold">
                decentralized AI
              </span>
              .
            </p>
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <RoadmapBento />

      {/* Final CTA */}
      <section className="relative py-24 border-t border-border/30">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4 font-serif">
            Ready to <span className="gradient-text">audit</span>?
          </h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Experience the future of decentralized hiring verification.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/audit")}
            className="gradient-primary text-primary-foreground font-semibold px-10 py-6 text-lg hover:opacity-90 transition-all glow-border group"
          >
            
            Launch Audit
            <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            AuditGen - Powered by GenLayer Blockchain
          </div>
          <div className="text-muted-foreground">
            Built by{" "}
            <a
              href="https://x.com/encrypt_wizard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-semibold"
            >
              MrNetwork
            </a>
          </div>
          <a
            href="https://explorer-studio.genlayer.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            View on Explorer
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
