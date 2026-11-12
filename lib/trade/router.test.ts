import { describe, expect, it } from "vitest";
import { decodeAbiParameters, parseEther, type Address } from "viem";
import { buildBuy, buildSell } from "@/lib/trade/router";
import { CONTRACTS, DECOYS } from "@/lib/chain/contracts";

const TOKEN = "0x5173b8ea6923c2d40267890d45c46a3480954773" as Address;

const SIX = [
  { type: "address" },
  { type: "uint256" },
  { type: "uint256" },
  { type: "bytes" },
  { type: "bool" },
  { type: "uint256[]" },
] as const;

/**
 * Word 5 of a V3 swap input is the offset of the per-hop floor list. Without
 * the sixth field, that word is the start of the path's length slot instead,
 * and the router on this chain reverts every one-pool swap.
 */
function headWords(input: `0x${string}`): bigint[] {
  const hex = input.slice(2);
  return Array.from({ length: 6 }, (_, i) => BigInt("0x" + hex.slice(i * 64, i * 64 + 64)));
}

describe("router calls", () => {
  it("go to the router built for this chain, not the mainnet-configured copy", () => {
    const call = buildBuy({ token: TOKEN, fee: 3000, amountIn: 1n, minAmountOut: 0n });
    expect(call.to.toLowerCase()).toBe(CONTRACTS.universalRouter);
    expect(call.to.toLowerCase()).not.toBe(DECOYS.notUniversalRouter);
  });

  it("encode a buy's swap with the sixth, empty per-hop floor field", () => {
    const amountIn = parseEther("0.0003");
    const call = buildBuy({ token: TOKEN, fee: 3000, amountIn, minAmountOut: 7n });
    expect(call.commands).toBe("0x0b00");
    expect(call.value).toBe(amountIn);

    const swap = call.inputs[1];
    const [, inAmt, min, path, payerIsUser, floors] = decodeAbiParameters(SIX, swap);
    expect(inAmt).toBe(amountIn);
    expect(min).toBe(7n);
    expect((path.length - 2) / 2).toBe(43);
    expect(payerIsUser).toBe(false);
    expect(floors).toEqual([]);

    // Path offset after six head words, floors after the padded path.
    const words = headWords(swap);
    expect(words[3]).toBe(0xc0n);
    expect(words[5]).toBe(0x120n);
  });

  it("encode a sell's swap the same way", () => {
    const call = buildSell({ token: TOKEN, fee: 3000, amountIn: 5n, minAmountOut: 1n });
    expect(call.commands).toBe("0x000c");
    const [, , , , payerIsUser, floors] = decodeAbiParameters(SIX, call.inputs[0]);
    expect(payerIsUser).toBe(true);
    expect(floors).toEqual([]);
    expect(headWords(call.inputs[0])[5]).toBe(0x120n);
  });
});
