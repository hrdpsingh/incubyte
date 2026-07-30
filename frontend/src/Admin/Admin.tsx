import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { Screen, Vehicle, VehicleFormData, SearchParams } from '../types';
import { API, buildVehicleSearchUrl, extractError } from '../utilities';
import VehicleSearch from '../Components/Search';

interface AdminProps {
    token: string;
    navigate: (screen: Screen) => void;
}

const emptyForm: VehicleFormData = { make: '', model: '', category: '', price: 0, quantity: 0 };

const Admin: React.FC<AdminProps> = ({ token, navigate }) => {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<VehicleFormData>(emptyForm);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [restockAmounts, setRestockAmounts] = useState<{ [key: number]: string }>({});
    const [currentParams, setCurrentParams] = useState<SearchParams>({});

    const headers = useMemo(() => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    }), [token]);

    const fetchVehicles = useCallback(async (params?: SearchParams) => {
        try {
            setError(null);
            const res = await fetch(buildVehicleSearchUrl(params), { headers });
            if (!res.ok) throw new Error('Failed to load vehicles');
            setVehicles(await res.json());
        } catch {
            setError('Failed to load vehicles');
        } finally {
            setLoading(false);
        }
    }, [headers]);

    useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

    const handleSearch = async (params: SearchParams) => {
        setCurrentParams(params);
        await fetchVehicles(params);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { ...formData, price: Number(formData.price), quantity: Number(formData.quantity) };

        try {
            const res = await fetch(editingId ? `${API}/api/vehicles/${editingId}` : `${API}/api/vehicles`, {
                method: editingId ? 'PUT' : 'POST',
                headers,
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error(await extractError(res, 'Action failed. (Are you an admin?)'));

            setFormData(emptyForm);
            setEditingId(null);
            await fetchVehicles(currentParams);
        } catch (err: any) {
            setError(err.message || 'Operation failed');
        }
    };

    const handleDelete = async (id: number) => {
        try {
            const res = await fetch(`${API}/api/vehicles/${id}`, { method: 'DELETE', headers });
            if (!res.ok) throw new Error(await extractError(res));
            await fetchVehicles(currentParams);
        } catch (err: any) {
            setError(err.message || 'Failed to delete vehicle');
        }
    };

    const handleRestockSubmit = async (id: number) => {
        const amount = Number(restockAmounts[id]);
        if (isNaN(amount) || amount <= 0) return;

        try {
            const res = await fetch(`${API}/api/vehicles/${id}/restock`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ quantity: amount }),
            });
            if (!res.ok) throw new Error(await extractError(res));

            setRestockAmounts((prev) => ({ ...prev, [id]: '' }));
            await fetchVehicles(currentParams);
        } catch (err: any) {
            setError(err.message || 'Failed to restock vehicle');
        }
    };

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-center">
            <div className="text-lg font-medium text-slate-500 animate-pulse">Loading dashboard...</div>
        </div>
    );

    const inputClasses = "w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20";

    return (
        <div className="min-h-screen bg-slate-50 p-3 sm:p-4 md:p-8">
            <div className="mx-auto max-w-6xl">
                <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Admin Dashboard</h1>
                        <p className="mt-1 text-sm text-slate-500">Manage your vehicle inventory and stock.</p>
                    </div>
                    <button
                        onClick={() => navigate('dashboard')}
                        className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition-colors"
                    >
                        &larr; Back to Inventory
                    </button>
                </div>

                {error && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800 shadow-sm">
                        {error}
                    </div>
                )}

                <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                    <h2 className="mb-5 text-lg font-semibold text-slate-800">
                        {editingId ? 'Edit Vehicle Details' : 'Register New Vehicle'}
                    </h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
                        <div className="sm:col-span-1 lg:col-span-1">
                            <input name="make" placeholder="Make" value={formData.make} onChange={handleInputChange} required className={inputClasses} />
                        </div>
                        <div className="sm:col-span-1 lg:col-span-1">
                            <input name="model" placeholder="Model" value={formData.model} onChange={handleInputChange} required className={inputClasses} />
                        </div>
                        <div className="sm:col-span-1 lg:col-span-1">
                            <input name="category" placeholder="Category" value={formData.category} onChange={handleInputChange} required className={inputClasses} />
                        </div>
                        <div className="sm:col-span-1 lg:col-span-1">
                            <input name="price" type="number" placeholder="Price" value={formData.price || ''} onChange={handleInputChange} required className={inputClasses} />
                        </div>
                        <div className="sm:col-span-1 lg:col-span-1">
                            <input name="quantity" type="number" placeholder="Quantity" value={formData.quantity || ''} onChange={handleInputChange} required className={inputClasses} />
                        </div>
                        <div className="sm:col-span-2 lg:col-span-1">
                            <button type="submit" className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-700 active:scale-[0.98]">
                                {editingId ? 'Save Changes' : 'Add Vehicle'}
                            </button>
                        </div>
                    </form>
                </div>

                <VehicleSearch onSearch={handleSearch} />

                <div className="flex flex-col gap-4">
                    {vehicles.length === 0 && !loading && (
                        <div className="rounded-xl border border-dashed border-slate-300 py-12 text-center text-slate-500">
                            No vehicles found matching your criteria.
                        </div>
                    )}
                    {vehicles.map((v) => (
                        <div key={v.id} className="group flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md sm:p-5 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex min-w-0 flex-col">
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                    <h3 className="truncate text-lg font-bold text-slate-900">{v.make} {v.model}</h3>
                                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">{v.category}</span>
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                                    <span className="font-semibold text-slate-700">${v.price.toLocaleString()}</span>
                                    <span className="hidden sm:inline">•</span>
                                    <span className={v.quantity === 0 ? "text-red-500 font-medium" : ""}>Stock: {v.quantity}</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center">
                                    <input
                                        type="number"
                                        placeholder="Qty"
                                        value={restockAmounts[v.id] || ''}
                                        onChange={(e) => setRestockAmounts(prev => ({ ...prev, [v.id]: e.target.value }))}
                                        className="h-9 w-20 rounded-l-lg border border-slate-300 bg-slate-50 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                    />
                                    <button
                                        onClick={() => handleRestockSubmit(v.id)}
                                        className="h-9 shrink-0 rounded-r-lg border border-transparent bg-indigo-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                                    >
                                        Restock
                                    </button>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { setEditingId(v.id); const { id: _, ...rest } = v; setFormData(rest); }}
                                        className="h-9 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(v.id)}
                                        className="h-9 rounded-lg bg-red-50 px-4 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Admin;