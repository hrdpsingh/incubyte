import { useCallback, useEffect, useState } from "react";

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
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [make, setMake] = useState("");
    const [error, setError] = useState("");

    const fetchVehicles = useCallback(async () => {
        setError("");

        const response = await fetch(`${API}/api/vehicles`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            setError("Failed to load vehicles");
            return;
        }

        setVehicles(await response.json());
    }, [token]);

    useEffect(() => {
        fetchVehicles();
    }, [fetchVehicles]);

    async function search() {
        setError("");

        const response = await fetch(
            `${API}/api/vehicles/search?make=${encodeURIComponent(make)}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        );

        if (!response.ok) {
            setError("Failed to load vehicles");
            return;
        }

        setVehicles(await response.json());
    }

    async function purchase(id: number) {
        setError("");

        const response = await fetch(
            `${API}/api/vehicles/${id}/purchase`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        );

        if (!response.ok) {
            const data = await response.json();
            setError(data.detail ?? "Vehicle is unavailable");
            return;
        }

        await response.json();
        await fetchVehicles();
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

            <div className="mb-6 flex gap-2">
                <input
                    type="text"
                    placeholder="Make"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    className="rounded border px-3 py-2"
                />

                <button
                    onClick={search}
                    className="rounded bg-blue-600 px-4 py-2 text-white"
                >
                    Search
                </button>
            </div>

            {error && (
                <p className="mb-4 text-red-600">
                    {error}
                </p>
            )}

            {!error && vehicles.length === 0 ? (
                <p>No vehicles available</p>
            ) : (
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
                                disabled={vehicle.quantity === 0}
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
            )}
        </div>
    );
}