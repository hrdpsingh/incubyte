import { useState } from "react";

interface AuthFormProps {
    title: string;
    error?: string;
    success?: string;
    submitLabel: string;
    submitClassName?: string;
    switchText: string;
    switchActionLabel: string;
    onSwitch: () => void;
    onSubmit: (username: string, password: string) => void;
}

export default function AuthForm({
    title,
    error,
    success,
    submitLabel,
    submitClassName = "bg-blue-600 hover:bg-blue-700",
    switchText,
    switchActionLabel,
    onSwitch,
    onSubmit,
}: AuthFormProps) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(username, password);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
            <form onSubmit={handleSubmit} className="w-96 space-y-4 rounded-xl bg-white p-8 shadow-lg">
                <h1 className="text-center text-2xl font-bold">{title}</h1>

                {error && <p className="text-red-600">{error}</p>}
                {success && <p className="text-green-600">{success}</p>}

                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded border p-2"
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded border p-2"
                />

                <button type="submit" className={`w-full rounded p-2 text-white ${submitClassName}`}>
                    {submitLabel}
                </button>

                <p className="text-center text-sm">
                    {switchText}{" "}
                    <button type="button" onClick={onSwitch} className="text-blue-600 underline">
                        {switchActionLabel}
                    </button>
                </p>
            </form>
        </div>
    );
}