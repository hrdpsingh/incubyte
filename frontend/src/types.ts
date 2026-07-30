export type Screen = "login" | "register" | "dashboard" | "admin";

export interface Vehicle {
    id: number;
    make: string;
    model: string;
    category: string;
    price: number;
    quantity: number;
}

export type VehicleFormData = Omit<Vehicle, "id">;

export interface SearchParams {
    make?: string;
    model?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
}