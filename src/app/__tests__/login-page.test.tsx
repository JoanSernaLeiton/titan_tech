import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import LoginPage from "../(auth)/login/page";

vi.mock("@/features/auth/components/login-form", () => ({
  LoginForm: () => <div data-testid="login-form" />,
}));

describe("LoginPage", () => {
  it("renders the welcome heading in Spanish", () => {
    // Arrange + Act
    render(<LoginPage />);

    // Assert
    expect(screen.getByText(/bienvenido de nuevo/i)).toBeInTheDocument();
  });

  it("renders the LoginForm component", () => {
    // Arrange + Act
    render(<LoginPage />);

    // Assert
    expect(screen.getByTestId("login-form")).toBeInTheDocument();
  });

  it("renders the sign-in description in Spanish", () => {
    // Arrange + Act
    render(<LoginPage />);

    // Assert
    expect(screen.getByText(/inicia sesión en tu cuenta/i)).toBeInTheDocument();
  });
});
