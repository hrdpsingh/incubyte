import { useCallback, useEffect, useState } from "react";
import type { Screen, Vehicle, SearchParams } from "../types";
import { API, buildVehicleSearchUrl, extractError } from "../utilities";
import VehicleSearch from "../Components/VehicleSearch";
import VehicleCard from "../Components/VehicleCard";

interface DashboardProps {
    token: string;
    isAdmin: boolean;
    logout: () => void;
    navigate: (screen: Screen) => void;
}

export default function Dashboard({ token, isAdmin, logout, navigate }: DashboardProps) {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [currentParams, setCurrentParams] = useState<SearchParams>({});
    const [error, setError] = useState("");

    const loadVehicles = useCallback(async (params?: SearchParams) => {
        setError("");
        try {
            const response = await fetch(buildVehicleSearchUrl(params), {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error("Failed to load vehicles");
            setVehicles(await response.json());
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        }
    }, [token]);

    useEffect(() => { loadVehicles(); }, [loadVehicles]);

    const handleSearch = (params: SearchParams) => {
        setCurrentParams(params);
        loadVehicles(params);
    };

    const purchaseVehicle = async (id: number) => {
        setError("");
        try {
            const response = await fetch(`${API}/api/vehicles/${id}/purchase`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error(await extractError(response, "Vehicle is unavailable"));
            await loadVehicles(currentParams);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="mb-8 flex justify-between items-center">
                <h1 className="text-3xl font-bold">Inventory</h1>
                <div className="flex gap-2">
                    {isAdmin && (
                        <button onClick={() => navigate("admin")} className="rounded bg-gray-800 px-4 py-2 text-white">
                            Admin Panel
                        </button>
                    )}
                    <button onClick={logout} className="rounded bg-red-500 px-4 py-2 text-white">
                        Logout
                    </button>
                </div>
            </div>

            <VehicleSearch onSearch={handleSearch} />

            {error && <p className="mb-4 text-red-600">{error}</p>}

            {!error && vehicles.length === 0 ? (
                <p>No vehicles available</p>
            ) : (
                <div className="grid gap-6 md:grid-cols-3">
                    {vehicles.map((vehicle) => (
                        <VehicleCard key={vehicle.id} vehicle={vehicle} onPurchase={purchaseVehicle} />
                    ))}
                </div>
            )}
        </div>
    );
}