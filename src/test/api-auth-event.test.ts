import { describe, expect, it, vi } from "vitest";
import { AUTH_EXPIRED_EVENT, clearAuthTokens } from "@/lib/api";

describe("api auth event", () => {
  it("should dispatch auth expired event on clear tokens", () => {
    const handler = vi.fn();
    window.addEventListener(AUTH_EXPIRED_EVENT, handler);
    localStorage.setItem("erp-access-token", "x");
    localStorage.setItem("erp-refresh-token", "y");

    clearAuthTokens();

    expect(localStorage.getItem("erp-access-token")).toBeNull();
    expect(localStorage.getItem("erp-refresh-token")).toBeNull();
    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener(AUTH_EXPIRED_EVENT, handler);
  });
});
