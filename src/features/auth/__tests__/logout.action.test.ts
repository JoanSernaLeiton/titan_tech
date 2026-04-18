import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSignOut = vi.fn();
const mockRedirect = vi.fn();

vi.mock("@/shared/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: { signOut: mockSignOut },
    })
  ),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string): unknown => mockRedirect(url),
}));

describe("logoutAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignOut.mockResolvedValue({});
  });

  it("calls signOut and redirects to /login", async () => {
    const { logoutAction } = await import("../actions/logout.action");

    await logoutAction();

    expect(mockSignOut).toHaveBeenCalled();
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });
});
