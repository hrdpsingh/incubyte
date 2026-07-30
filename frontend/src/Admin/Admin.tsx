import React, { useEffect, useState } from 'react';

export interface Vehicle {
    id?: number;
    make: string;
    model: string;
    category: string;
    price: number;
    quantity: number;
}

const emptyForm: Vehicle = {
    make: '',
    model: '',
    category: '',
    price: 0,
    quantity: 0,
};

const Admin: React.FC = () => {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<Vehicle>(emptyForm);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [searchQuery, setSearchQuery] = useState<string>('');

    const [restockAmounts, setRestockAmounts] = useState<{ [key: number]: string }>({});

    const fetchVehicles = async (url = '/api/vehicles') => {
        try {
            setError(null);
            const res = await fetch(url, {
                headers: { 'Content-Type': 'application/json' },
            });
            if (!res.ok) {
                throw new Error('Failed to load vehicles');
            }
            const data = await res.json();
            setVehicles(data);
        } catch {
            setError('Failed to load vehicles');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVehicles();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            make: formData.make,
            model: formData.model,
            category: formData.category,
            price: Number(formData.price),
            quantity: Number(formData.quantity),
        };

        try {
            if (editingId !== null) {
                await fetch(`/api/vehicles/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            } else {
                await fetch('/api/vehicles', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            }

            setFormData(emptyForm);
            setEditingId(null);
            await fetchVehicles();
        } catch {
            setError('Operation failed');
        }
    };

    const handleEditClick = (vehicle: Vehicle) => {
        if (vehicle.id !== undefined) {
            setEditingId(vehicle.id);
            setFormData({
                make: vehicle.make,
                model: vehicle.model,
                category: vehicle.category,
                price: vehicle.price,
                quantity: vehicle.quantity,
            });
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await fetch(`/api/vehicles/${id}`, {
                method: 'DELETE',
            });
            await fetchVehicles();
        } catch {
            setError('Failed to delete vehicle');
        }
    };

    const handleRestockChange = (id: number, value: string) => {
        setRestockAmounts((prev) => ({ ...prev, [id]: value }));
    };

    const handleRestockSubmit = async (id: number) => {
        const amount = Number(restockAmounts[id]);
        if (isNaN(amount) || amount <= 0) return;

        try {
            await fetch(`/api/vehicles/${id}/restock`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantity: amount }),
            });
            setRestockAmounts((prev) => ({ ...prev, [id]: '' }));
            await fetchVehicles();
        } catch {
            setError('Failed to restock vehicle');
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetchVehicles(`/api/vehicles/search?make=${encodeURIComponent(searchQuery)}`);
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
        }).format(price);
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div>
            <h1>Admin Dashboard</h1>

            <form onSubmit={handleSearch}>
                <input
                    type="text"
                    placeholder="Search Make"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit">Search</button>
            </form>

            <h2>{editingId ? 'Edit Vehicle' : 'Add Vehicle'}</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="make">Make</label>
                    <input
                        id="make"
                        name="make"
                        type="text"
                        value={formData.make}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div>
                    <label htmlFor="model">Model</label>
                    <input
                        id="model"
                        name="model"
                        type="text"
                        value={formData.model}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div>
                    <label htmlFor="category">Category</label>
                    <input
                        id="category"
                        name="category"
                        type="text"
                        value={formData.category}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div>
                    <label htmlFor="price">Price</label>
                    <input
                        id="price"
                        name="price"
                        type="number"
                        value={formData.price || ''}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div>
                    <label htmlFor="quantity">Quantity</label>
                    <input
                        id="quantity"
                        name="quantity"
                        type="number"
                        value={formData.quantity || ''}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <button type="submit">{editingId ? 'Save' : 'Add Vehicle'}</button>
            </form>

            <h2>Vehicles</h2>
            <ul>
                {vehicles.map((vehicle) => (
                    <li key={vehicle.id}>
                        <div>
                            <span>{vehicle.make}</span> - <span>{vehicle.model}</span> -{' '}
                            <span>{vehicle.category}</span> - <span>{formatPrice(vehicle.price)}</span> -{' '}
                            <span>Qty: {vehicle.quantity}</span>
                        </div>

                        {vehicle.id !== undefined && (
                            <div>
                                <button type="button" onClick={() => handleEditClick(vehicle)}>
                                    Edit
                                </button>
                                <button type="button" onClick={() => handleDelete(vehicle.id!)}>
                                    Delete
                                </button>

                                <input
                                    type="number"
                                    placeholder="Restock amount"
                                    value={restockAmounts[vehicle.id] || ''}
                                    onChange={(e) => handleRestockChange(vehicle.id!, e.target.value)}
                                />
                                <button type="button" onClick={() => handleRestockSubmit(vehicle.id!)}>
                                    Restock
                                </button>
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Admin;