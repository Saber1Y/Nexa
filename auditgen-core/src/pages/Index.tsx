import { useState, useCallback } from "react";
import { Briefcase, FileSearch, Zap, Sparkles, ExternalLink, RotateCcw, Activity, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import ResumeInput from "@/components/ResumeInput";
import ConsensusLoader from "@/components/ConsensusLoader";
import AuditResults from "@/components/AuditResults";
import { useMpp } from "@/hooks/useMpp";

const Index = () => {
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [mustHaveSkills, setMustHaveSkills] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { fetchWithMpp, isPaying, status } = useMpp();

  const handleSubmit = useCallback(async () => {
    if (!jobTitle || !resumeText) return;
    setLoading(true);
    setError(null);
    setResults(null);
    setTxHash(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3402";
      const data = await fetchWithMpp(`${apiUrl}/api/audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle,
          jobDescription,
          mustHaveSkills,
          resumeText,
        }),
      });

      if (data.success) {
        setResults(data.results);
        setTxHash(data.results.txHash || "Finalized on GenLayer");
      } else {
        throw new Error(data.error || "Audit failed");
      }
    } catch (e: unknown) {
      setError((e as Error)?.message || "Audit process failed");
    } finally {
      setLoading(false);
    }
  }, [jobTitle, jobDescription, mustHaveSkills, resumeText, fetchWithMpp]);

  const canSubmit = jobTitle.trim() && resumeText.trim() && !loading && !isPaying;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
        {/* Hero */}
        <div className="text-center space-y-3">
          <h2 className="text-3xl md:text-4xl font-extrabold gradient-text glow-text">
            AI-Powered Resume Screening
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm">
            Submit your resume for a decentralized AI audit on GenLayer. Get transparent, consensus-driven hiring insights recorded onchain.
          </p>
        </div>

        {/* Job Details */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-primary" /> Job Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Job Title *</label>
              <input
                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g. Senior Frontend Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Must-Have Skills</label>
              <input
                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g. React, TypeScript, Node.js"
                value={mustHaveSkills}
                onChange={(e) => setMustHaveSkills(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Job Description</label>
            <textarea
              className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              rows={3}
              placeholder="Paste the job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Resume Input */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <FileSearch className="w-4 h-4 text-primary" /> Resume / CV
          </h3>
          <ResumeInput resumeText={resumeText} onResumeTextChange={setResumeText} />
        </div>

        {/* Submit */}
        <div className="flex flex-col items-center gap-3">
          <Button
            size="lg"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="gradient-primary text-primary-foreground font-semibold px-8 py-3 text-base hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Run Decentralized AI Audit
          </Button>
          {!isConnected && (
            <p className="text-xs text-muted-foreground">Connect your wallet to begin</p>
          )}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        {/* Loading / Results */}
        {loading && (
          <div className="space-y-4">
            <ConsensusLoader />
            {txHash && (
              <div className="text-center">
                <a
                  href={`https://explorer-studio.genlayer.com/transactions/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Track on GenLayer Explorer
                </a>
              </div>
            )}
          </div>
        )}
        {results && !loading && (
          <div className="space-y-6">
            <AuditResults data={results} />
            {txHash && (
              <div className="text-center">
                <a
                  href={`https://explorer-studio.genlayer.com/transactions/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View on GenLayer Explorer
                </a>
              </div>
            )}
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  setJobTitle("");
                  setJobDescription("");
                  setMustHaveSkills("");
                  setResumeText("");
                  setResults(null);
                  setTxHash(null);
                  setError(null);
                }}
                className="font-semibold"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                New Review
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6 mt-12">
        <div className="container mx-auto px-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Zap className="w-3.5 h-3.5 text-primary" />
          Powered by GenLayer Blockchain
        </div>
      </footer>
    </div>
  );
};

export default Index;
