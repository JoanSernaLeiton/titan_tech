import type * as NextServerTypes from "next/server";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUser = vi.fn();
const mockCreateServerClient = vi.fn();
const mockNextResponseNext = vi.fn();
const mockNextResponseRedirect = vi.fn();
const mockRequestGetAll = vi.fn(() => []);
const mockRequestSet = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: (...args: unknown[]): unknown => mockCreateServerClient(...args),
}));

vi.mock("next/server", async () => {
  const actual = await vi.importActual<typeof NextServerTypes>("next/server");
  return {
    ...actual,
    NextResponse: {
      next: (...args: unknown[]): unknown => mockNextResponseNext(...args),
      redirect: (...args: unknown[]): unknown => mockNextResponseRedirect(...args),
    },
  };
});

interface CookieOptions { path?: string; maxAge?: number }
interface CookieItem { name: string; value: string; options: CookieOptions }
interface CookieCallbacks {
  getAll: () => CookieItem[];
  setAll: (cookies: CookieItem[]) => void;
}

function makeRequest(pathname: string) {
  return {
    nextUrl: {
      pathname,
      clone: () => ({ pathname, toString: () => `http://localhost${pathname}` }),
    },
    cookies: { getAll: mockRequestGetAll, set: mockRequestSet },
    headers: new Headers(),
    url: `http://localhost${pathname}`,
  } as unknown as NextServerTypes.NextRequest;
}

describe("supabase middleware (updateSession)", () => {
  let capturedCookieCallbacks: CookieCallbacks | undefined;
  const fakeResponse = {
    cookies: { set: vi.fn(), getAll: vi.fn(() => []) },
    status: 200,
    headers: new Headers(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    capturedCookieCallbacks = undefined;
    mockNextResponseNext.mockReturnValue(fakeResponse);
    mockNextResponseRedirect.mockImplementation((url: unknown) => ({
      status: 307,
      headers: new Headers({ location: String(url) }),
    }));
    mockCreateServerClient.mockImplementation(
      (_u: unknown, _k: unknown, opts: { cookies: CookieCallbacks }) => {
        capturedCookieCallbacks = opts.cookies;
        return { auth: { getUser: mockGetUser } };
      }
    );
  });

  it("returns nextResponse for authenticated user on protected route", async () => {
    // Arrange
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const { updateSession } = await import("../lib/supabase/middleware");
    const req = makeRequest("/dashboard");

    // Act
    const response = await updateSession(req);

    // Assert
    expect(response).toBeDefined();
    expect(mockNextResponseRedirect).not.toHaveBeenCalled();
  });

  it("invokes getAll cookie callback", async () => {
    // Arrange
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const { updateSession } = await import("../lib/supabase/middleware");
    const req = makeRequest("/dashboard");
    await updateSession(req);

    // Act
    if (!capturedCookieCallbacks) throw new Error("capturedCookieCallbacks not set");
    capturedCookieCallbacks.getAll();

    // Assert
    expect(mockRequestGetAll).toHaveBeenCalled();
  });

  it("invokes setAll cookie callback and updates request + response cookies", async () => {
    // Arrange
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const { updateSession } = await import("../lib/supabase/middleware");
    const req = makeRequest("/dashboard");
    await updateSession(req);

    // Act
    if (!capturedCookieCallbacks) throw new Error("capturedCookieCallbacks not set");
    capturedCookieCallbacks.setAll([
      { name: "sb-token", value: "abc", options: { path: "/" } },
    ]);

    // Assert
    expect(mockRequestSet).toHaveBeenCalledWith("sb-token", "abc");
    expect(fakeResponse.cookies.set).toHaveBeenCalledWith("sb-token", "abc", { path: "/" });
  });

  it("redirects unauthenticated user from protected route", async () => {
    // Arrange
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const { updateSession } = await import("../lib/supabase/middleware");
    const req = makeRequest("/dashboard");

    // Act
    await updateSession(req);

    // Assert
    expect(mockNextResponseRedirect).toHaveBeenCalled();
  });

  it("does not redirect unauthenticated user on login route", async () => {
    // Arrange
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const { updateSession } = await import("../lib/supabase/middleware");
    const req = makeRequest("/login");

    // Act
    await updateSession(req);

    // Assert
    expect(mockNextResponseRedirect).not.toHaveBeenCalled();
  });

  it("does not redirect unauthenticated user on root path", async () => {
    // Arrange
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const { updateSession } = await import("../lib/supabase/middleware");
    const req = makeRequest("/");

    // Act
    await updateSession(req);

    // Assert
    expect(mockNextResponseRedirect).not.toHaveBeenCalled();
  });

  it("does not redirect on /api/auth routes", async () => {
    // Arrange
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const { updateSession } = await import("../lib/supabase/middleware");
    const req = makeRequest("/api/auth/callback");

    // Act
    await updateSession(req);

    // Assert
    expect(mockNextResponseRedirect).not.toHaveBeenCalled();
  });
});
