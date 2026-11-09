/**
 * Who a pair actually trades on.
 *
 * No server boundary here on purpose. This is a lookup table and some string
 * handling, and both a server page and a test need to name an exchange without
 * dragging in the market client.
 */

/**
 * Launchpads whose hooks are recognisable by the dex GeckoTerminal files the
 * pool under. Naming the launchpad tells a trader whose fee they are paying.
 */
export const LAUNCHPAD_DEXES: Record<string, string> = {
  "pons-v2-dex": "Pons",
  "bankr-robinhood": "Bankr",
  "clanker-robinhood": "Clanker",
  "virtuals-robinhood": "Virtuals",
  "easya-kickstart-robinhood": "EasyA Kickstart",
  "mint-club-robinhood": "Mint Club",
};

type Ranked = {
  liquidityUsd: number | null;
  buys24h: number | null;
  sells24h: number | null;
};

/**
 * The order to try a token's pools in: pools that traded today, deepest first,
 * then the idle ones, deepest first.
 *
 * Depth alone was the old rule, and listed depth can be fiction. WIF's deepest
 * listing was an mmETH pool reported at $2.4M with no trades at all, and the
 * test buy there reverted, so the chain's own memecoin came back Unknown while
 * $120k a day traded on Pons. A pool where nobody trades is not where a sell
 * would go, so it is not where the sell is tested.
 */
export function rankPools<T extends Ranked>(pools: T[]): T[] {
  const traded = (p: Ranked) => (p.buys24h ?? 0) + (p.sells24h ?? 0) > 0;
  return [...pools].sort(
    (x, y) =>
      Number(traded(y)) - Number(traded(x)) ||
      (y.liquidityUsd ?? 0) - (x.liquidityUsd ?? 0),
  );
}

/**
 * A name for an exchange that can be read aloud.
 *
 * The launchpad names above are the good case. Everything else arrives as the
 * slug GeckoTerminal files it under, and "This pair trades on
 * uniswap-v4-robinhood" is not a sentence anybody should be shown. The chain
 * suffix goes, separators become spaces, and each word is capitalised, except
 * version markers, which are conventionally lowercase: v3, not V3.
 */
export function venueName(dex: string | null): string {
  if (!dex) return "another exchange";
  const launchpad = LAUNCHPAD_DEXES[dex];
  if (launchpad) return launchpad;

  return dex
    .replace(/-robinhood$/, "")
    .split("-")
    .map((word) =>
      /^v\d+$/.test(word) ? word : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");
}
