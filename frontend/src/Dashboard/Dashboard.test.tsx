import { render, screen } from "@testing-library/react";
import { vi, test, expect } from "vitest";
import Dashboard from "./Dashboard";

test("displays vehicles returned by the API", async () => {
    vi.stubGlobal(
        "fetch",
        vi.fn(() =>
            Promise.resolve({
                ok: true,
                json: () =>
                    Promise.resolve([
                        {
                            id: 1,
                            make: "Toyota",
                            model: "Camry",
                            category: "Sedan",
                            price: 28000,
                            quantity: 5,
                        },
                    ]),
            }),
        ),
    );

    render(<Dashboard token="abc123" logout={vi.fn()} />);

    expect(await screen.findByText("Toyota Camry")).toBeInTheDocument();
    expect(screen.getByText("Stock: 5")).toBeInTheDocument();
});