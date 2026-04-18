import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { Button } from "../components/ui/button";

describe("Button", () => {
  it("renders with default variant", () => {
    // Arrange + Act
    render(<Button>Click me</Button>);

    // Assert
    expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
  });

  it("renders as disabled when disabled prop is set", () => {
    // Arrange + Act
    render(<Button disabled>Submit</Button>);

    // Assert
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("renders with custom className", () => {
    // Arrange + Act
    render(<Button className="custom-class">Click</Button>);

    // Assert
    expect(screen.getByRole("button")).toHaveClass("custom-class");
  });

  it("renders as a Slot (asChild) when asChild is true", () => {
    // Arrange + Act
    render(
      <Button asChild>
        <a href="/home">Go home</a>
      </Button>
    );

    // Assert
    expect(screen.getByRole("link", { name: /go home/i })).toBeInTheDocument();
  });

  it("renders with destructive variant", () => {
    // Arrange + Act
    render(<Button variant="destructive">Delete</Button>);

    // Assert
    const btn = screen.getByRole("button", { name: /delete/i });
    expect(btn).toBeInTheDocument();
    expect(btn.className).toContain("destructive");
  });

  it("is disabled and renders spinner SVG when loading is true", () => {
    // Arrange + Act
    render(<Button loading>Save</Button>);

    // Assert
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    expect(btn.querySelector("svg")).toBeInTheDocument();
  });

  it("renders children alongside spinner when loading is true", () => {
    // Arrange + Act
    render(<Button loading>Save</Button>);

    // Assert
    expect(screen.getByText("Save")).toBeInTheDocument();
  });

  it("does not render spinner when loading is false", () => {
    // Arrange + Act
    render(<Button>Save</Button>);

    // Assert
    const btn = screen.getByRole("button");
    expect(btn.querySelector("svg")).not.toBeInTheDocument();
  });
});
