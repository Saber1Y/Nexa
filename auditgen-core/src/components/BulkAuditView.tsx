import { useState } from "react";
import { Upload, Users, FileText, Trash2, AlertCircle, Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const BulkAuditView = () => {
  const [mockFiles] = useState([
    { id: 1, name: "Applicant_Rivera_CV.pdf", size: "1.2 MB", status: "Ready" },
    { id: 2, name: "Applicant_Chen_Resume.pdf", size: "840 KB", status: "Ready" },
    { id: 3, name: "Applicant_Smith_Bio.pdf", size: "2.1 MB", status: "Ready" },
  ]);

  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleNotify = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${apiUrl}/api/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to subscribe");
      }
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 opacity-80 pointer-events-none select-none relative">
      {/* Overlay Banner */}
      <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/20 backdrop-blur-[2px] rounded-xl border border-primary/20 pointer-events-auto">
        <div className="glass-card p-8 text-center max-w-md shadow-2xl border-primary/30 animate-pulse-glow">
          <h3 className="text-xl font-bold text-foreground mb-2 font-serif">Bulk Registry v2.0</h3>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Bulk recruiting mode is currently in development. This feature requires the <span className="text-primary font-semibold">GenLayer v2.0 Protocol upgrade</span> for batch consensus.
          </p>

          {submitted ? (
            <div className="flex flex-col items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              <p className="text-sm font-semibold text-emerald-500">You're on the list!</p>
              <p className="text-xs text-muted-foreground">We'll notify you as soon as Bulk Registry goes live.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleNotify()}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-secondary/80 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  />
                </div>
                <Button
                  onClick={handleNotify}
                  disabled={submitting}
                  className="gradient-primary text-primary-foreground font-semibold px-6 whitespace-nowrap"
                >
                  {submitting ? "..." : "Notify Me"}
                </Button>
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Bulk Header */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">Candidate Registry</h3>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold uppercase tracking-widest">
          <AlertCircle className="w-3 h-3" /> In Development
        </div>
      </div>

      {/* Multi-Dropzone */}
      <div className="glass-card p-10 border-dashed border-2 border-border/50 flex flex-col items-center justify-center text-center gap-4 hover:border-primary/40 transition-all">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
          <Upload className="w-8 h-8 text-muted-foreground" />
        </div>
        <div>
          <h4 className="font-semibold text-foreground">Drop Multiple CVs</h4>
          <p className="text-xs text-muted-foreground mt-1">Upload up to 50 candidates for parallel AI consensus</p>
        </div>
      </div>

      {/* Candidate List Table */}
      <div className="glass-card overflow-hidden border-border/30">
        <table className="w-full text-left text-sm">
          <thead className="bg-secondary/50 border-b border-border/50">
            <tr>
              <th className="px-6 py-4 font-semibold text-muted-foreground">Candidate File</th>
              <th className="px-6 py-4 font-semibold text-muted-foreground">Size</th>
              <th className="px-6 py-4 font-semibold text-muted-foreground">Status</th>
              <th className="px-6 py-4 font-semibold text-muted-foreground text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {mockFiles.map((file) => (
              <tr key={file.id} className="hover:bg-primary/5 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="font-medium text-foreground">{file.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-muted-foreground">{file.size}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">
                    {file.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mock Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Batches", value: "0" },
          { label: "Avg. Consensus Time", value: "--" },
          { label: "Registry Storage", value: "On-chain Result Receipts" },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-4 text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">{stat.label}</p>
            <p className="text-lg font-bold text-foreground font-mono">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BulkAuditView;
