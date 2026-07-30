import React, { useCallback, useEffect, useState } from 'react';
import type { Screen } from '../App';

export interface Vehicle {
    id?: number;
    make: string;
    model: string;
    category: string;
    price: number;
    quantity: number;
}

interface AdminProps {
    token: string;
    navigate: (screen: Screen) => void;
}

const emptyForm: Vehicle = {
    make: '',
    model: '',
    category: '',
    price: 0,
    quantity: 0,
};

const API = import.meta.env.VITE_API_URL || "";

const Admin: React.FC<AdminProps> = ({ token, navigate }) => {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<Vehicle>(emptyForm);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [restockAmounts, setRestockAmounts] = useState<{ [key: number]: string }>({});

    const [searchMake, setSearchMake] = useState<string>('');
    const [searchModel, setSearchModel] = useState<string>('');
    const [searchCategory, setSearchCategory] = useState<string>('');
    const [searchMinPrice, setSearchMinPrice] = useState<string>('');
    const [searchMaxPrice, setSearchMaxPrice] = useState<string>('');

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    const fetchVehicles = useCallback(async (url = `${API}/api/vehicles`) => {
        try {
            setError(null);
            const res = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!res.ok) throw new Error('Failed to load vehicles');
            const data = await res.json();
            setVehicles(data);
        } catch {
            setError('Failed to load vehicles');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchVehicles();
    }, [fetchVehicles]);

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
            const res = await fetch(editingId !== null ? `${API}/api/vehicles/${editingId}` : `${API}/api/vehicles`, {
                method: editingId !== null ? 'PUT' : 'POST',
                headers,
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error(await extractError(res));

            setFormData(emptyForm);
            setEditingId(null);
            await fetchVehicles();
        } catch (err: any) {
            setError(err.message || 'Operation failed');
        }
    };

    const handleDelete = async (id: number) => {
        try {
            const res = await fetch(`${API}/api/vehicles/${id}`, { method: 'DELETE', headers });
            if (!res.ok) throw new Error(await extractError(res));
            await fetchVehicles();
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
            await fetchVehicles();
        } catch (err: any) {
            setError(err.message || 'Failed to restock vehicle');
        }
    };

    const extractError = async (res: Response) => {
        try { const data = await res.json(); return data.detail; } catch { return 'Action failed. (Are you an admin?)'; }
    }

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (searchMake) params.append("make", searchMake);
        if (searchModel) params.append("model", searchModel);
        if (searchCategory) params.append("category", searchCategory);
        if (searchMinPrice) params.append("min_price", searchMinPrice);
        if (searchMaxPrice) params.append("max_price", searchMaxPrice);

        const url = params.toString() ? `${API}/api/vehicles/search?${params.toString()}` : `${API}/api/vehicles`;
        await fetchVehicles(url);
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

            <div className="mb-6">
                <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
                    <input type="text" placeholder="Search Make" value={searchMake} onChange={(e) => setSearchMake(e.target.value)} className="rounded border px-3 py-2" />
                    <input type="text" placeholder="Search Model" value={searchModel} onChange={(e) => setSearchModel(e.target.value)} className="rounded border px-3 py-2" />
                    <input type="text" placeholder="Search Category" value={searchCategory} onChange={(e) => setSearchCategory(e.target.value)} className="rounded border px-3 py-2" />
                    <input type="number" placeholder="Min Price" value={searchMinPrice} onChange={(e) => setSearchMinPrice(e.target.value)} className="w-32 rounded border px-3 py-2" />
                    <input type="number" placeholder="Max Price" value={searchMaxPrice} onChange={(e) => setSearchMaxPrice(e.target.value)} className="w-32 rounded border px-3 py-2" />
                    <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white">Search</button>
                </form>
            </div>

            <div className="grid gap-4">
                {vehicles.map((v) => (
                    <div key={v.id} className="flex flex-col md:flex-row justify-between items-center rounded-lg border bg-white p-4 shadow">
                        <div>
                            <span className="font-bold">{v.make} {v.model}</span> | {v.category} | ${v.price} | Stock: {v.quantity}
                        </div>
                        <div className="mt-4 flex gap-2 md:mt-0">
                            <button onClick={() => { setEditingId(v.id!); setFormData(v); }} className="rounded bg-yellow-500 px-3 py-1 text-white">Edit</button>
                            <button onClick={() => handleDelete(v.id!)} className="rounded bg-red-500 px-3 py-1 text-white">Delete</button>
                            <input type="number" placeholder="Qty" value={restockAmounts[v.id!] || ''} onChange={(e) => setRestockAmounts(prev => ({ ...prev, [v.id!]: e.target.value }))} className="w-20 rounded border p-1" />
                            <button onClick={() => handleRestockSubmit(v.id!)} className="rounded bg-indigo-600 px-3 py-1 text-white">Restock</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Admin;