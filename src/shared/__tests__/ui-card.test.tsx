import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

describe("Card components", () => {
  it("renders Card with children", () => {
    // Arrange + Act
    render(<Card data-testid="card">content</Card>);

    // Assert
    expect(screen.getByTestId("card")).toBeInTheDocument();
  });

  it("renders CardHeader", () => {
    // Arrange + Act
    render(<CardHeader data-testid="header">header</CardHeader>);

    // Assert
    expect(screen.getByTestId("header")).toBeInTheDocument();
  });

  it("renders CardTitle", () => {
    // Arrange + Act
    render(<CardTitle>My Title</CardTitle>);

    // Assert
    expect(screen.getByText("My Title")).toBeInTheDocument();
  });

  it("renders CardDescription", () => {
    // Arrange + Act
    render(<CardDescription>My Description</CardDescription>);

    // Assert
    expect(screen.getByText("My Description")).toBeInTheDocument();
  });

  it("renders CardContent", () => {
    // Arrange + Act
    render(<CardContent data-testid="content">body</CardContent>);

    // Assert
    expect(screen.getByTestId("content")).toBeInTheDocument();
  });

  it("renders CardAction", () => {
    // Arrange + Act
    render(<CardAction data-testid="action">action</CardAction>);

    // Assert
    expect(screen.getByTestId("action")).toBeInTheDocument();
  });

  it("renders CardFooter", () => {
    // Arrange + Act
    render(<CardFooter data-testid="footer">footer</CardFooter>);

    // Assert
    expect(screen.getByTestId("footer")).toBeInTheDocument();
  });

  it("applies custom className to Card", () => {
    // Arrange + Act
    render(<Card className="custom-class" data-testid="card">content</Card>);

    // Assert
    expect(screen.getByTestId("card")).toHaveClass("custom-class");
  });
});
