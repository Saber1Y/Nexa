import { useState } from "react";
import { Search, ShieldCheck, ExternalLink, CheckCircle2, XCircle, AlertTriangle, Hash, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import ScoreRing from "@/components/ScoreRing";

const STELLAR_EXPLORER = "https://stellar.expert/explorer/testnet/tx/";

const Verify = () => {
  const [hash, setHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleVerify = async () => {
    if (!hash.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${apiUrl}/api/verify/${encodeURIComponent(hash.trim())}`);
      const data = await res.json();

      if (!data.found) {
        setError("No audit found for this hash. Make sure you're using a valid Stellar attestation, payment, or GenLayer consensus hash.");
      } else {
        setResult(data.audit);
      }
    } catch {
      setError("Failed to connect to the bridge. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyDigest = () => {
    if (result?.attestationDigest) {
      navigator.clipboard.writeText(result.attestationDigest);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const verdictColor: Record<string, string> = {
    Qualified: "text-emerald-400",
    Maybe: "text-amber-400",
    "Not Qualified": "text-red-400",
  };

  const verdictIcon: Record<string, any> = {
    Qualified: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
    Maybe: <AlertTriangle className="w-5 h-5 text-amber-400" />,
    "Not Qualified": <XCircle className="w-5 h-5 text-red-400" />,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 pt-24 max-w-4xl space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
            <ShieldCheck className="w-3 h-3" /> Trustless Verification
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold gradient-text glow-text font-serif">
            Verify Any Audit
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm leading-relaxed">
            Paste a <span className="text-foreground font-semibold">Stellar attestation hash</span>, <span className="text-foreground font-semibold">payment hash</span>, or <span className="text-foreground font-semibold">GenLayer consensus hash</span> to independently verify an audit result onchain.
          </p>
        </div>

        {/* Search Bar */}
        <div className="glass-card p-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Paste a Stellar or GenLayer transaction hash..."
                value={hash}
                onChange={(e) => setHash(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-secondary/80 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all font-mono"
              />
            </div>
            <Button
              onClick={handleVerify}
              disabled={loading || !hash.trim()}
              className="gradient-primary text-primary-foreground font-semibold px-8 rounded-xl"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Search className="w-4 h-4 mr-2" /> Verify</>
              )}
            </Button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="glass-card p-6 border-red-500/20 text-center">
            <XCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
            {/* Verified Badge */}
            <div className="glass-card p-6 border-emerald-500/20 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-emerald-400">Audit Verified Onchain ✓</h3>
              <p className="text-xs text-muted-foreground mt-1">This audit result has been independently verified on the Stellar and GenLayer blockchains.</p>
            </div>

            {/* Score + Verdict */}
            <div className="glass-card p-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <ScoreRing score={result.matchScore} />
                <div className="flex-1 space-y-2 text-center md:text-left">
                  <h3 className="text-xl font-bold text-foreground">{result.jobTitle}</h3>
                  <div className="flex items-center gap-3 justify-center md:justify-start">
                    {verdictIcon[result.verdict]}
                    <span className={`text-lg font-bold ${verdictColor[result.verdict] || "text-foreground"}`}>
                      {result.verdict}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-secondary text-xs font-mono border border-border">
                      {result.seniority}
                    </span>
                  </div>
                  <p className="text-sm italic text-muted-foreground leading-relaxed">{result.explanation}</p>
                </div>
              </div>
            </div>

            {/* Onchain Proofs */}
            <div className="glass-card p-6 space-y-4">
              <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Onchain Proof Links</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {result.stellarPaymentHash && (
                  <a
                    href={`${STELLAR_EXPLORER}${result.stellarPaymentHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-card p-4 hover:border-primary/40 transition-all group"
                  >
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">⭐ Stellar Payment</p>
                    <p className="text-xs font-mono text-primary truncate group-hover:underline">
                      {result.stellarPaymentHash.slice(0, 16)}...
                    </p>
                    <ExternalLink className="w-3 h-3 text-muted-foreground mt-2" />
                  </a>
                )}
                {result.stellarAttestationHash && (
                  <a
                    href={`${STELLAR_EXPLORER}${result.stellarAttestationHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-card p-4 hover:border-primary/40 transition-all group"
                  >
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">🔗 Stellar Attestation</p>
                    <p className="text-xs font-mono text-primary truncate group-hover:underline">
                      {result.stellarAttestationHash.slice(0, 16)}...
                    </p>
                    <ExternalLink className="w-3 h-3 text-muted-foreground mt-2" />
                  </a>
                )}
                {result.genLayerHash && (
                  <a
                    href={`https://studio.genlayer.com/explorer/tx/${result.genLayerHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-card p-4 hover:border-primary/40 transition-all group"
                  >
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">🧠 GenLayer Consensus</p>
                    <p className="text-xs font-mono text-primary truncate group-hover:underline">
                      {result.genLayerHash.slice(0, 16)}...
                    </p>
                    <ExternalLink className="w-3 h-3 text-muted-foreground mt-2" />
                  </a>
                )}
              </div>
            </div>

            {/* Attestation Digest */}
            {result.attestationDigest && (
              <div className="glass-card p-6">
                <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-2">Attestation Digest (SHA-256)</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  This digest is anchored as a <code className="text-primary">Memo.hash</code> in the Stellar attestation transaction above. Compare it to verify integrity.
                </p>
                <div className="flex items-center gap-2 bg-secondary/80 rounded-lg px-4 py-3 border border-border/50">
                  <code className="text-xs font-mono text-foreground flex-1 break-all">{result.attestationDigest}</code>
                  <button onClick={copyDigest} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Timestamp */}
            <div className="text-center text-xs text-muted-foreground">
              Audit completed on {new Date(result.completedAt).toLocaleString()} • Consensus in {result.elapsedSeconds}s
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Verify;
