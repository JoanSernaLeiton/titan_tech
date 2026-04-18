import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUser = vi.fn();
const mockRedirect = vi.fn();

vi.mock("@/shared/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({ auth: { getUser: mockGetUser } })
  ),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string): unknown => mockRedirect(url),
}));

describe("HomePage (protected)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRedirect.mockImplementation(() => { throw new Error("NEXT_REDIRECT"); });
  });

  it("redirects to /login when user is not authenticated", async () => {
    // Arrange
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const { default: HomePage } = await import("../(protected)/page");

    // Act + Assert
    await expect(HomePage()).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("renders dashboard when user is authenticated", async () => {
    // Arrange
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1", email: "user@example.com" } } });
    const { default: HomePage } = await import("../(protected)/page");

    // Act
    const result = await HomePage();

    // Assert
    expect(result).toBeTruthy();
  });
});
