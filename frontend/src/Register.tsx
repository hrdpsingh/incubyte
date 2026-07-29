import { useState } from "react";

type Screen = "login" | "register";

interface RegisterProps {
    navigate: (screen: Screen) => void;
}

const API = import.meta.env.VITE_API_URL;

export default function Register({
    navigate,
}: RegisterProps) {
    const [username, setUsername] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

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
                const data =
                    await response.json();

                setError(
                    data.detail ??
                    "Registration failed."
                );

                return;
            }

            setSuccess("Registration successful!");
            navigate("login");
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
                    Create Account
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

                <p className="text-center text-sm">
                    Already have an account?{" "}
                    <button
                        type="button"
                        onClick={() =>
                            navigate("login")
                        }
                        className="text-blue-600 underline"
                    >
                        Login
                    </button>
                </p>
            </form>
        </div>
    );
}