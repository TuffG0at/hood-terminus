import { describe, expect, it } from "vitest";
import { rankPools, venueName } from "./venue";

describe("venueName", () => {
  it("prefers the launchpad's own name", () => {
    expect(venueName("pons-v2-dex")).toBe("Pons");
    expect(venueName("bankr-robinhood")).toBe("Bankr");
  });

  it("turns a chain slug into something readable", () => {
    // The case that prompted this: the raw slug read as a sentence.
    expect(venueName("uniswap-v4-robinhood")).toBe("Uniswap v4");
    expect(venueName("uniswap-v3-robinhood")).toBe("Uniswap v3");
    expect(venueName("ramses-v3-robinhood")).toBe("Ramses v3");
  });

  it("keeps version markers lowercase and words capitalised", () => {
    expect(venueName("up-v3")).toBe("Up v3");
  });

  it("says something sayable when the dex is unknown", () => {
    expect(venueName(null)).toBe("another exchange");
  });
});

describe("rankPools", () => {
  const pool = (id: string, liquidityUsd: number, trades: number) => ({
    id,
    liquidityUsd,
    buys24h: trades,
    sells24h: 0,
  });

  it("puts a pool that traded today ahead of a deeper idle one", () => {
    // The WIF case: a $2.4M listing nobody trades, and the real market.
    const ranked = rankPools([pool("idle", 2_400_000, 0), pool("pons", 96_000, 966)]);
    expect(ranked.map((p) => p.id)).toEqual(["pons", "idle"]);
  });

  it("orders by depth within each group", () => {
    const ranked = rankPools([
      pool("a", 10, 1),
      pool("b", 500, 0),
      pool("c", 900, 3),
      pool("d", 50, 0),
    ]);
    expect(ranked.map((p) => p.id)).toEqual(["c", "a", "b", "d"]);
  });
});
