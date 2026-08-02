// Represents the primary navigation views available across the application.
export type Screen = "login" | "register" | "dashboard" | "admin";

// Represents the core vehicle entity stored within the system inventory.
export interface Vehicle {
    id: number;
    make: string;
    model: string;
    category: string;
    price: number;
    quantity: number;
}

// Form payload for creating or updating a vehicle, excluding auto-generated fields like `id`.
export type VehicleFormData = Omit<Vehicle, "id">;

// Optional query parameters used for filtering and searching vehicles.
export interface SearchParams {
    query?: string;
    minPrice?: string;
    maxPrice?: string;
}