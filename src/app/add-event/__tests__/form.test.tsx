// app/add-event/__tests__/form.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddEventPage from "../page"; // adjust import if needed
import "@testing-library/jest-dom/extend-expect";

describe("AddEventPage form", () => {
  it("renders the city input and accepts input", async () => {
    render(<AddEventPage />);

    // Find the input — replace with testId, label text, or role as needed
    const cityInput = screen.getByPlaceholderText(/enter city/i);
    expect(cityInput).toBeInTheDocument();

    // Simulate user typing into the input
    await userEvent.clear(cityInput);
    await userEvent.type(cityInput, "San Francisco");

    expect(cityInput).toHaveValue("San Francisco");
  });
});
