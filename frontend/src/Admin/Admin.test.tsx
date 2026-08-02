import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Admin from "./Admin";

// Test fixture data
const vehicles = [
    {
        id: 1,
        make: "Toyota",
        model: "Camry",
        category: "Sedan",
        price: 25000,
        quantity: 5,
    },
];

const mockNavigate = vi.fn();

// Mock response builder for global fetch
function mockFetch(response: any, ok = true) {
    globalThis.fetch = vi.fn().mockResolvedValue({
        ok,
        json: vi.fn().mockResolvedValue(response),
    }) as any;
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe("Admin", () => {
    it("shows loading then renders vehicles", async () => {
        mockFetch(vehicles);
        render(<Admin token="token" navigate={mockNavigate} />);

        // Verify initial render and data fetch
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
        expect(await screen.findByText(/Toyota Camry/)).toBeInTheDocument();

        expect(globalThis.fetch).toHaveBeenCalledWith(
            expect.stringContaining("/api/vehicles"),
            expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: "Bearer token",
                }),
            })
        );
    });

    it("navigates back to inventory", async () => {
        mockFetch(vehicles);
        render(<Admin token="token" navigate={mockNavigate} />);

        await screen.findByText(/Toyota Camry/);

        // Test navigation callback
        await userEvent.click(
            screen.getByRole("button", { name: /back to inventory/i })
        );

        expect(mockNavigate).toHaveBeenCalledWith("dashboard");
    });

    it("adds a vehicle", async () => {
        // Mock fetch sequence: initial load, POST creation, refreshed list
        globalThis.fetch = vi
            .fn()
            .mockResolvedValueOnce({ ok: true, json: async () => [] })
            .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
            .mockResolvedValueOnce({ ok: true, json: async () => vehicles });

        render(<Admin token="abc" navigate={mockNavigate} />);

        await waitFor(() =>
            expect(screen.getByPlaceholderText("Make")).toBeInTheDocument()
        );

        // Fill out and submit vehicle creation form
        await userEvent.type(screen.getByPlaceholderText("Make"), "Toyota");
        await userEvent.type(screen.getByPlaceholderText("Model"), "Camry");
        await userEvent.type(screen.getByPlaceholderText("Category"), "Sedan");
        await userEvent.type(screen.getByPlaceholderText("Price"), "25000");
        await userEvent.type(screen.getByPlaceholderText("Quantity"), "5");

        await userEvent.click(screen.getByRole("button", { name: /add vehicle/i }));

        expect(globalThis.fetch).toHaveBeenCalledWith(
            expect.stringContaining("/api/vehicles"),
            expect.objectContaining({
                method: "POST",
                body: JSON.stringify({
                    make: "Toyota",
                    model: "Camry",
                    category: "Sedan",
                    price: 25000,
                    quantity: 5,
                }),
            })
        );
    });

    it("deletes a vehicle", async () => {
        // Mock fetch sequence: initial load, DELETE request, refreshed list
        globalThis.fetch = vi
            .fn()
            .mockResolvedValueOnce({ ok: true, json: async () => vehicles })
            .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
            .mockResolvedValueOnce({ ok: true, json: async () => [] });

        render(<Admin token="abc" navigate={mockNavigate} />);

        await screen.findByText(/Toyota Camry/);
        await userEvent.click(screen.getByRole("button", { name: /delete/i }));

        expect(globalThis.fetch).toHaveBeenCalledWith(
            expect.stringContaining("/api/vehicles/1"),
            expect.objectContaining({ method: "DELETE" })
        );
    });

    it("loads vehicle into form when edit is clicked", async () => {
        mockFetch(vehicles);
        render(<Admin token="abc" navigate={mockNavigate} />);

        await screen.findByText(/Toyota Camry/);
        await userEvent.click(screen.getByRole("button", { name: /edit/i }));

        // Verify edit form population
        expect(screen.getByDisplayValue("Toyota")).toBeInTheDocument();
        expect(screen.getByDisplayValue("Camry")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
    });

    it("restocks a vehicle", async () => {
        // Mock fetch sequence: initial load, POST restock, refreshed list
        globalThis.fetch = vi
            .fn()
            .mockResolvedValueOnce({ ok: true, json: async () => vehicles })
            .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
            .mockResolvedValueOnce({ ok: true, json: async () => vehicles });

        render(<Admin token="abc" navigate={mockNavigate} />);

        await screen.findByText(/Toyota Camry/);

        // Submit restock payload
        const qtyInput = screen.getByPlaceholderText("Qty");
        await userEvent.type(qtyInput, "4");

        await userEvent.click(screen.getByRole("button", { name: /restock/i }));

        expect(globalThis.fetch).toHaveBeenCalledWith(
            expect.stringContaining("/api/vehicles/1/restock"),
            expect.objectContaining({
                method: "POST",
                body: JSON.stringify({ quantity: 4 }),
            })
        );
    });

    it("searches vehicles", async () => {
        // Mock fetch sequence: initial empty state, search result list
        globalThis.fetch = vi
            .fn()
            .mockResolvedValueOnce({ ok: true, json: async () => [] })
            .mockResolvedValueOnce({ ok: true, json: async () => vehicles });

        render(<Admin token="abc" navigate={mockNavigate} />);

        await waitFor(() =>
            expect(screen.getByPlaceholderText(/search make, model, or category/i)).toBeInTheDocument()
        );

        // Submit search query
        await userEvent.type(
            screen.getByPlaceholderText(/search make, model, or category/i),
            "Toyota Camry"
        );

        fireEvent.submit(
            screen.getByRole("button", { name: /search/i }).closest("form")!
        );

        await waitFor(() =>
            expect(globalThis.fetch).toHaveBeenLastCalledWith(
                expect.stringContaining("search?q=Toyota+Camry"),
                expect.any(Object)
            )
        );
    });

    it("shows API errors", async () => {
        // Mock API error response
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: false,
            json: async () => ({
                detail: "Failed to load vehicles",
            }),
        });

        render(<Admin token="abc" navigate={mockNavigate} />);

        expect(
            await screen.findByText(/failed to load vehicles/i)
        ).toBeInTheDocument();
    });
});