import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

import ErrorPage from "../error";

describe("ErrorPage", () => {
  it("renders error heading", () => {
    // Arrange
    const error = new Error("Something failed");
    const reset = vi.fn();

    // Act
    render(<ErrorPage error={error} reset={reset} />);

    // Assert
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it("renders error message", () => {
    // Arrange
    const error = new Error("Specific error message");
    const reset = vi.fn();

    // Act
    render(<ErrorPage error={error} reset={reset} />);

    // Assert
    expect(screen.getByText("Specific error message")).toBeInTheDocument();
  });

  it("renders Try again button", () => {
    // Arrange
    const error = new Error("test");
    const reset = vi.fn();

    // Act
    render(<ErrorPage error={error} reset={reset} />);

    // Assert
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("calls reset when Try again is clicked", async () => {
    // Arrange
    const error = new Error("test");
    const reset = vi.fn();
    const user = userEvent.setup();
    render(<ErrorPage error={error} reset={reset} />);

    // Act
    await user.click(screen.getByRole("button", { name: /try again/i }));

    // Assert
    expect(reset).toHaveBeenCalledOnce();
  });

  it("logs error to console on mount", () => {
    // Arrange
    const error = new Error("logged error");
    const reset = vi.fn();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    // Act
    render(<ErrorPage error={error} reset={reset} />);

    // Assert
    expect(consoleSpy).toHaveBeenCalledWith(error);
    consoleSpy.mockRestore();
  });
});
