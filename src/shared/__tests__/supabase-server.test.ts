import { describe, it, expect, vi } from "vitest";

const mockSet = vi.fn();
const mockGetAll = vi.fn().mockReturnValue([]);
const mockCreateServerClient = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: (...args: unknown[]): unknown => mockCreateServerClient(...args),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() =>
    Promise.resolve({
      getAll: mockGetAll,
      set: mockSet,
    })
  ),
}));

describe("supabase server", () => {
  it("createClient returns a supabase client", async () => {
    // Arrange
    mockCreateServerClient.mockReturnValue({ auth: {} });
    const { createClient } = await import("../lib/supabase/server");

    // Act
    const client = await createClient();

    // Assert
    expect(client).toBeDefined();
  });

  it("passes cookie getAll to server client config", async () => {
    // Arrange
    let capturedGetAll: (() => unknown) | undefined;
    mockCreateServerClient.mockImplementation(
      (_u: unknown, _k: unknown, opts: { cookies: { getAll: () => unknown } }) => {
        capturedGetAll = opts.cookies.getAll;
        return { auth: {} };
      }
    );
    const { createClient } = await import("../lib/supabase/server");

    // Act
    await createClient();
    if (!capturedGetAll) throw new Error("capturedGetAll not set");
    capturedGetAll();

    // Assert
    expect(mockGetAll).toHaveBeenCalled();
  });

  it("setAll sets cookies via cookieStore", async () => {
    // Arrange
    let capturedSetAll:
      | ((cookies: { name: string; value: string; options: object }[]) => void)
      | undefined;
    mockCreateServerClient.mockImplementation(
      (_u: unknown, _k: unknown, opts: { cookies: { setAll: (c: { name: string; value: string; options: object }[]) => void } }) => {
        capturedSetAll = opts.cookies.setAll;
        return { auth: {} };
      }
    );
    const { createClient } = await import("../lib/supabase/server");
    await createClient();

    // Act
    if (!capturedSetAll) throw new Error("capturedSetAll not set");
    capturedSetAll([{ name: "token", value: "abc", options: { path: "/" } }]);

    // Assert
    expect(mockSet).toHaveBeenCalledWith("token", "abc", { path: "/" });
  });

  it("setAll silently swallows errors from server components", async () => {
    // Arrange
    mockSet.mockImplementation(() => {
      throw new Error("Cannot set cookie");
    });
    let capturedSetAll:
      | ((cookies: { name: string; value: string; options: object }[]) => void)
      | undefined;
    mockCreateServerClient.mockImplementation(
      (_u: unknown, _k: unknown, opts: { cookies: { setAll: (c: { name: string; value: string; options: object }[]) => void } }) => {
        capturedSetAll = opts.cookies.setAll;
        return { auth: {} };
      }
    );
    const { createClient } = await import("../lib/supabase/server");
    await createClient();

    // Act + Assert
    if (!capturedSetAll) throw new Error("capturedSetAll not set");
    const setAll = capturedSetAll;
    expect(() => {
      setAll([{ name: "token", value: "abc", options: {} }]);
    }).not.toThrow();
  });
});
