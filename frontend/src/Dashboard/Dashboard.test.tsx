import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import Dashboard from "./Dashboard";

const vehicle = {
    id: 1,
    make: "Toyota",
    model: "Camry",
    category: "Sedan",
    price: 28000,
    quantity: 5,
};

describe("Dashboard", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    test("displays vehicles returned by the API", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn(() =>
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve([vehicle]),
                }),
            ),
        );

        render(<Dashboard token="abc123" logout={vi.fn()} />);

        expect(await screen.findByText("Toyota Camry")).toBeInTheDocument();
        expect(screen.getByText("Stock: 5")).toBeInTheDocument();
    });

    test("shows a message when no vehicles are available", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn(() =>
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve([]),
                }),
            ),
        );

        render(<Dashboard token="abc123" logout={vi.fn()} />);

        expect(
            await screen.findByText(/no vehicles available/i),
        ).toBeInTheDocument();
    });

    test("shows an error if vehicles cannot be loaded", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn(() =>
                Promise.resolve({
                    ok: false,
                }),
            ),
        );

        render(<Dashboard token="abc123" logout={vi.fn()} />);

        expect(
            await screen.findByText(/failed to load vehicles/i),
        ).toBeInTheDocument();
    });

    test("searches vehicles by make", async () => {
        const fetch = vi
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                json: async () => [vehicle],
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => [vehicle],
            });

        vi.stubGlobal("fetch", fetch);

        render(<Dashboard token="abc123" logout={vi.fn()} />);

        await screen.findByText("Toyota Camry");

        await userEvent.type(
            screen.getByPlaceholderText(/make/i),
            "Toyota",
        );

        await userEvent.click(
            screen.getByRole("button", { name: /search/i }),
        );

        await waitFor(() =>
            expect(fetch).toHaveBeenLastCalledWith(
                expect.stringContaining("/api/vehicles/search?make=Toyota"),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: "Bearer abc123",
                    }),
                }),
            ),
        );
    });

    test("purchases a vehicle", async () => {
        const fetch = vi
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                json: async () => [vehicle],
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    ...vehicle,
                    quantity: 4,
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => [
                    {
                        ...vehicle,
                        quantity: 4,
                    },
                ],
            });

        vi.stubGlobal("fetch", fetch);

        render(<Dashboard token="abc123" logout={vi.fn()} />);

        await screen.findByText("Toyota Camry");

        await userEvent.click(
            screen.getByRole("button", { name: /purchase/i }),
        );

        await waitFor(() =>
            expect(fetch).toHaveBeenNthCalledWith(
                2,
                expect.stringContaining("/api/vehicles/1/purchase"),
                expect.objectContaining({
                    method: "POST",
                    headers: expect.objectContaining({
                        Authorization: "Bearer abc123",
                    }),
                }),
            ),
        );

        expect(await screen.findByText("Stock: 4")).toBeInTheDocument();

        expect(fetch).toHaveBeenCalledTimes(3);
    });

    test("shows an error when purchasing an out-of-stock vehicle", async () => {
        const fetch = vi
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                json: async () => [vehicle],
            })
            .mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: async () => ({
                    detail: "Vehicle is out of stock",
                }),
            });

        vi.stubGlobal("fetch", fetch);

        render(<Dashboard token="abc123" logout={vi.fn()} />);

        await screen.findByText("Toyota Camry");

        await userEvent.click(
            screen.getByRole("button", { name: /purchase/i }),
        );

        expect(
            await screen.findByText(/vehicle is out of stock/i),
        ).toBeInTheDocument();
    });

    test("includes the bearer token on every request", async () => {
        const fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                json: async () => [vehicle],
            }),
        );

        vi.stubGlobal("fetch", fetch);

        render(<Dashboard token="secret-token" logout={vi.fn()} />);

        await screen.findByText("Toyota Camry");

        expect(fetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: "Bearer secret-token",
                }),
            }),
        );
    });
});