import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { WalletProvider } from "@/hooks/useWallet";
import History from "./History";
import {
  render,
  cleanup,
  flush,
  waitFor,
  hasText,
  buttonByLabel,
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

const PAYMENT_ID = `0x${"cd".repeat(32)}`;
const PAYMENT_TX = `0x${"22".repeat(32)}`;
const RECEIPT_TX = `0x${"33".repeat(32)}`;

const auditRecord = {
  paymentId: PAYMENT_ID,
  screeningId: "local-456",
  service: { id: "resume-intelligence-v1", version: "1" },
  jobTitle: "BOT Chain Engineer",
  results: {
    verdict: "STRONG_FIT",
    match_score: 82,
    seniority: "Senior",
    matched_skills: ["viem", "EVM"],
    missing_skills: ["x402"],
    explanation: "Strong EVM background.",
    confidence: 90,
  },
  resultHash: `0x${"11".repeat(32)}`,
  paymentTx: PAYMENT_TX,
  receiptTx: RECEIPT_TX,
  recorded: true,
  payer: "0x3F5b96A494061F7338Da529e3047809Ac6a7FB84",
  amount: "100000",
  asset: "0xaBabc7Ddc03e501d190C676BF3d92ef0e6e87a3C",
  completedAt: "2026-10-06T08:49:33.072Z",
};

const mockFetch = (payload: unknown) => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => payload });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

describe("History page", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows the empty state when there are no audits", async () => {
    mockFetch({ audits: [] });
    const { container } = await renderPage(<History />);
    await waitFor(() => hasText(container, "No Audits Yet"));
  });

  it("renders audit records with paymentId, verdict, score and recorded badge", async () => {
    mockFetch({ audits: [auditRecord] });
    const { container } = await renderPage(<History />);

    await waitFor(() => hasText(container, "BOT Chain Engineer"));
    expect(hasText(container, "STRONG_FIT")).toBe(true);
    expect(hasText(container, "Recorded")).toBe(true);
    expect(hasText(container, "0xcdcdcdcdcd")).toBe(true);
    expect(hasText(container, "Senior")).toBe(true);
    expect(hasText(container, "Total Audits")).toBe(true);
    expect(hasText(container, "82")).toBe(true);
  });

  it("links payment and receipt transactions to the BOT explorer when expanded", async () => {
    mockFetch({ audits: [auditRecord] });
    const { container } = await renderPage(<History />);
    await waitFor(() => hasText(container, "BOT Chain Engineer"));

    const row = Array.from(container.querySelectorAll('[role="button"]')).find((el) =>
      (el.textContent || "").includes("BOT Chain Engineer"),
    );
    expect(row).toBeTruthy();
    click(row!);
    await waitFor(() => hasText(container, "Strong EVM background."));

    const paymentLink = links(container).find((a) => (a.textContent || "").includes("Payment"));
    const receiptLink = links(container).find((a) => (a.textContent || "").includes("Receipt"));
    expect(paymentLink?.getAttribute("href")).toBe(`https://scan.botchain.ai/tx/${PAYMENT_TX}`);
    expect(receiptLink?.getAttribute("href")).toBe(`https://scan.botchain.ai/tx/${RECEIPT_TX}`);
    expect(hasText(container, `0x${"11".repeat(32)}`)).toBe(true);
  });

  it("copies the full paymentId to the clipboard", async () => {
    mockFetch({ audits: [auditRecord] });
    const { container } = await renderPage(<History />);
    await waitFor(() => hasText(container, "BOT Chain Engineer"));

    click(buttonByLabel(container, "Copy paymentId"));
    expect(vi.mocked(navigator.clipboard.writeText)).toHaveBeenCalledWith(PAYMENT_ID);
  });

  it("marks audits without an on-chain receipt as unrecorded", async () => {
    mockFetch({ audits: [{ ...auditRecord, recorded: false, receiptTx: null }] });
    const { container } = await renderPage(<History />);
    await waitFor(() => hasText(container, "Unrecorded"));
  });
});
