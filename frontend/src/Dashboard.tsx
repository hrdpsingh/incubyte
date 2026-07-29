import { useEffect, useState } from "react";

interface Vehicle {
    id: number;
    make: string;
    model: string;
    category: string;
    price: number;
    quantity: number;
}

interface DashboardProps {
    token: string;
    logout: () => void;
}

const API = import.meta.env.VITE_API_URL;

export default function Dashboard({
    token,
    logout,
}: DashboardProps) {
    const [vehicles, setVehicles] =
        useState<Vehicle[]>([]);

    async function fetchVehicles() {
        const response = await fetch(
            `${API}/api/vehicles`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        );

        if (response.ok) {
            setVehicles(await response.json());
        }
    }

    useEffect(() => {
        fetchVehicles();
    }, []);

    async function purchase(id: number) {
        const response = await fetch(
            `${API}/api/vehicles/${id}/purchase`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        );

        if (response.ok) {
            fetchVehicles();
        } else {
            alert("Vehicle is unavailable.");
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="mb-8 flex justify-between">
                <h1 className="text-3xl font-bold">
                    Inventory
                </h1>

                <button
                    onClick={logout}
                    className="rounded bg-red-500 px-4 py-2 text-white"
                >
                    Logout
                </button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {vehicles.map((vehicle) => (
                    <div
                        key={vehicle.id}
                        className="rounded-lg border bg-white p-4 shadow"
                    >
                        <h2 className="text-xl font-bold">
                            {vehicle.make} {vehicle.model}
                        </h2>

                        <p>
                            Category: {vehicle.category}
                        </p>

                        <p className="font-semibold text-green-600">
                            ${vehicle.price}
                        </p>

                        <p>
                            Stock: {vehicle.quantity}
                        </p>

                        <button
                            disabled={
                                vehicle.quantity === 0
                            }
                            onClick={() =>
                                purchase(vehicle.id)
                            }
                            className="mt-4 w-full rounded bg-blue-600 p-2 text-white disabled:bg-gray-400"
                        >
                            {vehicle.quantity === 0
                                ? "Out of Stock"
                                : "Purchase"}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}