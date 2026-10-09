import { describe, it, expect } from "vitest";
import {
  buildPaymentSignatureHeader,
  buildPaymentSignaturePayload,
  buildPermitAuthorization,
  buildPermitTypedData,
  decodeBase64Url,
  describePaymentError,
  encodeBase64Url,
  extractPaymentRequired,
  isUserRejection,
  stringifyBigInts,
  type PaymentAccept,
  type PaymentRequiredBody,
} from "@/hooks/useX402Bot";
import { BOT_CHAIN_ID, BOT_PERMIT2_ADDRESS, formatUsdtAmount } from "@/utils/botChain";

const resource = {
  url: "http://localhost:3402/api/audit",
  description: "Resume intelligence screening",
  mimeType: "application/json",
};

const accepted: PaymentAccept = {
  scheme: "exact",
  network: "eip155:677",
  amount: "100000",
  asset: "0xaBabc7Ddc03e501d190C676BF3d92ef0e6e87a3C",
  payTo: "0x772c86be44eAF536df1B5f8924417acCC6bB4028",
  maxTimeoutSeconds: 300,
  extra: {
    name: "USDT",
    version: "1",
    assetTransferMethod: "permit2",
    permit2: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
    proxy: "0x402085c248EeA27D92E8b30b2C58ed07f9E20001",
    serviceId: "resume-intelligence-v1",
  },
  resource,
};

const required: PaymentRequiredBody = {
  x402Version: 2,
  resource,
  accepts: [accepted],
};

const NOW = 1_700_000_000;
const NONCE = 0x1234n;

describe("base64url encoding", () => {
  it("round-trips JSON payloads", () => {
    const payload = { hello: "world", num: 42, nested: { ok: true } };
    const encoded = encodeBase64Url(payload);
    expect(encoded).not.toMatch(/[+/=]/);
    expect(JSON.parse(decodeBase64Url(encoded))).toEqual(payload);
  });

  it("serializes bigint values as decimal strings", () => {
    expect(stringifyBigInts({ amount: 100000n })).toBe('{"amount":"100000"}');
    const encoded = encodeBase64Url({ amount: 100000n });
    expect(JSON.parse(decodeBase64Url(encoded))).toEqual({ amount: "100000" });
  });
});

describe("buildPermitTypedData", () => {
  const typed = buildPermitTypedData(accepted, { nowSec: NOW, nonce: NONCE });

  it("targets Permit2 domain on BOT Chain", () => {
    expect(typed.domain).toEqual({
      name: "Permit2",
      chainId: BOT_CHAIN_ID,
      verifyingContract: BOT_PERMIT2_ADDRESS,
    });
    expect(typed.primaryType).toBe("PermitWitnessTransferFrom");
    expect(Object.keys(typed.types)).toEqual(
      expect.arrayContaining(["TokenPermissions", "Witness", "PermitWitnessTransferFrom"]),
    );
  });

  it("builds the witness message from the accepted payment terms", () => {
    expect(typed.message.permitted).toEqual({ token: accepted.asset, amount: 100000n });
    expect(typed.message.spender).toBe(accepted.extra.proxy);
    expect(typed.message.nonce).toBe(NONCE);
    expect(typed.message.deadline).toBe(BigInt(NOW + 300));
    expect(typed.message.witness).toEqual({ to: accepted.payTo, validAfter: BigInt(NOW - 5) });
  });

  it("does not put a from field in the typed message", () => {
    expect(Object.keys(typed.message)).not.toContain("from");
    const permitFields = typed.types.PermitWitnessTransferFrom.map((f) => f.name);
    expect(permitFields).not.toContain("from");
  });
});

describe("buildPermitAuthorization", () => {
  it("stringifies every bigint and stamps the payer", () => {
    const typed = buildPermitTypedData(accepted, { nowSec: NOW, nonce: NONCE });
    const auth = buildPermitAuthorization(typed.message, "0xabc");
    expect(auth).toEqual({
      permitted: { token: accepted.asset, amount: "100000" },
      spender: accepted.extra.proxy,
      nonce: String(NONCE),
      deadline: String(NOW + 300),
      witness: { to: accepted.payTo, validAfter: String(NOW - 5) },
      from: "0xabc",
    });
    expect(JSON.parse(stringifyBigInts(auth))).toEqual(auth);
  });
});

describe("payment signature header", () => {
  it("encodes a base64url x402v2 payload", () => {
    const typed = buildPermitTypedData(accepted, { nowSec: NOW, nonce: NONCE });
    const auth = buildPermitAuthorization(typed.message, "0xabc");
    const header = buildPaymentSignatureHeader({ accepted, resource, signature: "0xdead", authorization: auth });

    expect(header).not.toMatch(/[+/=]/);
    const decoded = JSON.parse(decodeBase64Url(header));
    expect(decoded.x402Version).toBe(2);
    expect(decoded.resource).toEqual(resource);
    expect(decoded.accepted).toEqual(accepted);
    expect(decoded.payload.signature).toBe("0xdead");
    expect(decoded.payload.permit2Authorization).toEqual(auth);
    expect(decoded.extensions).toEqual({});
  });

  it("builds the same payload object directly", () => {
    const auth = buildPermitAuthorization(
      buildPermitTypedData(accepted, { nowSec: NOW, nonce: NONCE }).message,
      "0xabc",
    );
    const payload = buildPaymentSignaturePayload(accepted, resource, "0xsig", auth);
    expect(payload.x402Version).toBe(2);
    expect(payload.accepted.amount).toBe("100000");
  });
});

describe("extractPaymentRequired", () => {
  it("prefers the PAYMENT-REQUIRED header", () => {
    const header = encodeBase64Url(required);
    const result = extractPaymentRequired(header, { error: "broken", accepts: [] });
    expect(result.accepts[0].amount).toBe("100000");
  });

  it("falls back to the JSON body", () => {
    const result = extractPaymentRequired(null, required);
    expect(result.accepts[0].network).toBe("eip155:677");
  });

  it("throws when neither source carries accepts", () => {
    expect(() => extractPaymentRequired(null, { error: "Payment Required" })).toThrow(/402/);
    expect(() => extractPaymentRequired("not-base64!!", null)).toThrow(/402/);
  });
});

describe("describePaymentError", () => {
  it("explains duplicate payments", () => {
    const msg = describePaymentError({ status: 409, body: { error: "duplicate_payment", paymentId: "pay_1234567890abcdefXYZ" } });
    expect(msg).toContain("Duplicate payment");
    expect(msg).toContain("pay_1234567890abcd");
  });

  it("explains settlement failures", () => {
    const msg = describePaymentError({ status: 402, body: { error: "settlement_failed", detail: "insufficient allowance" } });
    expect(msg).toContain("settlement failed");
    expect(msg).toContain("insufficient allowance");
    expect(msg).toContain("No USDT was captured");
  });

  it("explains execution failures with refund details", () => {
    const msg = describePaymentError({
      status: 502,
      body: { error: "execution_failed", detail: "upstream timeout", refund: "Refund queued as pay_9." },
    });
    expect(msg).toContain("AI execution failed");
    expect(msg).toContain("upstream timeout");
    expect(msg).toContain("Refund queued");
  });

  it("falls back to status or network error", () => {
    expect(describePaymentError({ status: 500, body: null })).toContain("500");
    expect(describePaymentError({})).toContain("Network error");
    expect(describePaymentError({ message: "boom" })).toBe("boom");
  });
});

describe("isUserRejection", () => {
  it("detects wallet rejections", () => {
    expect(isUserRejection({ name: "UserRejectedRequestError", message: "nope" })).toBe(true);
    expect(isUserRejection({ code: 4001, message: "denied" })).toBe(true);
    expect(isUserRejection(new Error("User rejected the request."))).toBe(true);
    expect(isUserRejection(new Error("network down"))).toBe(false);
    expect(isUserRejection(null)).toBe(false);
  });
});

describe("formatUsdtAmount", () => {
  it("converts 6-decimal atomic amounts to USDT", () => {
    expect(formatUsdtAmount(100000n)).toBe("0.10");
    expect(formatUsdtAmount("10000000")).toBe("10.00");
    expect(formatUsdtAmount(0n)).toBe("0.00");
  });
});
