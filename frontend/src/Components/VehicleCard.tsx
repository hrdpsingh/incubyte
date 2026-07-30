import type { Vehicle } from "../types";

export default function VehicleCard({ vehicle, onPurchase }: { vehicle: Vehicle; onPurchase: (id: number) => void; }) {
    return (
        <div className="rounded-lg border bg-white p-4 shadow">
            <h2 className="text-xl font-bold">{vehicle.make} {vehicle.model}</h2>
            <p>Category: {vehicle.category}</p>
            <p className="font-semibold text-green-600">${vehicle.price}</p>
            <p>Stock: {vehicle.quantity}</p>
            <button
                disabled={vehicle.quantity === 0}
                onClick={() => onPurchase(vehicle.id)}
                className="mt-4 w-full rounded bg-blue-600 p-2 text-white disabled:bg-gray-400"
            >
                {vehicle.quantity === 0 ? "Out of Stock" : "Purchase"}
            </button>
        </div>
    );
}