import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSignInWithPassword = vi.fn();
const mockRedirect = vi.fn();

vi.mock("@/shared/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: { signInWithPassword: mockSignInWithPassword },
    })
  ),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string): unknown => mockRedirect(url),
}));

describe("loginAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error when email is invalid", async () => {
    // Arrange
    const { loginAction } = await import("../actions/login.action");
    const fd = new FormData();
    fd.set("email", "not-an-email");
    fd.set("password", "password123");

    // Act
    const result = await loginAction({ status: "idle" }, fd);

    // Assert
    expect(result.status).toBe("error");
  });

  it("returns error when password is too short", async () => {
    // Arrange
    const { loginAction } = await import("../actions/login.action");
    const fd = new FormData();
    fd.set("email", "user@example.com");
    fd.set("password", "short");

    // Act
    const result = await loginAction({ status: "idle" }, fd);

    // Assert
    expect(result.status).toBe("error");
  });

  it("returns error on auth failure", async () => {
    // Arrange
    mockSignInWithPassword.mockResolvedValue({
      error: { message: "Invalid credentials" },
    });
    const { loginAction } = await import("../actions/login.action");
    const fd = new FormData();
    fd.set("email", "user@example.com");
    fd.set("password", "password123");

    // Act
    const result = await loginAction({ status: "idle" }, fd);

    // Assert
    expect(result).toEqual({ status: "error", message: "Invalid credentials" });
  });

  it("redirects to / on successful login", async () => {
    // Arrange
    mockSignInWithPassword.mockResolvedValue({ error: null });
    const { loginAction } = await import("../actions/login.action");
    const fd = new FormData();
    fd.set("email", "user@example.com");
    fd.set("password", "password123");

    // Act
    await loginAction({ status: "idle" }, fd);

    // Assert
    expect(mockRedirect).toHaveBeenCalledWith("/");
  });
});
