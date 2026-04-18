import { describe, it, expect } from "vitest";

import { cn } from "../lib/utils";

describe("cn", () => {
  it("merges multiple class names", () => {
    // Arrange + Act + Assert
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("omits falsy conditional classes", () => {
    // Arrange
    const falsy = false as boolean;

    // Act + Assert
    expect(cn("foo", falsy && "bar", "baz")).toBe("foo baz");
  });

  it("handles undefined values", () => {
    // Arrange + Act + Assert
    expect(cn("foo", undefined, "bar")).toBe("foo bar");
  });

  it("deduplicates conflicting tailwind classes (last one wins)", () => {
    // Arrange + Act + Assert
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("handles empty call", () => {
    // Arrange + Act + Assert
    expect(cn()).toBe("");
  });
});
