import { NextRequest } from "next/server";
import { describe, it, expect, vi } from "vitest";

const mockUpdateSession = vi.fn();

vi.mock("@/shared/lib/supabase/middleware", () => ({
  updateSession: (...args: unknown[]): unknown => mockUpdateSession(...args),
}));

describe("proxy", () => {
  it("delegates to updateSession", async () => {
    // Arrange
    const mockResponse = new Response(null, { status: 200 });
    mockUpdateSession.mockResolvedValue(mockResponse);
    const mod = await import("../../../proxy") as { proxy: (req: NextRequest) => Promise<Response> };
    const req = new NextRequest("http://localhost/dashboard");

    // Act
    const response = await mod.proxy(req);

    // Assert
    expect(mockUpdateSession).toHaveBeenCalledWith(req);
    expect(response).toBe(mockResponse);
  });

  it("exports a matcher config", async () => {
    // Arrange + Act
    const mod = await import("../../../proxy") as { config: { matcher: string[] } };

    // Assert
    expect(mod.config.matcher).toBeDefined();
    expect(Array.isArray(mod.config.matcher)).toBe(true);
  });
});
