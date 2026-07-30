import { useCallback, useEffect, useState } from "react";
import type { Screen } from "../App";

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
    isAdmin: boolean;
    logout: () => void;
    navigate: (screen: Screen) => void;
}

const API = import.meta.env.VITE_API_URL;

function VehicleCard({
    vehicle,
    onPurchase,
}: {
    vehicle: Vehicle;
    onPurchase: (id: number) => void;
}) {
    return (
        <div className="rounded-lg border bg-white p-4 shadow">
            <h2 className="text-xl font-bold">
                {vehicle.make} {vehicle.model}
            </h2>

            <p>Category: {vehicle.category}</p>

            <p className="font-semibold text-green-600">
                ${vehicle.price}
            </p>

            <p>Stock: {vehicle.quantity}</p>

            <button
                disabled={vehicle.quantity === 0}
                onClick={() => onPurchase(vehicle.id)}
                className="mt-4 w-full rounded bg-blue-600 p-2 text-white disabled:bg-gray-400"
            >
                {vehicle.quantity === 0
                    ? "Out of Stock"
                    : "Purchase"}
            </button>
        </div>
    );
}

export default function Dashboard({
    token,
    isAdmin,
    logout,
    navigate,
}: DashboardProps) {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [make, setMake] = useState("");
    const [model, setModel] = useState("");
    const [category, setCategory] = useState("");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [error, setError] = useState("");

    const loadVehicles = useCallback(
        async (searchParams?: {
            make?: string;
            model?: string;
            category?: string;
            minPrice?: string;
            maxPrice?: string;
        }) => {
            setError("");

            const headers = {
                Authorization: `Bearer ${token}`,
            };

            let url = `${API}/api/vehicles`;

            if (searchParams) {
                const params = new URLSearchParams();
                if (searchParams.make) params.append("make", searchParams.make);
                if (searchParams.model) params.append("model", searchParams.model);
                if (searchParams.category) params.append("category", searchParams.category);
                if (searchParams.minPrice) params.append("min_price", searchParams.minPrice);
                if (searchParams.maxPrice) params.append("max_price", searchParams.maxPrice);

                if (params.toString()) {
                    url = `${API}/api/vehicles/search?${params.toString()}`;
                }
            }

            try {
                const response = await fetch(url, { headers });

                if (!response.ok) {
                    throw new Error("Failed to load vehicles");
                }

                setVehicles(await response.json());
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Something went wrong",
                );
            }
        },
        [token],
    );

    useEffect(() => {
        loadVehicles();
    }, [loadVehicles]);

    const purchaseVehicle = async (id: number) => {
        setError("");

        const headers = {
            Authorization: `Bearer ${token}`,
        };

        try {
            const response = await fetch(
                `${API}/api/vehicles/${id}/purchase`,
                {
                    method: "POST",
                    headers,
                },
            );

            if (!response.ok) {
                const data = await response.json();
                throw new Error(
                    data.detail ?? "Vehicle is unavailable",
                );
            }

            await loadVehicles({ make, model, category, minPrice, maxPrice });
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong",
            );
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="mb-8 flex justify-between items-center">
                <h1 className="text-3xl font-bold">
                    Inventory
                </h1>

                <div className="flex gap-2">
                    {isAdmin && (
                        <button
                            onClick={() => navigate("admin")}
                            className="rounded bg-gray-800 px-4 py-2 text-white"
                        >
                            Admin Panel
                        </button>
                    )}

                    <button
                        onClick={logout}
                        className="rounded bg-red-500 px-4 py-2 text-white"
                    >
                        Logout
                    </button>
                </div>
            </div>

            <div className="mb-6 flex flex-wrap gap-2">
                <input
                    type="text"
                    placeholder="Make"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    className="rounded border px-3 py-2"
                />
                <input
                    type="text"
                    placeholder="Model"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="rounded border px-3 py-2"
                />
                <input
                    type="text"
                    placeholder="Category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="rounded border px-3 py-2"
                />
                <input
                    type="number"
                    placeholder="Min Price"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-32 rounded border px-3 py-2"
                />
                <input
                    type="number"
                    placeholder="Max Price"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-32 rounded border px-3 py-2"
                />

                <button
                    onClick={() => loadVehicles({ make, model, category, minPrice, maxPrice })}
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
                        <VehicleCard
                            key={vehicle.id}
                            vehicle={vehicle}
                            onPurchase={purchaseVehicle}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}