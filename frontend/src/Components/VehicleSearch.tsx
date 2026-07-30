import { useState } from "react";
import type { SearchParams } from "../types";

interface VehicleSearchProps {
    onSearch: (params: SearchParams) => void;
}

export default function VehicleSearch({ onSearch }: VehicleSearchProps) {
    const [make, setMake] = useState("");
    const [model, setModel] = useState("");
    const [category, setCategory] = useState("");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        onSearch({ make, model, category, minPrice, maxPrice });
    };

    const inputClasses = "w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-400";

    return (
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">Search Filters</h2>
            <form onSubmit={handleSearch} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6 items-end">
                <div className="lg:col-span-1">
                    <label className="mb-1 block text-xs font-medium text-slate-700">Make</label>
                    <input type="text" placeholder="e.g. Toyota" value={make} onChange={(e) => setMake(e.target.value)} className={inputClasses} />
                </div>
                <div className="lg:col-span-1">
                    <label className="mb-1 block text-xs font-medium text-slate-700">Model</label>
                    <input type="text" placeholder="e.g. Camry" value={model} onChange={(e) => setModel(e.target.value)} className={inputClasses} />
                </div>
                <div className="lg:col-span-1">
                    <label className="mb-1 block text-xs font-medium text-slate-700">Category</label>
                    <input type="text" placeholder="e.g. Sedan" value={category} onChange={(e) => setCategory(e.target.value)} className={inputClasses} />
                </div>
                <div className="lg:col-span-1">
                    <label className="mb-1 block text-xs font-medium text-slate-700">Min Price ($)</label>
                    <input type="number" placeholder="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className={inputClasses} />
                </div>
                <div className="lg:col-span-1">
                    <label className="mb-1 block text-xs font-medium text-slate-700">Max Price ($)</label>
                    <input type="number" placeholder="No limit" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className={inputClasses} />
                </div>
                <div className="lg:col-span-1 mt-2 lg:mt-0">
                    <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-700 active:scale-[0.98]">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Search
                    </button>
                </div>
            </form>
        </div>
    );
}