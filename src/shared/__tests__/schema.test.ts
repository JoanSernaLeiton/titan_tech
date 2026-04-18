import { describe, it, expect } from "vitest";

import { insertProfileSchema, selectProfileSchema } from "../db/profiles.schema";

describe("profiles schema", () => {
  it("insertProfileSchema validates required fields", () => {
    // Arrange + Act
    const result = insertProfileSchema.safeParse({
      id: "123e4567-e89b-12d3-a456-426614174000",
      email: "test@example.com",
    });

    // Assert
    expect(result.success).toBe(true);
  });

  it("insertProfileSchema rejects invalid uuid", () => {
    // Arrange + Act
    const result = insertProfileSchema.safeParse({
      id: "not-a-uuid",
      email: "test@example.com",
    });

    // Assert
    expect(result.success).toBe(false);
  });

  it("selectProfileSchema is defined", () => {
    // Arrange + Act + Assert
    expect(selectProfileSchema).toBeDefined();
  });
});
