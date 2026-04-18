import { describe, it, expect, vi } from "vitest";

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: vi.fn(() => ({ auth: {} })),
}));

describe("supabase client", () => {
  it("createClient returns a supabase client", async () => {
    const { createClient } = await import("../lib/supabase/client");
    const client = createClient();
    expect(client).toBeDefined();
  });
});
