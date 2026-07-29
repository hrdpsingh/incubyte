import { useState } from "react";

interface RegisterProps {
    onRegistered: () => void;
}

const API = import.meta.env.VITE_API_URL;

export default function Register({
    onRegistered,
}: RegisterProps) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function handleSubmit(
        e: React.FormEvent
    ) {
        e.preventDefault();

        setError("");
        setSuccess("");

        try {
            const response = await fetch(
                `${API}/api/auth/register`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        username,
                        password,
                    }),
                }
            );

            if (!response.ok) {
                const data = await response.json();

                setError(
                    data.detail ??
                    "Unable to register."
                );

                return;
            }

            setSuccess(
                "Registration successful!"
            );

            onRegistered();
        } catch {
            setError(
                "Unable to contact the server."
            );
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
            <form
                onSubmit={handleSubmit}
                className="w-96 space-y-4 rounded-xl bg-white p-8 shadow-lg"
            >
                <h1 className="text-center text-2xl font-bold">
                    Register
                </h1>

                {error && (
                    <p className="text-red-600">
                        {error}
                    </p>
                )}

                {success && (
                    <p className="text-green-600">
                        {success}
                    </p>
                )}

                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) =>
                        setUsername(e.target.value)
                    }
                    className="w-full rounded border p-2"
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) =>
                        setPassword(e.target.value)
                    }
                    className="w-full rounded border p-2"
                />

                <button
                    type="submit"
                    className="w-full rounded bg-green-600 p-2 text-white hover:bg-green-700"
                >
                    Register
                </button>
            </form>
        </div>
    );
}