import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom';
import Admin from './Admin';

const mockVehicles = [
    {
        id: 1,
        make: 'Toyota',
        model: 'Camry',
        category: 'Sedan',
        price: 25000,
        quantity: 10,
    },
    {
        id: 2,
        make: 'Ford',
        model: 'F-150',
        category: 'Truck',
        price: 35000,
        quantity: 5,
    },
];

describe('Admin Component', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('fetches and displays the list of vehicles on mount', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
            ok: true,
            json: async () => mockVehicles,
        } as Response);

        render(<Admin />);

        expect(screen.getByText(/loading/i)).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Toyota')).toBeInTheDocument();
            expect(screen.getByText('Camry')).toBeInTheDocument();
            expect(screen.getByText('Ford')).toBeInTheDocument();
            expect(screen.getByText('F-150')).toBeInTheDocument();
        });

        expect(globalThis.fetch).toHaveBeenCalledWith('/api/vehicles', expect.any(Object));
    });

    it('allows the admin to add a new vehicle', async () => {
        const user = userEvent.setup();
        const newVehicle = {
            id: 3,
            make: 'Tesla',
            model: 'Model 3',
            category: 'Electric',
            price: 40000,
            quantity: 8,
        };

        vi.spyOn(globalThis, 'fetch')
            .mockResolvedValueOnce({
                ok: true,
                json: async () => mockVehicles,
            } as Response)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => newVehicle,
            } as Response)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => [...mockVehicles, newVehicle],
            } as Response);

        render(<Admin />);

        await waitFor(() => {
            expect(screen.getByText('Toyota')).toBeInTheDocument();
        });

        await user.type(screen.getByLabelText(/make/i), 'Tesla');
        await user.type(screen.getByLabelText(/model/i), 'Model 3');
        await user.type(screen.getByLabelText(/category/i), 'Electric');
        await user.type(screen.getByLabelText(/price/i), '40000');
        await user.type(screen.getByLabelText(/quantity/i), '8');

        await user.click(screen.getByRole('button', { name: /add vehicle/i }));

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(
                '/api/vehicles',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
                    body: JSON.stringify({
                        make: 'Tesla',
                        model: 'Model 3',
                        category: 'Electric',
                        price: 40000,
                        quantity: 8,
                    }),
                })
            );
        });

        await waitFor(() => {
            expect(screen.getByText('Tesla')).toBeInTheDocument();
            expect(screen.getByText('Model 3')).toBeInTheDocument();
        });
    });

    it('allows the admin to edit an existing vehicle', async () => {
        const user = userEvent.setup();
        const updatedVehicle = {
            ...mockVehicles[0],
            price: 27000,
        };

        vi.spyOn(globalThis, 'fetch')
            .mockResolvedValueOnce({
                ok: true,
                json: async () => mockVehicles,
            } as Response)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => updatedVehicle,
            } as Response)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => [updatedVehicle, mockVehicles[1]],
            } as Response);

        render(<Admin />);

        await waitFor(() => {
            expect(screen.getByText('Toyota')).toBeInTheDocument();
        });

        const editButtons = screen.getAllByRole('button', { name: /edit/i });
        await user.click(editButtons[0]);

        const priceInput = screen.getByLabelText(/price/i);
        await user.clear(priceInput);
        await user.type(priceInput, '27000');

        await user.click(screen.getByRole('button', { name: /save/i }));

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(
                `/api/vehicles/1`,
                expect.objectContaining({
                    method: 'PUT',
                    body: JSON.stringify({
                        make: 'Toyota',
                        model: 'Camry',
                        category: 'Sedan',
                        price: 27000,
                        quantity: 10,
                    }),
                })
            );
        });

        await waitFor(() => {
            expect(screen.getByText('$27,000')).toBeInTheDocument();
        });
    });

    it('allows the admin to delete a vehicle', async () => {
        const user = userEvent.setup();

        vi.spyOn(globalThis, 'fetch')
            .mockResolvedValueOnce({
                ok: true,
                json: async () => mockVehicles,
            } as Response)
            .mockResolvedValueOnce({
                ok: true,
                status: 204,
            } as Response)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => [mockVehicles[1]],
            } as Response);

        render(<Admin />);

        await waitFor(() => {
            expect(screen.getByText('Toyota')).toBeInTheDocument();
        });

        const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
        await user.click(deleteButtons[0]);

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(
                '/api/vehicles/1',
                expect.objectContaining({
                    method: 'DELETE',
                })
            );
        });

        await waitFor(() => {
            expect(screen.queryByText('Toyota')).not.toBeInTheDocument();
            expect(screen.getByText('Ford')).toBeInTheDocument();
        });
    });

    it('allows the admin to restock a vehicle', async () => {
        const user = userEvent.setup();
        const restockedVehicle = {
            ...mockVehicles[0],
            quantity: 20,
        };

        vi.spyOn(globalThis, 'fetch')
            .mockResolvedValueOnce({
                ok: true,
                json: async () => mockVehicles,
            } as Response)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => restockedVehicle,
            } as Response)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => [restockedVehicle, mockVehicles[1]],
            } as Response);

        render(<Admin />);

        await waitFor(() => {
            expect(screen.getByText('Toyota')).toBeInTheDocument();
        });

        const restockInputs = screen.getAllByPlaceholderText(/restock amount/i);
        const restockButtons = screen.getAllByRole('button', { name: /restock/i });

        await user.type(restockInputs[0], '10');
        await user.click(restockButtons[0]);

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(
                '/api/vehicles/1/restock',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ quantity: 10 }),
                })
            );
        });
    });

    it('filters vehicles when using the search functionality', async () => {
        const user = userEvent.setup();

        vi.spyOn(globalThis, 'fetch')
            .mockResolvedValueOnce({
                ok: true,
                json: async () => mockVehicles,
            } as Response)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => [mockVehicles[0]],
            } as Response);

        render(<Admin />);

        await waitFor(() => {
            expect(screen.getByText('Toyota')).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText(/search make/i);
        await user.type(searchInput, 'Toyota');
        await user.click(screen.getByRole('button', { name: /search/i }));

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/vehicles/search?make=Toyota'),
                expect.any(Object)
            );
            expect(screen.getByText('Toyota')).toBeInTheDocument();
            expect(screen.queryByText('Ford')).not.toBeInTheDocument();
        });
    });

    it('displays an error message when fetching vehicles fails', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
            ok: false,
            status: 500,
        } as Response);

        render(<Admin />);

        await waitFor(() => {
            expect(screen.getByText(/failed to load vehicles/i)).toBeInTheDocument();
        });
    });
});