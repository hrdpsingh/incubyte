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

const token = "abc123";

const mockResponse = (data: unknown, ok = true, status = 200) => ({
    ok,
    status,
    json: async () => data,
});

const defaultProps = {
    token,
    isAdmin: false,
    logout: vi.fn(),
    navigate: vi.fn(),
};

const renderDashboard = (
    props: Partial<typeof defaultProps> = {},
) => render(<Dashboard {...defaultProps} {...props} />);

const loadVehicle = () => screen.findByText("Toyota Camry");

describe("Dashboard", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    test("displays vehicles returned by the API", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(mockResponse([vehicle])),
        );

        renderDashboard();

        expect(await loadVehicle()).toBeInTheDocument();
        expect(screen.getByText("Stock: 5")).toBeInTheDocument();
    });

    test("shows a message when no vehicles are available", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(mockResponse([])),
        );

        renderDashboard();

        expect(
            await screen.findByText(/no vehicles available/i),
        ).toBeInTheDocument();
    });

    test("shows an error if vehicles cannot be loaded", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({ ok: false }),
        );

        renderDashboard();

        expect(
            await screen.findByText(/failed to load vehicles/i),
        ).toBeInTheDocument();
    });

    test("searches vehicles by make", async () => {
        const fetch = vi
            .fn()
            .mockResolvedValueOnce(mockResponse([vehicle]))
            .mockResolvedValueOnce(mockResponse([vehicle]));

        vi.stubGlobal("fetch", fetch);

        renderDashboard();

        await loadVehicle();

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
                        Authorization: `Bearer ${token}`,
                    }),
                }),
            ),
        );
    });

    test("purchases a vehicle", async () => {
        const fetch = vi
            .fn()
            .mockResolvedValueOnce(mockResponse([vehicle]))
            .mockResolvedValueOnce(
                mockResponse({
                    ...vehicle,
                    quantity: 4,
                }),
            )
            .mockResolvedValueOnce(
                mockResponse([
                    {
                        ...vehicle,
                        quantity: 4,
                    },
                ]),
            );

        vi.stubGlobal("fetch", fetch);

        renderDashboard();

        await loadVehicle();

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
                        Authorization: `Bearer ${token}`,
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
            .mockResolvedValueOnce(mockResponse([vehicle]))
            .mockResolvedValueOnce(
                mockResponse(
                    { detail: "Vehicle is out of stock" },
                    false,
                    400,
                ),
            );

        vi.stubGlobal("fetch", fetch);

        renderDashboard();

        await loadVehicle();

        await userEvent.click(
            screen.getByRole("button", { name: /purchase/i }),
        );

        expect(
            await screen.findByText(/vehicle is out of stock/i),
        ).toBeInTheDocument();
    });

    test("includes the bearer token on every request", async () => {
        const fetch = vi
            .fn()
            .mockResolvedValue(mockResponse([vehicle]));

        vi.stubGlobal("fetch", fetch);

        renderDashboard({
            token: "secret-token",
        });

        await loadVehicle();

        expect(fetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: "Bearer secret-token",
                }),
            }),
        );
    });

    test("does not show the admin panel button for regular users", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(mockResponse([vehicle])),
        );

        renderDashboard({
            isAdmin: false,
        });

        await loadVehicle();

        expect(
            screen.queryByRole("button", {
                name: /admin panel/i,
            }),
        ).not.toBeInTheDocument();
    });

    test("shows the admin panel button for admins", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(mockResponse([vehicle])),
        );

        renderDashboard({
            isAdmin: true,
        });

        await loadVehicle();

        expect(
            screen.getByRole("button", {
                name: /admin panel/i,
            }),
        ).toBeInTheDocument();
    });
});