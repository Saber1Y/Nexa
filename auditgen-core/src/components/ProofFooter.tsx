import {
  BOT_CHAIN_ID,
  BOT_CHAIN_NAME,
  BOT_EXPLORER_URL,
  BOT_GATEWAY_ADDRESS,
  BOT_RECEIPT_REGISTRY_ADDRESS,
  BOT_SERVICE_REGISTRY_ADDRESS,
} from "@/utils/botChain";

const LATEST_RECEIPT = BOT_CHAIN_ID === 677
  ? "0x7b2df0f7458c7ffc90baf805540204da4dc73f0588f89e1c7da623747570ff1b"
  : BOT_CHAIN_ID === 968
    ? "0x641bd95ac62f7b38600a67f7777dc06487d535f3f95ea8d451ec7bfb6700c5dc"
    : "";
const explorerAddress = (address: string) => `${BOT_EXPLORER_URL.replace(/\/$/, "")}/address/${address}`;
const explorerTransaction = (hash: string) => `${BOT_EXPLORER_URL.replace(/\/$/, "")}/tx/${hash}`;

const ProofFooter = () => (
  <footer className="border-t py-10 mt-12" style={{ borderColor: "rgba(0,255,136,0.1)" }}>
    <div className="container mx-auto px-4 grid gap-6 md:grid-cols-[1fr_auto] md:items-end text-[10px] text-muted-foreground tracking-[0.15em] uppercase">
      <div>
        <p style={{ color: "var(--neon-green)" }}>Proof on {BOT_CHAIN_NAME}</p>
        <div className="mt-4 grid gap-4 normal-case tracking-normal text-[11px] sm:grid-cols-2 xl:grid-cols-5">
          <div><p>Chain ID</p><p className="mt-1 font-mono text-foreground">{BOT_CHAIN_ID}</p></div>
          <div>
            <p>Nexa Gateway</p>
            {BOT_GATEWAY_ADDRESS
              ? <a className="mt-1 block break-all font-mono text-foreground hover:text-[var(--neon-green)]" href={explorerAddress(BOT_GATEWAY_ADDRESS)} target="_blank" rel="noopener noreferrer">{BOT_GATEWAY_ADDRESS}</a>
              : <p className="mt-1 text-foreground">Not configured</p>}
          </div>
          <div>
            <p>Service Registry</p>
            {BOT_SERVICE_REGISTRY_ADDRESS
              ? <a className="mt-1 block break-all font-mono text-foreground hover:text-[var(--neon-green)]" href={explorerAddress(BOT_SERVICE_REGISTRY_ADDRESS)} target="_blank" rel="noopener noreferrer">{BOT_SERVICE_REGISTRY_ADDRESS}</a>
              : <p className="mt-1 text-foreground">Not configured</p>}
          </div>
          <div>
            <p>Receipt Registry</p>
            {BOT_RECEIPT_REGISTRY_ADDRESS
              ? <a className="mt-1 block break-all font-mono text-foreground hover:text-[var(--neon-green)]" href={explorerAddress(BOT_RECEIPT_REGISTRY_ADDRESS)} target="_blank" rel="noopener noreferrer">{BOT_RECEIPT_REGISTRY_ADDRESS}</a>
              : <p className="mt-1 text-foreground">Not configured</p>}
          </div>
          <div>
            <p>Verified Receipt</p>
            {LATEST_RECEIPT
              ? <a className="mt-1 block font-mono text-foreground hover:text-[var(--neon-green)]" href={explorerTransaction(LATEST_RECEIPT)} target="_blank" rel="noopener noreferrer">{LATEST_RECEIPT.slice(0, 10)}... ↗</a>
              : <p className="mt-1 text-foreground">No sample receipt</p>}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-4 normal-case tracking-normal md:justify-end">
        <a href="https://botchain.ai" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">Built on BOT Chain ↗</a>
        <a href="https://x.com/Nexa05" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">Follow @Nexa05 on X ↗</a>
      </div>
    </div>
    <a className="container mx-auto mt-6 block px-4 text-[10px] normal-case tracking-normal text-muted-foreground hover:text-foreground" href={BOT_EXPLORER_URL} target="_blank" rel="noopener noreferrer">BOTScan Explorer ↗</a>
  </footer>
);

export default ProofFooter;
