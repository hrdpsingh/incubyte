import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { Screen, Vehicle, VehicleFormData, SearchParams } from '../types';
import { API, buildVehicleSearchUrl, extractError } from '../utilities';
import VehicleSearch from '../Components/VehicleSearch';

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

    // 2. Change the dependency array to [headers]
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

    if (loading) return <div className="p-8 text-center text-xl">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="mb-8 flex items-center justify-between">
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <button onClick={() => navigate('dashboard')} className="rounded bg-gray-600 px-4 py-2 text-white">
                    Back to Inventory
                </button>
            </div>

            {error && <div className="mb-4 rounded bg-red-100 p-4 text-red-700">{error}</div>}

            <div className="mb-8 rounded-xl bg-white p-6 shadow">
                <h2 className="mb-4 text-xl font-bold">{editingId ? 'Edit Vehicle' : 'Add Vehicle'}</h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 md:grid-cols-6">
                    <input name="make" placeholder="Make" value={formData.make} onChange={handleInputChange} required className="rounded border p-2" />
                    <input name="model" placeholder="Model" value={formData.model} onChange={handleInputChange} required className="rounded border p-2" />
                    <input name="category" placeholder="Category" value={formData.category} onChange={handleInputChange} required className="rounded border p-2" />
                    <input name="price" type="number" placeholder="Price" value={formData.price || ''} onChange={handleInputChange} required className="rounded border p-2" />
                    <input name="quantity" type="number" placeholder="Quantity" value={formData.quantity || ''} onChange={handleInputChange} required className="rounded border p-2" />
                    <button type="submit" className="rounded bg-green-600 p-2 text-white hover:bg-green-700">{editingId ? 'Save' : 'Add'}</button>
                </form>
            </div>

            <VehicleSearch onSearch={handleSearch} />

            <div className="grid gap-4">
                {vehicles.map((v) => (
                    <div key={v.id} className="flex flex-col md:flex-row justify-between items-center rounded-lg border bg-white p-4 shadow">
                        <div>
                            <span className="font-bold">{v.make} {v.model}</span> | {v.category} | ${v.price} | Stock: {v.quantity}
                        </div>
                        <div className="mt-4 flex gap-2 md:mt-0">
                            <button onClick={() => { setEditingId(v.id); const { id: _, ...rest } = v; setFormData(rest); }} className="rounded bg-yellow-500 px-3 py-1 text-white">Edit</button>
                            <button onClick={() => handleDelete(v.id)} className="rounded bg-red-500 px-3 py-1 text-white">Delete</button>
                            <input type="number" placeholder="Qty" value={restockAmounts[v.id] || ''} onChange={(e) => setRestockAmounts(prev => ({ ...prev, [v.id]: e.target.value }))} className="w-20 rounded border p-1" />
                            <button onClick={() => handleRestockSubmit(v.id)} className="rounded bg-indigo-600 px-3 py-1 text-white">Restock</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Admin;