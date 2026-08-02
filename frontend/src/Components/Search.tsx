import { useState } from "react";
import type { SearchParams } from "../types";

interface VehicleSearchProps {
    onSearch: (params: SearchParams) => void;
}

// Global price range boundaries for normalized scaling calculations
const ABSOLUTE_MIN = 0;
const ABSOLUTE_MAX = 200000;
const STEP = 1000;

export default function VehicleSearch({ onSearch }: VehicleSearchProps) {
    const [query, setQuery] = useState("");

    // Raw slider values kept order-agnostic to prevent crossover locking
    const [val1, setVal1] = useState(ABSOLUTE_MIN);
    const [val2, setVal2] = useState(ABSOLUTE_MAX);

    // Derived bounds ensure correct min/max values regardless of handle positions
    const minPrice = Math.min(val1, val2);
    const maxPrice = Math.max(val1, val2);

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        onSearch({
            query,
            // Convert boundary values to empty strings to avoid unnecessary API query params
            minPrice: minPrice > ABSOLUTE_MIN ? String(minPrice) : "",
            maxPrice: maxPrice < ABSOLUTE_MAX ? String(maxPrice) : "",
        });
    };

    const formatPrice = (value: number) =>
        value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

    // Percentage translations used for dual-thumb slider track positioning
    const minPct = ((minPrice - ABSOLUTE_MIN) / (ABSOLUTE_MAX - ABSOLUTE_MIN)) * 100;
    const maxPct = ((maxPrice - ABSOLUTE_MIN) / (ABSOLUTE_MAX - ABSOLUTE_MIN)) * 100;

    // Shared input styling across form controls
    const inputClasses =
        "w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-400";

    return (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:mb-8 sm:p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">Search Filters</h2>
            <form onSubmit={handleSearch} className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-end">
                <div className="lg:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-slate-700">Search</label>
                    <div className="relative">
                        {/* Decorative search icon absolute-positioned over padded text input */}
                        <svg
                            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search make, model, or category (e.g. Toyota Camry Sedan)"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className={`${inputClasses} pl-10`}
                        />
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="mb-2 flex items-center justify-between gap-2">
                        <label className="text-xs font-medium text-slate-700">Price Range</label>
                        <span className="text-xs font-medium text-slate-500">
                            {/* Appends '+' to indicate open-ended upper boundary */}
                            {formatPrice(minPrice)} – {maxPrice >= ABSOLUTE_MAX ? `${formatPrice(ABSOLUTE_MAX)}+` : formatPrice(maxPrice)}
                        </span>
                    </div>

                    <div className="relative flex h-7 w-full items-center">
                        {/* Inactive track background */}
                        <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-slate-200" />

                        {/* Highlighted active region dynamically scaled with thumb offset corrections */}
                        <div
                            className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-blue-500"
                            style={{
                                left: `calc(${minPct}% + ${10 - minPct * 0.2}px)`,
                                width: `calc(${maxPct - minPct}% - ${(maxPct - minPct) * 0.2}px)`
                            }}
                        />
                        {/* Overlaid native range inputs with pointer-events deferred to thumbs via CSS */}
                        <input
                            type="range"
                            min={ABSOLUTE_MIN}
                            max={ABSOLUTE_MAX}
                            step={STEP}
                            value={val1}
                            onChange={(e) => setVal1(Number(e.target.value))}
                            className="range-thumb pointer-events-none absolute left-0 w-full appearance-none bg-transparent"
                            style={{
                                zIndex: 3,
                                height: "20px",
                                top: "50%",
                                transform: "translateY(-50%)",
                            }}
                        />
                        <input
                            type="range"
                            min={ABSOLUTE_MIN}
                            max={ABSOLUTE_MAX}
                            step={STEP}
                            value={val2}
                            onChange={(e) => setVal2(Number(e.target.value))}
                            className="range-thumb pointer-events-none absolute left-0 w-full appearance-none bg-transparent"
                            style={{
                                zIndex: 4,
                                height: "20px",
                                top: "50%",
                                transform: "translateY(-50%)",
                            }}
                        />
                    </div>
                </div>

                <div className="lg:col-span-3 flex justify-stretch sm:justify-end">
                    <button
                        type="submit"
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-700 active:scale-[0.98] sm:w-auto"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                        Search
                    </button>
                </div>
            </form>

            {/* Custom pseudo-element resets to enable dual-range thumb interactivity over transparent tracks */}
            <style>{`
                .range-thumb {
                    height: 20px;
                }
                .range-thumb::-webkit-slider-runnable-track {
                    -webkit-appearance: none;
                    height: 100%;
                    background: transparent;
                }
                .range-thumb::-webkit-slider-thumb {
                    appearance: none;
                    pointer-events: auto;
                    width: 20px;
                    height: 20px;
                    border-radius: 9999px;
                    background: white;
                    border: 2px solid #3b82f6;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                    cursor: pointer;
                }
                .range-thumb::-moz-range-track {
                    height: 100%;
                    background: transparent;
                }
                .range-thumb::-moz-range-thumb {
                    pointer-events: auto;
                    width: 20px;
                    height: 20px;
                    border-radius: 9999px;
                    background: white;
                    border: 2px solid #3b82f6;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                    cursor: pointer;
                }
            `}</style>
        </div>
    );
}