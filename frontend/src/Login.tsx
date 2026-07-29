import { useState } from "react";

interface LoginProps {
    setToken: (token: string) => void;
}

const API = import.meta.env.VITE_API_URL;

export default function Login({
    setToken,
}: LoginProps) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    async function handleLogin(
        e: React.FormEvent,
    ) {
        e.preventDefault();

        setError("");

        try {
            const response = await fetch(
                `${API}/api/auth/login`,
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
                },
            );

            if (!response.ok) {
                setError("Invalid credentials");
                return;
            }

            const data = await response.json();

            setToken(data.access_token);
        } catch {
            setError("Unable to reach the server.");
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
            <form
                onSubmit={handleLogin}
                className="w-96 rounded-xl bg-white p-8 shadow-lg space-y-4"
            >
                <h1 className="text-center text-2xl font-bold">
                    Dealership Login
                </h1>

                {error && (
                    <p className="text-red-600">
                        {error}
                    </p>
                )}

                <input
                    type="text"
                    placeholder="Username"
                    className="w-full rounded border p-2"
                    value={username}
                    onChange={(e) =>
                        setUsername(e.target.value)
                    }
                />

                <input
                    type="password"
                    placeholder="Password"
                    className="w-full rounded border p-2"
                    value={password}
                    onChange={(e) =>
                        setPassword(e.target.value)
                    }
                />

                <button
                    type="submit"
                    className="w-full rounded bg-blue-600 p-2 text-white hover:bg-blue-700"
                >
                    Login
                </button>
            </form>
        </div>
    );
}