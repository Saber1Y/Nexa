import { useState } from "react";
import { Wallet, ChevronRight, ExternalLink, Loader2, X, LogOut, Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";

/* ── Wallet registry (Freighter only for now, easy to extend) ── */
const WALLETS = [
  {
    id: "freighter",
    name: "Freighter",
    description: "Stellar's most popular browser wallet",
    icon: (
      <svg viewBox="0 0 40 40" className="w-9 h-9" fill="none">
        <rect width="40" height="40" rx="10" fill="url(#freighter-grad)" />
        <path
          d="M12 20l5-8h6l5 8-5 8h-6l-5-8z"
          fill="white"
          fillOpacity="0.95"
        />
        <defs>
          <linearGradient id="freighter-grad" x1="0" y1="0" x2="40" y2="40">
            <stop stopColor="#6C63FF" />
            <stop offset="1" stopColor="#A78BFA" />
          </linearGradient>
        </defs>
      </svg>
    ),
    installUrl: "https://www.freighter.app/",
  },
];

interface WalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function WalletModal({ open, onOpenChange }: WalletModalProps) {
  const { address, isConnected, isConnecting, error, connect, disconnect } = useWallet();
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleConnect = async (walletId: string) => {
    setConnectingId(walletId);
    setLocalError(null);
    try {
      await connect();
      // Auto-close modal on success after a brief visual confirmation
      setTimeout(() => onOpenChange(false), 600);
    } catch (e: unknown) {
      setLocalError((e as Error)?.message || "Connection failed");
    } finally {
      setConnectingId(null);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setLocalError(null);
  };

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const displayError = localError || error;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] bg-card/95 backdrop-blur-2xl border-border/60 p-0 overflow-hidden gap-0">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Wallet className="w-4 h-4 text-white" />
              </div>
              {isConnected ? "Wallet Connected" : "Connect Wallet"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground pt-1">
              {isConnected
                ? "Your Stellar wallet is connected to Nexa."
                : "Select a Stellar wallet to sign audit payments."}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Divider */}
        <div className="h-px bg-border/50" />

        {/* Content */}
        <div className="px-6 py-5 space-y-3">
          {isConnected && address ? (
            /* ── Connected State ── */
            <div className="space-y-4">
              {/* Address Card */}
              <div className="bg-secondary/50 border border-border/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Address
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-medium text-green-500">Connected</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono text-foreground flex-1 truncate">
                    {address.slice(0, 6)}...{address.slice(-6)}
                  </code>
                  <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-md hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground"
                    title="Copy address"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Disconnect Button */}
              <Button
                variant="outline"
                className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive font-medium"
                onClick={handleDisconnect}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Disconnect Wallet
              </Button>
            </div>
          ) : (
            /* ── Wallet List ── */
            <>
              {WALLETS.map((wallet) => {
                const isLoading = connectingId === wallet.id;
                return (
                  <button
                    key={wallet.id}
                    onClick={() => handleConnect(wallet.id)}
                    disabled={isConnecting}
                    className="
                      w-full flex items-center gap-4 p-4 rounded-xl
                      bg-secondary/30 border border-border/40
                      hover:bg-secondary/60 hover:border-primary/30 hover:shadow-[0_0_20px_-5px_hsl(var(--primary)/0.2)]
                      transition-all duration-200 ease-out
                      disabled:opacity-50 disabled:cursor-not-allowed
                      group
                    "
                  >
                    {/* Wallet Icon */}
                    <div className="flex-shrink-0">{wallet.icon}</div>

                    {/* Info */}
                    <div className="flex-1 text-left min-w-0">
                      <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {wallet.name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {wallet.description}
                      </div>
                    </div>

                    {/* Action indicator */}
                    <div className="flex-shrink-0">
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 text-primary animate-spin" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      )}
                    </div>
                  </button>
                );
              })}

              {/* Error */}
              {displayError && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <X className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-destructive leading-relaxed">
                    {displayError}
                    {displayError.includes("not detected") && (
                      <a
                        href={WALLETS[0].installUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 mt-1.5 text-primary hover:underline font-medium"
                      >
                        Install Freighter <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="h-px bg-border/50" />
        <div className="px-6 py-3.5 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <Wallet className="w-3 h-3" />
          Secured by Stellar Network
        </div>
      </DialogContent>
    </Dialog>
  );
}
