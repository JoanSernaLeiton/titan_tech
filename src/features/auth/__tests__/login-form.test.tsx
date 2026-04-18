import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { LoginForm } from "../components/login-form";

const mockToastError = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: (...args: unknown[]): unknown => mockToastError(...args),
  },
  Toaster: () => null,
}));

const mockLoginAction = vi.fn().mockResolvedValue({ status: "idle" });

vi.mock("../actions/login.action", () => ({
  loginAction: (...args: unknown[]): unknown => mockLoginAction(...args),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoginAction.mockResolvedValue({ status: "idle" });
  });

  it("renders email and password fields", () => {
    // Arrange + Act
    render(<LoginForm />);

    // Assert
    expect(screen.getByLabelText(/correo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
  });

  it("renders submit button", () => {
    // Arrange + Act
    render(<LoginForm />);

    // Assert
    expect(screen.getByRole("button", { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it("shows validation error when submitting with empty email", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<LoginForm />);

    // Act
    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    // Assert
    expect(await screen.findByText(/correo electrónico inválido/i)).toBeInTheDocument();
  });

  it("shows validation error for short password", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<LoginForm />);

    // Act
    await user.type(screen.getByLabelText(/correo/i), "user@example.com");
    await user.type(screen.getByLabelText(/contraseña/i), "short");
    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    // Assert
    expect(await screen.findByText(/al menos 8 caracteres/i)).toBeInTheDocument();
  });

  it("submits with valid credentials and calls loginAction", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<LoginForm />);

    // Act
    await user.type(screen.getByLabelText(/correo/i), "user@example.com");
    await user.type(screen.getByLabelText(/contraseña/i), "password123");
    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    // Assert
    await waitFor(() => {
      expect(mockLoginAction).toHaveBeenCalled();
    });
  });

  it("displays server-side error message and toast when action returns error", async () => {
    // Arrange
    mockLoginAction.mockResolvedValue({ status: "error", message: "Invalid credentials" });
    const user = userEvent.setup();
    render(<LoginForm />);

    // Act
    await user.type(screen.getByLabelText(/correo/i), "user@example.com");
    await user.type(screen.getByLabelText(/contraseña/i), "password123");
    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    // Assert
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      expect(mockToastError).toHaveBeenCalledWith("Invalid credentials");
    });
  });
});
