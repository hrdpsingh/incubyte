import { useCallback } from "react";
import type { Screen, Vehicle } from "../types";
import { API, extractError } from "../utilities";
import VehicleSearch from "../Components/Search";
import VehicleCard from "../Components/Card";
import DashboardLayout from "../Components/DashboardLayout";
import ErrorAlert from "../Components/ErrorAlert";
import { useVehicles } from "../useVehicles";

interface DashboardProps {
    token: string;
    isAdmin: boolean;
    logout: () => void;
    navigate: (screen: Screen) => void;
}

export default function Dashboard({
    token,
    isAdmin,
    logout,
    navigate,
}: DashboardProps) {
    // Memoize header creation to prevent unnecessary custom hook re-runs on parent renders
    const authHeaders = useCallback(
        () => ({ Authorization: `Bearer ${token}` }),
        [token]
    );

    // Primary state machine and data fetcher managed by custom hook
    const { vehicles, error, setError, handleSearch, refetch } = useVehicles(
        authHeaders,
        logout
    );

    const handlePurchase = async (id: number) => {
        setError("");
        try {
            const response = await fetch(`${API}/api/vehicles/${id}/purchase`, {
                method: "POST",
                headers: authHeaders(),
            });

            if (response.status === 401) {
                logout();
                return;
            }

            if (!response.ok) {
                // Fall back to localized fallback text if backend error extraction yields empty result
                throw new Error(
                    await extractError(response, "Vehicle is unavailable")
                );
            }

            // Sync UI state with inventory server after mutating record
            await refetch();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        }
    };

    return (
        <DashboardLayout>
            <Header
                isAdmin={isAdmin}
                onLogout={logout}
                onNavigateAdmin={() => navigate("admin")}
            />

            <VehicleSearch onSearch={handleSearch} />

            {/* Render priority: Error state > Empty state > Data grid */}
            {error ? (
                <ErrorAlert message={error} />
            ) : vehicles.length === 0 ? (
                <EmptyState />
            ) : (
                <VehicleGrid vehicles={vehicles} onPurchase={handlePurchase} />
            )}
        </DashboardLayout>
    );
}

// Global action banner and role-based privilege navigation
function Header({ isAdmin, onLogout, onNavigateAdmin }: { isAdmin: boolean; onLogout: () => void; onNavigateAdmin: () => void }) {
    return (
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    Vehicle Inventory
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    Browse and purchase available vehicles.
                </p>
            </div>
            <div className="flex gap-3">
                {/* Gate administrative views to privileged users */}
                {isAdmin && (
                    <button
                        onClick={onNavigateAdmin}
                        className="flex-1 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-700 sm:flex-none sm:px-5"
                    >
                        Admin Panel
                    </button>
                )}
                <button
                    onClick={onLogout}
                    className="flex-1 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 transition-colors hover:bg-slate-50 sm:flex-none sm:px-5"
                >
                    Logout
                </button>
            </div>
        </div>
    );
}

// Displayed when queries yield zero records or stock is depleted
function EmptyState() {
    return (
        <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 px-4 py-16 text-center sm:mt-12">
            <svg className="mb-4 h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="text-lg font-medium text-slate-900">No vehicles available</h3>
            <p className="mt-1 text-slate-500">Try adjusting your search criteria.</p>
        </div>
    );
}

// Responsive grid wrapper scaling from 1 to 4 columns based on view width
function VehicleGrid({ vehicles, onPurchase }: { vehicles: Vehicle[]; onPurchase: (id: number) => void }) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {vehicles.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} onPurchase={onPurchase} />
            ))}
        </div>
    );
}