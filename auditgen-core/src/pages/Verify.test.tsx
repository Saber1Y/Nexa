import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { WalletProvider } from "@/hooks/useWallet";
import Verify from "./Verify";
import {
  render,
  cleanup,
  flush,
  waitFor,
  hasText,
  buttonByText,
  inputByPlaceholder,
  setInputValue,
  click,
  links,
} from "@/test/render";

const renderPage = async (ui: React.ReactElement) => {
  const result = render(
    <WalletProvider>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{ui}</MemoryRouter>
    </WalletProvider>,
  );
  await flush(2);
  return result;
};

const PAYMENT_ID = `0x${"ab".repeat(32)}`;

const foundPayload = {
  found: true,
  hashMatches: true,
  audit: {
    paymentId: PAYMENT_ID,
    screeningId: "local-123",
    service: { id: "resume-intelligence-v1", version: "1" },
    jobTitle: "BOT Chain Engineer",
    results: {
      verdict: "PARTIAL_FIT",
      match_score: 40,
      seniority: "Mid",
      matched_skills: ["Payment systems"],
      missing_skills: ["viem"],
      explanation: "Partially aligned.",
      confidence: 60,
    },
    resultHash: `0x${"11".repeat(32)}`,
    paymentTx: `0x${"22".repeat(32)}`,
    receiptTx: `0x${"33".repeat(32)}`,
    recorded: true,
    payer: "0x3F5b96A494061F7338Da529e3047809Ac6a7FB84",
    amount: "100000",
    asset: "0x75edC9335175Fc0552D51D48439F229c10420fe3",
    completedAt: "2026-10-06T08:49:33.072Z",
    onChain: {
      found: true,
      recorded: true,
      registry: "0xC37C0a8988BB174f2a9b199b8B8f0Fb51f5c848D",
      paymentId: PAYMENT_ID,
      serviceId: `0x${"52".repeat(32)}`,
      payer: "0x3F5b96A494061F7338Da529e3047809Ac6a7FB84",
      provider: "0x772c86be44eAF536df1B5f8924417acCC6bB4028",
      asset: "0x75edC9335175Fc0552D51D48439F229c10420fe3",
      amount: "100000",
      resultHash: `0x${"11".repeat(32)}`,
      tx: `0x${"33".repeat(32)}`,
      blockNumber: "25889451",
      explorerUrl: `https://scan.bohr.life/tx/0x${"33".repeat(32)}`,
    },
  },
};

const mockFetch = (payload: unknown) => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => payload });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

const submit = (container: HTMLElement, value: string) => {
  setInputValue(inputByPlaceholder(container, "0x... paymentId"), value);
  click(buttonByText(container, "Verify"));
};

describe("Verify page", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("rejects a malformed paymentId without calling the API", async () => {
    const fetchMock = mockFetch({});
    const { container } = await renderPage(<Verify />);
    submit(container, "not-a-payment-id");
    await waitFor(() => hasText(container, "Invalid paymentId"));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows the not-found state for an unknown paymentId", async () => {
    mockFetch({ found: false, error: "No audit found for this paymentId." });
    const { container } = await renderPage(<Verify />);
    submit(container, PAYMENT_ID);
    await waitFor(() => hasText(container, "No audit found for this paymentId."));
    expect(hasText(container, "On-Chain Receipt")).toBe(false);
  });

  it("renders the local record and on-chain receipt when hashes match", async () => {
    mockFetch(foundPayload);
    const { container } = await renderPage(<Verify />);
    submit(container, PAYMENT_ID);

    await waitFor(() => hasText(container, "✓ Receipt Integrity Verified"));
    expect(hasText(container, "On-Chain Receipt")).toBe(true);
    expect(hasText(container, "0xC37C0a8988BB174f2a9b199b8B8f0Fb51f5c848D")).toBe(true);
    expect(hasText(container, "0.100000 tUSDT")).toBe(true);
    expect(hasText(container, "#25889451")).toBe(true);
    expect(hasText(container, "BOT Chain Engineer")).toBe(true);
    expect(hasText(container, "PARTIAL_FIT")).toBe(true);
    expect(hasText(container, "Payment systems")).toBe(true);
    expect(hasText(container, "From BOT Chain Registry")).toBe(true);
    expect(hasText(container, "From Nexa Ledger")).toBe(true);

    const receiptLink = links(container).find((a) => (a.textContent || "").includes("Receipt Tx 0x333333"));
    expect(receiptLink?.getAttribute("href")).toBe(`https://scan.bohr.life/tx/0x${"33".repeat(32)}`);
    const paymentLink = links(container).find((a) => (a.textContent || "").includes("Payment Tx"));
    expect(paymentLink?.getAttribute("href")).toBe(`https://scan.bohr.life/tx/0x${"22".repeat(32)}`);
  });

  it("flags a result hash mismatch", async () => {
    mockFetch({ ...foundPayload, hashMatches: false });
    const { container } = await renderPage(<Verify />);
    submit(container, PAYMENT_ID);
    await waitFor(() => hasText(container, "✗ Result Hash Mismatch"));
    expect(hasText(container, "Possible tampering")).toBe(true);
  });

  it("shows the pending integrity state when no receipt exists on-chain", async () => {
    const { onChain: _onChain, ...localOnly } = foundPayload.audit;
    mockFetch({
      found: true,
      hashMatches: null,
      audit: { ...localOnly, onChain: { found: false, recorded: false } },
    });
    const { container } = await renderPage(<Verify />);
    submit(container, PAYMENT_ID);

    await waitFor(() => hasText(container, "⧗ Integrity Pending"));
    expect(hasText(container, "No receipt found on-chain")).toBe(true);
    expect(hasText(container, "BOT Chain Engineer")).toBe(true);
    expect(hasText(container, "No Local Record")).toBe(false);
  });

  it("shows the on-chain-only state when no local record exists", async () => {
    mockFetch({
      found: true,
      hashMatches: null,
      audit: { paymentId: PAYMENT_ID, onChain: { ...foundPayload.audit.onChain } },
    });
    const { container } = await renderPage(<Verify />);
    submit(container, PAYMENT_ID);

    await waitFor(() => hasText(container, "No Local Record"));
    expect(hasText(container, "On-Chain Receipt")).toBe(true);
    expect(hasText(container, "Local Result Hash")).toBe(false);
  });
});
