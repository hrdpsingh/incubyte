import { useState } from "react";

type Screen = "login" | "register";

interface LoginProps {
    setToken: (token: string) => void;
    setIsAdmin: (isAdmin: boolean) => void;
    navigate: (screen: Screen) => void;
}

const API = import.meta.env.VITE_API_URL;

export default function Login({
    setToken,
    setIsAdmin,
    navigate,
}: LoginProps) {
    const [username, setUsername] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [error, setError] =
        useState("");

    async function handleSubmit(
        e: React.FormEvent
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
                }
            );

            if (!response.ok) {
                setError("Invalid credentials");
                return;
            }

            const data = await response.json();

            setToken(data.access_token);
            setIsAdmin(data.is_admin);
        } catch {
            setError(
                "Unable to contact server."
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
                    className="w-full rounded bg-blue-600 p-2 text-white hover:bg-blue-700"
                >
                    Login
                </button>

                <p className="text-center text-sm">
                    Don't have an account?{" "}
                    <button
                        type="button"
                        onClick={() =>
                            navigate("register")
                        }
                        className="text-blue-600 underline"
                    >
                        Register
                    </button>
                </p>
            </form>
        </div>
    );
}