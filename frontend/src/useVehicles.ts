import { useState, useCallback, useEffect } from "react";
import type { Vehicle, SearchParams } from "./types";
import { buildVehicleSearchUrl } from "./utilities";

// Custom hook to handle vehicle data fetching, state management, and refetching
export function useVehicles(headers: HeadersInit | (() => HeadersInit), logout?: () => void) {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [currentParams, setCurrentParams] = useState<SearchParams>({});
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    // Fetches vehicle data from the API based on provided search parameters
    const loadVehicles = useCallback(
        async (params?: SearchParams) => {
            setError(null);
            try {
                // Resolve headers whether passed directly as an object or via a getter function
                const computedHeaders = typeof headers === "function" ? headers() : headers;
                const response = await fetch(buildVehicleSearchUrl(params), {
                    headers: computedHeaders,
                });

                if (response.status === 401) {
                    logout?.();
                    return;
                }

                if (!response.ok) {
                    throw new Error("Failed to load vehicles");
                }

                const data = await response.json();
                setVehicles(data);
            } catch (error) {
                // Store normalized error message
                setError(error instanceof Error ? error.message : "Failed to load vehicles");
            } finally {
                setLoading(false);
            }
        },
        [headers]
    );

    // Automatically load vehicles on initial mount or when loadVehicles dependencies change
    useEffect(() => {
        loadVehicles();
    }, [loadVehicles]);

    // Triggers a search with new parameters and updates state
    const handleSearch = async (params: SearchParams) => {
        setCurrentParams(params);
        await loadVehicles(params);
    };

    // Re-runs the vehicle fetch request using the most recently stored search parameters
    const refetch = useCallback(() => {
        return loadVehicles(currentParams);
    }, [loadVehicles, currentParams]);

    // Expose state variables and handler functions for consumers of this hook
    return {
        vehicles,
        loading,
        error,
        setError,
        currentParams,
        handleSearch,
        refetch,
    };
}