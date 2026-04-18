import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { describe, it, expect, vi } from "vitest";

import { useAuth } from "../hooks/use-auth";

const mockGetSession = vi.fn();

vi.mock("@/shared/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getSession: mockGetSession },
  }),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("useAuth", () => {
  it("returns session data when auth succeeds", async () => {
    // Arrange
    const mockSession = { user: { id: "123", email: "test@example.com" } };
    mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });

    // Act
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Assert
    await waitFor(() => { expect(result.current.isSuccess).toBe(true); });
    expect(result.current.data).toEqual(mockSession);
  });

  it("transitions to error state when auth fails", async () => {
    // Arrange
    mockGetSession.mockResolvedValue({ data: { session: null }, error: new Error("Auth error") });

    // Act
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Assert
    await waitFor(() => { expect(result.current.isError).toBe(true); });
  });
});
