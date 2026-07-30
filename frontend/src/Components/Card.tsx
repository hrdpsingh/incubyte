import type { Vehicle } from "../types";

export default function VehicleCard({ vehicle, onPurchase }: { vehicle: Vehicle; onPurchase: (id: number) => void; }) {
    const isOutOfStock = vehicle.quantity === 0;

    return (
        <div className="group flex h-full flex-col justify-between overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition-all hover:-translate-y-1 hover:shadow-lg hover:ring-blue-500/30">
            <div className="p-4 sm:p-5">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
                        {vehicle.category}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${isOutOfStock ? "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10" : "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
                        }`}>
                        {isOutOfStock ? "Out of Stock" : `${vehicle.quantity} Available`}
                    </span>
                </div>

                <h2 className="truncate text-lg font-bold text-slate-900 transition-colors group-hover:text-blue-600 sm:text-xl">
                    {vehicle.make} {vehicle.model}
                </h2>

                <div className="mt-4 flex items-baseline">
                    <span className="text-2xl font-black text-slate-900">
                        ${vehicle.price.toLocaleString()}
                    </span>
                </div>
            </div>

            <div className="p-4 pt-0 sm:p-5 sm:pt-0">
                <button
                    disabled={isOutOfStock}
                    onClick={() => onPurchase(vehicle.id)}
                    className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none disabled:active:scale-100"
                >
                    {isOutOfStock ? "Currently Unavailable" : "Purchase Vehicle"}
                </button>
            </div>
        </div>
    );
}