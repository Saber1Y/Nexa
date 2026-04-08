import { useState, useCallback, useEffect } from "react";
import { Upload, FileText } from "lucide-react";
import { extractTextFromPDF } from "@/lib/pdf-extract";

interface ResumeInputProps {
  resumeText: string;
  onResumeTextChange: (text: string) => void;
}

const ResumeInput = ({ resumeText, onResumeTextChange }: ResumeInputProps) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!resumeText) setFileName(null);
  }, [resumeText]);

  const handleFile = useCallback(async (file: File) => {
    if (file.type !== "application/pdf") return;
    setFileName(file.name);
    setExtracting(true);
    try {
      const text = await extractTextFromPDF(file);
      onResumeTextChange(text);
    } catch (e) {
      console.error("PDF extraction failed", e);
    } finally {
      setExtracting(false);
    }
  }, [onResumeTextChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* PDF Upload */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        className={`glass-card p-6 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all min-h-[220px] ${
          dragOver ? "border-primary glow-border" : "hover:border-primary/40"
        }`}
        onClick={() => document.getElementById("pdf-input")?.click()}
      >
        <input
          id="pdf-input"
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
          <Upload className="w-7 h-7 text-primary" />
        </div>
        <div className="text-center">
          <h3 className="text-sm font-semibold text-foreground">Quick PDF Upload</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {extracting ? "Extracting text..." : fileName ? `Loaded: ${fileName}` : "Drop your resume PDF here"}
          </p>
        </div>
        {fileName && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-xs">
            <FileText className="w-3.5 h-3.5 text-primary" />
            <span className="text-secondary-foreground">{fileName}</span>
          </div>
        )}
      </div>

      {/* Manual Input */}
      <div className="glass-card p-4 flex flex-col">
        <label className="text-sm font-semibold text-foreground mb-2">Manual CV Input</label>
        <textarea
          className="flex-1 min-h-[180px] bg-transparent border border-border rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Paste your resume text here, or upload a PDF to auto-fill..."
          value={resumeText}
          onChange={(e) => onResumeTextChange(e.target.value)}
        />
      </div>
    </div>
  );
};

export default ResumeInput;
