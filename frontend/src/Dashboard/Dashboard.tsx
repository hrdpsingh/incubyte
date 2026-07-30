import { useCallback, useEffect, useState } from "react";
import type { Screen, Vehicle, SearchParams } from "../types";
import { API, buildVehicleSearchUrl, extractError } from "../utilities";
import VehicleSearch from "../Components/Search";
import VehicleCard from "../Components/Card";

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
        <div className="min-h-screen bg-slate-50 p-3 sm:p-4 md:p-8">
            <div className="mx-auto max-w-6xl">
                <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Vehicle Inventory</h1>
                        <p className="mt-1 text-sm text-slate-500">Browse and purchase available vehicles.</p>
                    </div>
                    <div className="flex gap-3">
                        {isAdmin && (
                            <button
                                onClick={() => navigate("admin")}
                                className="flex-1 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-700 sm:flex-none sm:px-5"
                            >
                                Admin Panel
                            </button>
                        )}
                        <button
                            onClick={logout}
                            className="flex-1 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 transition-colors hover:bg-slate-50 sm:flex-none sm:px-5"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                <VehicleSearch onSearch={handleSearch} />

                {error && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800 shadow-sm">
                        {error}
                    </div>
                )}

                {!error && vehicles.length === 0 ? (
                    <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 px-4 py-16 text-center sm:mt-12">
                        <svg className="mb-4 h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <h3 className="text-lg font-medium text-slate-900">No vehicles available</h3>
                        <p className="mt-1 text-slate-500">Try adjusting your search criteria.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                        {vehicles.map((vehicle) => (
                            <VehicleCard key={vehicle.id} vehicle={vehicle} onPurchase={purchaseVehicle} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}