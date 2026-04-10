import { useState } from "react";
import { WalletCards, ChevronDown, Menu, X, Terminal } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import WalletModal from "@/components/WalletModal";
import logo from "@/assets/logo.png";

const navLinks = [
  { path: "/", label: "Home" },
  { path: "/audit", label: "Audit" },
  { path: "/history", label: "History" },
  { path: "/verify", label: "Verify" },
  { path: "/docs", label: "Docs" },
];

const Navbar = () => {
  const { address, isConnected } = useWallet();
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;
  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-xl" style={{ borderColor: "var(--neon-green)", borderBottomWidth: "1px", boxShadow: "0 1px 15px rgba(0,255,136,0.08)" }}>
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-3 group">
            <img src={logo} alt="Nexa" className="w-8 h-8 object-contain" width={32} height={32} style={{ filter: "drop-shadow(0 0 4px rgba(0,255,136,0.4))" }} />
            <span className="font-display text-base font-bold tracking-widest uppercase neon-text" style={{ color: "var(--neon-green)" }}>
              NEXA
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-150 hover:drop-shadow-[0_0_6px_rgba(0,255,136,0.6)] ${
                  isActive(link.path)
                    ? "neon-text"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                style={isActive(link.path) ? { color: "var(--neon-green)" } : undefined}
              >
                {isActive(link.path) && <span className="mr-1 opacity-60">›</span>}
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            {isConnected && address ? (
              <button
                onClick={() => setWalletModalOpen(true)}
                className="flex items-center gap-2.5 border px-4 py-1.5 transition-all duration-150 hover:neon-glow cyber-chamfer-sm group"
                style={{ borderColor: "var(--neon-green)", background: "rgba(0,255,136,0.05)" }}
              >
                <div className="w-2 h-2 bg-neon-green animate-pulse" style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }} />
                <span className="text-[10px] font-mono font-bold tracking-wider" style={{ color: "var(--neon-green)" }}>
                  {address.slice(0, 4)}···{address.slice(-4)}
                </span>
                <ChevronDown className="w-3 h-3 text-muted-foreground group-hover:text-foreground" />
              </button>
            ) : (
              <Button
                onClick={() => setWalletModalOpen(true)}
                className="font-display text-[10px] font-bold uppercase tracking-[0.15em] px-6 py-2 border-2 transition-all duration-150 hover:neon-glow cyber-chamfer-sm"
                style={{ borderColor: "var(--neon-green)", color: "var(--neon-green)", background: "transparent" }}
              >
                <Terminal className="w-3.5 h-3.5 mr-2" />
                Connect
              </Button>
            )}
          </div>

          {/* Mobile Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ color: "var(--neon-green)" }}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-background/95 backdrop-blur-xl border-b px-4 py-6 flex flex-col gap-6 animate-in slide-in-from-top-2 duration-200" style={{ borderColor: "var(--neon-green)" }}>
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={closeMenu}
                  className={`text-sm font-bold uppercase tracking-[0.2em] transition-all ${
                    isActive(link.path) ? "neon-text" : "text-muted-foreground"
                  }`}
                  style={isActive(link.path) ? { color: "var(--neon-green)" } : undefined}
                >
                  <span className="mr-2 opacity-40">&gt;</span>{link.label}
                </Link>
              ))}
            </nav>

            <div className="pt-4 border-t border-border/40">
              {isConnected && address ? (
                <button
                  onClick={() => { setWalletModalOpen(true); closeMenu(); }}
                  className="flex w-full justify-center items-center gap-2.5 border px-4 py-3 cyber-chamfer-sm"
                  style={{ borderColor: "var(--neon-green)", background: "rgba(0,255,136,0.05)" }}
                >
                  <div className="w-2 h-2 bg-neon-green animate-pulse" />
                  <span className="text-sm font-mono font-bold" style={{ color: "var(--neon-green)" }}>
                    {address.slice(0, 4)}···{address.slice(-4)}
                  </span>
                </button>
              ) : (
                <Button
                  onClick={() => { setWalletModalOpen(true); closeMenu(); }}
                  className="w-full font-display text-xs font-bold uppercase tracking-[0.15em] py-6 border-2 cyber-chamfer-sm"
                  style={{ borderColor: "var(--neon-green)", color: "var(--neon-green)", background: "transparent" }}
                >
                  <WalletCards className="w-5 h-5 mr-2" />
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
