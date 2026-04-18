import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { Spinner } from "../components/ui/spinner";

describe("Spinner", () => {
  it("renders with animate-spin class", () => {
    // Arrange + Act
    const { container } = render(<Spinner />);

    // Assert
    expect(container.firstChild).toHaveClass("animate-spin");
  });

  it("applies custom className alongside animate-spin", () => {
    // Arrange + Act
    const { container } = render(<Spinner className="size-4" />);

    // Assert
    expect(container.firstChild).toHaveClass("animate-spin", "size-4");
  });
});
