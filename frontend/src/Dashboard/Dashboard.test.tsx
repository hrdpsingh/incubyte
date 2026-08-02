import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import Dashboard from "./Dashboard";

// Fixture data for happy-path component assertions
const vehicle = {
    id: 1,
    make: "Toyota",
    model: "Camry",
    category: "Sedan",
    price: 28000,
    quantity: 5,
};

const token = "abc123";

// Helper to construct mock Response objects for window.fetch
const mockResponse = (data: unknown, ok = true, status = 200) => ({
    ok,
    status,
    json: async () => data,
});

// Standard prop set modeling an authenticated non-admin session
const defaultProps = {
    token,
    isAdmin: false,
    logout: vi.fn(),
    navigate: vi.fn(),
};

// Custom render helper allowing selective prop overrides
const renderDashboard = (
    props: Partial<typeof defaultProps> = {},
) => render(<Dashboard {...defaultProps} {...props} />);

// Helper to wait for the initial asynchronous data fetch and render cycle
const loadVehicle = () => screen.findByText("Toyota Camry");

describe("Dashboard", () => {
    beforeEach(() => {
        // Prevent spy leakages and call count pollution across isolated test runs
        vi.restoreAllMocks();
    });

    test("displays vehicles returned by the API", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(mockResponse([vehicle])),
        );

        renderDashboard();

        expect(await loadVehicle()).toBeInTheDocument();
        expect(screen.getByText("5 Available")).toBeInTheDocument();
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
        // Model an unhandled API or HTTP 500 failure
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({ ok: false }),
        );

        renderDashboard();

        expect(
            await screen.findByText(/failed to load vehicles/i),
        ).toBeInTheDocument();
    });

    test("searches vehicles by criteria", async () => {
        // Sequence: 1. Initial mount load, 2. Search query request
        const fetch = vi
            .fn()
            .mockResolvedValueOnce(mockResponse([vehicle]))
            .mockResolvedValueOnce(mockResponse([vehicle]));

        vi.stubGlobal("fetch", fetch);

        renderDashboard();

        await loadVehicle();

        await userEvent.type(
            screen.getByPlaceholderText(/search make, model, or category/i),
            "Toyota Camry",
        );

        await userEvent.click(
            screen.getByRole("button", { name: /search/i }),
        );

        // Verify search term is URI-encoded and includes auth credentials
        await waitFor(() =>
            expect(fetch).toHaveBeenLastCalledWith(
                expect.stringContaining("/api/vehicles/search?q=Toyota+Camry"),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: `Bearer ${token}`,
                    }),
                }),
            ),
        );
    });

    test("purchases a vehicle", async () => {
        // Sequence: 1. Initial load, 2. Purchase POST, 3. Refresh list request
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

        // Confirm endpoint route, mutation HTTP verb, and auth context
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

        // Verify optimistic or re-fetched state update in the UI
        expect(await screen.findByText("4 Available")).toBeInTheDocument();
        expect(fetch).toHaveBeenCalledTimes(3);
    });

    test("shows an error when purchasing an out-of-stock vehicle", async () => {
        // Sequence: 1. Initial load, 2. Failed mutation response
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

        // Ensure network client injects passed token into request headers
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

        // queryByRole returns null instead of throwing, allowing absence checks
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