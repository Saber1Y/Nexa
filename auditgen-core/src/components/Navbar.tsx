import { useState } from "react";
import { Moon, Sun, WalletCards, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import WalletModal from "@/components/WalletModal";
import logo from "@/assets/logo.png";

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const { address, isConnected } = useWallet();
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-3 group">
            <img src={logo} alt="Nexa" className="w-9 h-9 rounded-lg object-contain" width={36} height={36} />
            <span className="text-lg font-bold gradient-text">Nexa Auditor</span>
          </Link>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-muted-foreground hover:text-foreground"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>

            {isConnected && address ? (
              <button
                onClick={() => setWalletModalOpen(true)}
                className="flex items-center gap-2.5 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 hover:bg-primary/15 hover:border-primary/30 transition-all duration-200 group"
              >
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-mono font-medium text-foreground">
                  {address.slice(0, 4)}...{address.slice(-4)}
                </span>
                <ChevronDown className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>
            ) : (
              <Button
                onClick={() => setWalletModalOpen(true)}
                className="gradient-primary text-primary-foreground font-semibold rounded-full px-6 flex items-center gap-2 hover:opacity-90 transition-all"
              >
                <WalletCards className="w-4 h-4" />
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      </header>

      <WalletModal open={walletModalOpen} onOpenChange={setWalletModalOpen} />
    </>
  );
};

export default Navbar;
