import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import LoginPage from "../(auth)/login/page";

vi.mock("@/features/auth/components/login-form", () => ({
  LoginForm: () => <div data-testid="login-form" />,
}));

describe("LoginPage", () => {
  it("renders the brand heading", () => {
    // Arrange + Act
    render(<LoginPage />);

    // Assert
    expect(screen.getByText(/techos rentables/i)).toBeInTheDocument();
  });

  it("renders the LoginForm component", () => {
    // Arrange + Act
    render(<LoginPage />);

    // Assert
    expect(screen.getByTestId("login-form")).toBeInTheDocument();
  });

  it("renders the brand subtitle", () => {
    // Arrange + Act
    render(<LoginPage />);

    // Assert
    expect(screen.getByText(/energía solar/i)).toBeInTheDocument();
  });
});
