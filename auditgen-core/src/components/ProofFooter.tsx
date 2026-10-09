const REGISTRY_ADDRESS = "0x6Ae462BC2AeA78b41aB638cADd18af6cf40cDF72";
const NEXA_RECEIPT_REGISTRY = "0x4a29F92A5Bf3F1e242a8bcdc5F7009e67395c5B1";
const LATEST_NEXA_TEST = "0x660ba576c899ae5efe137070638c54a93dcdad44d6fca3b1b20938f58f83a2a6";

const ProofFooter = () => (
  <footer className="border-t py-10 mt-12" style={{ borderColor: "rgba(0,255,136,0.1)" }}>
    <div className="container mx-auto px-4 grid gap-6 md:grid-cols-[1fr_auto] md:items-end text-[10px] text-muted-foreground tracking-[0.15em] uppercase">
      <div>
        <p style={{ color: "var(--neon-green)" }}>Proof on BOT Mainnet</p>
        <div className="mt-4 grid gap-4 normal-case tracking-normal text-[11px] md:grid-cols-3">
          <div><p>Chain ID</p><p className="mt-1 font-mono text-foreground">677</p></div>
          <div><p>Receipt Registry</p><a className="mt-1 block font-mono text-foreground hover:text-[var(--neon-green)]" href={`https://scan.botchain.ai/address/${NEXA_RECEIPT_REGISTRY}`} target="_blank" rel="noopener noreferrer">0x4a29F9...95cB1</a></div>
          <div><p>Latest Test Receipt</p><a className="mt-1 block font-mono text-foreground hover:text-[var(--neon-green)]" href={`https://scan.botchain.ai/tx/${LATEST_NEXA_TEST}`} target="_blank" rel="noopener noreferrer">0x660ba5... (test receipt)</a></div>
        </div>
      </div>
      <div className="flex flex-wrap gap-4 normal-case tracking-normal md:justify-end">
        <a href="https://botchain.ai" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">Built on BOT Chain ↗</a>
        <a href="https://x.com/Nexa05" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">Follow @Nexa05 on X ↗</a>
      </div>
    </div>
    <a className="container mx-auto mt-6 block px-4 text-[10px] normal-case tracking-normal text-muted-foreground hover:text-foreground" href="https://scan.botchain.ai/" target="_blank" rel="noopener noreferrer">BOTScan Explorer ↗</a>
  </footer>
);

export default ProofFooter;
