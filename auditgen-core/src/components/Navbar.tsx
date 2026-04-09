import { useState } from "react";
import { Moon, Sun, WalletCards, ChevronDown, Rocket, ShieldCheck, FileText, LayoutDashboard, Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import WalletModal from "@/components/WalletModal";
import logo from "@/assets/logo.png";

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const { address, isConnected } = useWallet();
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  // Helper to close the mobile menu after clicking a link
  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-3 group">
            <img src={logo} alt="Nexa" className="w-9 h-9 rounded-lg object-contain" width={36} height={36} />
            <span className="text-lg font-bold gradient-text">Nexa Bridge</span>
          </Link>

          {/* Desktop Global Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link 
              to="/" 
              className={`text-xs font-bold uppercase tracking-widest transition-all hover:text-primary ${isActive("/") ? "text-primary glow-text" : "text-muted-foreground"}`}
            >
              Home
            </Link>
            <Link 
              to="/audit" 
              className={`text-xs font-bold uppercase tracking-widest transition-all hover:text-primary ${isActive("/audit") ? "text-primary glow-text" : "text-muted-foreground"}`}
            >
               Audit
            </Link>
            <Link 
              to="/history" 
              className={`text-xs font-bold uppercase tracking-widest transition-all hover:text-primary ${isActive("/history") ? "text-primary glow-text" : "text-muted-foreground"}`}
            >
              History
            </Link>
            <Link 
              to="/verify" 
              className={`text-xs font-bold uppercase tracking-widest transition-all hover:text-primary ${isActive("/verify") ? "text-primary glow-text" : "text-muted-foreground"}`}
            >
              Verify
            </Link>
            <Link 
              to="/docs" 
              className={`text-xs font-bold uppercase tracking-widest transition-all hover:text-primary ${isActive("/docs") ? "text-primary glow-text" : "text-muted-foreground"}`}
            >
              Docs
            </Link>
          </nav>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-4">
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

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-muted-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border/40 px-4 py-6 flex flex-col gap-6 shadow-2xl animate-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col gap-4">
              <Link 
                to="/" 
                onClick={closeMenu}
                className={`text-sm font-bold uppercase tracking-widest transition-all ${isActive("/") ? "text-primary glow-text" : "text-muted-foreground"}`}
              >
                Home
              </Link>
              <Link 
                to="/audit" 
                onClick={closeMenu}
                className={`text-sm font-bold uppercase tracking-widest transition-all ${isActive("/audit") ? "text-primary glow-text" : "text-muted-foreground"}`}
              >
                 Audit
              </Link>
              <Link 
                to="/history" 
                onClick={closeMenu}
                className={`text-sm font-bold uppercase tracking-widest transition-all ${isActive("/history") ? "text-primary glow-text" : "text-muted-foreground"}`}
              >
                History
              </Link>
              <Link 
                to="/verify" 
                onClick={closeMenu}
                className={`text-sm font-bold uppercase tracking-widest transition-all ${isActive("/verify") ? "text-primary glow-text" : "text-muted-foreground"}`}
              >
                Verify
              </Link>
              <Link 
                to="/docs" 
                onClick={closeMenu}
                className={`text-sm font-bold uppercase tracking-widest transition-all ${isActive("/docs") ? "text-primary glow-text" : "text-muted-foreground"}`}
              >
                Docs
              </Link>
            </nav>

            <div className="flex flex-col gap-4 pt-4 border-t border-border/40">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Theme</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </Button>
              </div>

              {isConnected && address ? (
                <button
                  onClick={() => {
                    setWalletModalOpen(true);
                    closeMenu();
                  }}
                  className="flex w-full justify-center items-center gap-2.5 bg-primary/10 border border-primary/20 rounded-full px-4 py-3 hover:bg-primary/15 transition-all duration-200"
                >
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-mono font-medium text-foreground">
                    {address.slice(0, 4)}...{address.slice(-4)}
                  </span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </button>
              ) : (
                <Button
                  onClick={() => {
                    setWalletModalOpen(true);
                    closeMenu();
                  }}
                  className="w-full gradient-primary text-primary-foreground font-semibold rounded-full py-6 flex items-center justify-center gap-2"
                >
                  <WalletCards className="w-5 h-5" />
                  Connect Wallet
                </Button>
              )}
            </div>
          </div>
        )}
      </header>

      <WalletModal open={walletModalOpen} onOpenChange={setWalletModalOpen} />
    </>
  );
};

export default Navbar;
