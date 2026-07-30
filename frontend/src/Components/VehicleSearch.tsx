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

    return (
        <form onSubmit={handleSearch} className="mb-6 flex flex-wrap gap-2">
            <input type="text" placeholder="Search Make" value={make} onChange={(e) => setMake(e.target.value)} className="rounded border px-3 py-2" />
            <input type="text" placeholder="Search Model" value={model} onChange={(e) => setModel(e.target.value)} className="rounded border px-3 py-2" />
            <input type="text" placeholder="Search Category" value={category} onChange={(e) => setCategory(e.target.value)} className="rounded border px-3 py-2" />
            <input type="number" placeholder="Min Price" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-32 rounded border px-3 py-2" />
            <input type="number" placeholder="Max Price" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-32 rounded border px-3 py-2" />
            <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white">Search</button>
        </form>
    );
}