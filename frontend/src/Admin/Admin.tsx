import React, { useMemo, useState } from 'react';
import type { Screen, Vehicle, VehicleFormData } from '../types';
import { API, extractError } from '../utilities';
import VehicleSearch from '../Components/Search';
import DashboardLayout from '../Components/DashboardLayout';
import ErrorAlert from '../Components/ErrorAlert';
import { useVehicles } from '../useVehicles';

interface AdminProps {
    token: string;
    navigate: (screen: Screen) => void;
}

const EMPTY_FORM: VehicleFormData = {
    make: '',
    model: '',
    category: '',
    price: 0,
    quantity: 0,
};

const INPUT_CLASSES =
    "w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20";

const saveVehicleApi = async (headers: HeadersInit, formData: VehicleFormData, editingId: number | null): Promise<void> => {
    const payload = { ...formData, price: Number(formData.price), quantity: Number(formData.quantity) };
    const url = editingId ? `${API}/api/vehicles/${editingId}` : `${API}/api/vehicles`;
    const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers,
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await extractError(res, 'Action failed. (Are you an admin?)'));
};

const deleteVehicleApi = async (headers: HeadersInit, id: number): Promise<void> => {
    const res = await fetch(`${API}/api/vehicles/${id}`, { method: 'DELETE', headers });
    if (!res.ok) throw new Error(await extractError(res));
};

const restockVehicleApi = async (headers: HeadersInit, id: number, amount: number): Promise<void> => {
    const res = await fetch(`${API}/api/vehicles/${id}/restock`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ quantity: amount }),
    });
    if (!res.ok) throw new Error(await extractError(res));
};

const Admin: React.FC<AdminProps> = ({ token, navigate }) => {
    const [formData, setFormData] = useState<VehicleFormData>(EMPTY_FORM);
    const [editingId, setEditingId] = useState<number | null>(null);

    const headers = useMemo(
        () => ({
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        }),
        [token]
    );

    const { vehicles, loading, error, setError, handleSearch, refetch } = useVehicles(headers);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await saveVehicleApi(headers, formData, editingId);
            setFormData(EMPTY_FORM);
            setEditingId(null);
            await refetch();
        } catch (err: any) {
            setError(err.message || 'Operation failed');
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteVehicleApi(headers, id);
            await refetch();
        } catch (err: any) {
            setError(err.message || 'Failed to delete vehicle');
        }
    };

    const handleRestockSubmit = async (id: number, amount: number) => {
        try {
            await restockVehicleApi(headers, id, amount);
            await refetch();
        } catch (err: any) {
            setError(err.message || 'Failed to restock vehicle');
        }
    };

    const handleStartEdit = (vehicle: Vehicle) => {
        setEditingId(vehicle.id);
        const { id: _, ...rest } = vehicle;
        setFormData(rest);
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-center">
                <div className="text-lg font-medium text-slate-500 animate-pulse">
                    Loading dashboard...
                </div>
            </div>
        );
    }

    return (
        <DashboardLayout>
            <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                        Admin Dashboard
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Manage your vehicle inventory and stock.
                    </p>
                </div>
                <button
                    onClick={() => navigate('dashboard')}
                    className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition-colors"
                >
                    &larr; Back to Inventory
                </button>
            </div>

            {error && <ErrorAlert message={error} />}

            <VehicleForm
                editingId={editingId}
                formData={formData}
                onChange={handleInputChange}
                onSubmit={handleSubmit}
            />

            <VehicleSearch onSearch={handleSearch} />

            <div className="flex flex-col gap-4">
                {vehicles.length === 0 && !loading && (
                    <div className="rounded-xl border border-dashed border-slate-300 py-12 text-center text-slate-500">
                        No vehicles found matching your criteria.
                    </div>
                )}
                {vehicles.map((v) => (
                    <VehicleCard
                        key={v.id}
                        vehicle={v}
                        onEdit={handleStartEdit}
                        onDelete={handleDelete}
                        onRestock={handleRestockSubmit}
                    />
                ))}
            </div>
        </DashboardLayout>
    );
};

interface VehicleFormProps {
    editingId: number | null;
    formData: VehicleFormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit: (e: React.FormEvent) => void;
}

const VehicleForm: React.FC<VehicleFormProps> = ({ editingId, formData, onChange, onSubmit }) => (
    <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="mb-5 text-lg font-semibold text-slate-800">
            {editingId ? 'Edit Vehicle Details' : 'Register New Vehicle'}
        </h2>
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <div className="sm:col-span-1 lg:col-span-1">
                <input name="make" placeholder="Make" value={formData.make} onChange={onChange} required className={INPUT_CLASSES} />
            </div>
            <div className="sm:col-span-1 lg:col-span-1">
                <input name="model" placeholder="Model" value={formData.model} onChange={onChange} required className={INPUT_CLASSES} />
            </div>
            <div className="sm:col-span-1 lg:col-span-1">
                <input name="category" placeholder="Category" value={formData.category} onChange={onChange} required className={INPUT_CLASSES} />
            </div>
            <div className="sm:col-span-1 lg:col-span-1">
                <input name="price" type="number" placeholder="Price" value={formData.price || ''} onChange={onChange} required className={INPUT_CLASSES} />
            </div>
            <div className="sm:col-span-1 lg:col-span-1">
                <input name="quantity" type="number" placeholder="Quantity" value={formData.quantity || ''} onChange={onChange} required className={INPUT_CLASSES} />
            </div>
            <div className="sm:col-span-2 lg:col-span-1">
                <button type="submit" className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-700 active:scale-[0.98]">
                    {editingId ? 'Save Changes' : 'Add Vehicle'}
                </button>
            </div>
        </form>
    </div>
);

interface VehicleCardProps {
    vehicle: Vehicle;
    onEdit: (vehicle: Vehicle) => void;
    onDelete: (id: number) => void;
    onRestock: (id: number, amount: number) => void;
}

const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, onEdit, onDelete, onRestock }) => {
    const [restockAmount, setRestockAmount] = useState<string>('');

    const handleRestockSubmit = () => {
        const amount = Number(restockAmount);
        if (isNaN(amount) || amount <= 0) return;
        onRestock(vehicle.id, amount);
        setRestockAmount('');
    };

    return (
        <div className="group flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md sm:p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-col">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <h3 className="truncate text-lg font-bold text-slate-900">{vehicle.make} {vehicle.model}</h3>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">{vehicle.category}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                    <span className="font-semibold text-slate-700">${vehicle.price.toLocaleString()}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className={vehicle.quantity === 0 ? "text-red-500 font-medium" : ""}>Stock: {vehicle.quantity}</span>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center">
                    <input type="number" placeholder="Qty" value={restockAmount} onChange={(e) => setRestockAmount(e.target.value)} className="h-9 w-20 rounded-l-lg border border-slate-300 bg-slate-50 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                    <button onClick={handleRestockSubmit} className="h-9 shrink-0 rounded-r-lg border border-transparent bg-indigo-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-indigo-700">Restock</button>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => onEdit(vehicle)} className="h-9 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">Edit</button>
                    <button onClick={() => onDelete(vehicle.id)} className="h-9 rounded-lg bg-red-50 px-4 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100">Delete</button>
                </div>
            </div>
        </div>
    );
};

export default Admin;