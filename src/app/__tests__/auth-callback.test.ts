import { describe, it, expect, vi, beforeEach } from "vitest";

const mockExchangeCodeForSession = vi.fn();

vi.mock("@/shared/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: { exchangeCodeForSession: mockExchangeCodeForSession },
    })
  ),
}));

describe("auth callback route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to /login with error when code is missing", async () => {
    // Arrange
    const { GET } = await import("../api/auth/callback/route");
    const req = new Request("http://localhost/api/auth/callback");

    // Act
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login?error=no_code");
  });

  it("redirects to /login with error when exchange fails", async () => {
    // Arrange
    mockExchangeCodeForSession.mockResolvedValue({ error: { message: "bad code" } });
    const { GET } = await import("../api/auth/callback/route");
    const req = new Request("http://localhost/api/auth/callback?code=bad-code");

    // Act
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login?error=auth_error");
  });

  it("redirects to / on successful exchange", async () => {
    // Arrange
    mockExchangeCodeForSession.mockResolvedValue({ error: null });
    const { GET } = await import("../api/auth/callback/route");
    const req = new Request("http://localhost/api/auth/callback?code=valid-code");

    // Act
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/");
  });

  it("redirects to next param on successful exchange", async () => {
    // Arrange
    mockExchangeCodeForSession.mockResolvedValue({ error: null });
    const { GET } = await import("../api/auth/callback/route");
    const req = new Request("http://localhost/api/auth/callback?code=valid-code&next=/dashboard");

    // Act
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/dashboard");
  });

  it("ignores protocol-relative next param to prevent open redirect", async () => {
    // Arrange
    mockExchangeCodeForSession.mockResolvedValue({ error: null });
    const { GET } = await import("../api/auth/callback/route");
    const req = new Request("http://localhost/api/auth/callback?code=valid-code&next=//evil.com");

    // Act
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/");
  });
});
