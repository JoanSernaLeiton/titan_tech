import { vi } from "vitest";

type Chain = Record<string, ReturnType<typeof vi.fn>>;

/**
 * Creates a chainable Supabase query mock.
 *
 * Usage:
 *   const chain = makeChain({ data: [...], error: null });
 *   mockSupabase.from.mockReturnValue(chain);
 *
 * Supports: .select() .insert() .update() .delete() .eq() .single() .order()
 * Each method returns the same chain, so calls can be chained arbitrarily.
 * The chain resolves with `resolvedValue` when awaited.
 */
export function makeChain(resolvedValue: unknown): Chain {
  const chain: Chain = {};
  const methods = [
    "select",
    "insert",
    "update",
    "delete",
    "eq",
    "single",
    "order",
    "limit",
    "match",
  ];
  for (const method of methods) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }
  chain.then = vi.fn((cb: (v: unknown) => unknown) => cb(resolvedValue));
  return chain;
}

/**
 * Creates a minimal Supabase client mock with auth + from.
 *
 * Usage:
 *   const { mockClient, mockFrom } = makeSupabaseMock({ user: mockUser });
 *   vi.mocked(createClient).mockResolvedValue(mockClient as never);
 *   mockFrom.mockReturnValue(makeChain({ data: [...], error: null }));
 */
export function makeSupabaseMock(authResult: {
  user: { id: string } | null;
  error?: unknown;
}) {
  const mockFrom = vi.fn();
  const mockClient = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: authResult.user },
        error: authResult.error ?? null,
      }),
    },
    from: mockFrom,
  };
  return { mockClient, mockFrom };
}
