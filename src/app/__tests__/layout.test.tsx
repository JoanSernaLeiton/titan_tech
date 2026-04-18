import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import RootLayout from "../layout";

vi.mock("@/shared/components/providers", () => ({
  Providers: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("RootLayout", () => {
  it("renders children inside body", () => {
    // Arrange + Act
    const { container } = render(
      <RootLayout>
        <p data-testid="child-content">Hello</p>
      </RootLayout>
    );

    // Assert
    expect(container.querySelector("[data-testid='child-content']")).toBeTruthy();
  });
});
