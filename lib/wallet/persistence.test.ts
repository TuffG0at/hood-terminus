import { describe, expect, it } from "vitest";
import { cookieHoldsConnection } from "./disconnect";

const store = (connections: unknown[]) =>
  "wagmi.store=" +
  encodeURIComponent(JSON.stringify({ state: { connections: { value: connections } } }));

describe("cookieHoldsConnection", () => {
  it("is false when wagmi has written its cookie but nobody is connected", () => {
    // The bug: wagmi writes this on mount for every visitor. Reading the
    // cookie's presence as a connection reloaded the page under first-time
    // visitors who had never connected anything.
    expect(cookieHoldsConnection(store([]))).toBe(false);
  });

  it("is true when the store actually holds a connection", () => {
    expect(cookieHoldsConnection(store([["uid", { accounts: ["0xabc"] }]]))).toBe(true);
  });

  it("is false with no wagmi cookie at all", () => {
    expect(cookieHoldsConnection("")).toBe(false);
    expect(cookieHoldsConnection("other=1; another=2")).toBe(false);
  });

  it("is false when the cookie cannot be parsed", () => {
    expect(cookieHoldsConnection("wagmi.store=not-json")).toBe(false);
  });

  it("finds the cookie when it is not first in the list", () => {
    expect(cookieHoldsConnection("a=1; " + store([["uid", {}]]) + "; b=2")).toBe(true);
  });

  it("ignores a recentConnectorId with no connection behind it", () => {
    expect(cookieHoldsConnection("wagmi.recentConnectorId=%22io.rabby%22")).toBe(false);
  });
});
