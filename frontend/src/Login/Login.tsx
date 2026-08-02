import { useState } from "react";
import type { Screen } from "../types";
import { API } from "../utilities";
import AuthForm from "../Components/Authentication";

// Props contract required to manage top-level app auth state and routing.
interface LoginProps {
    setToken: (token: string) => void;
    setIsAdmin: (isAdmin: boolean) => void;
    navigate: (screen: Screen) => void;
}

// Mirror expected payload from POST /api/authentication/login endpoint.
interface LoginResponse {
    access_token: string;
    is_admin?: boolean;
}

// Encapsulates network request to allow isolation or future extraction to an API service module.
async function loginUser(username: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API}/api/authentication/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });

    // Uniformly flag non-2xx responses as generic credential failures for the UI layer.
    if (!response.ok) {
        throw new Error("Invalid credentials");
    }

    return response.json();
}

export default function Login({ setToken, setIsAdmin, navigate }: LoginProps) {
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(username: string, password: string) {
        setError("");
        setIsLoading(true);

        try {
            const data = await loginUser(username, password);
            setToken(data.access_token);
            setIsAdmin(Boolean(data.is_admin));
        } catch (error) {
            // Distinguish expected authentication errors from network connection failures.
            const message = error instanceof Error && error.message === "Invalid credentials"
                ? error.message
                : "Unable to contact server.";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <AuthForm
            title="Welcome Back"
            subtitle="Sign in to access the dealership"
            error={error}
            isLoading={isLoading}
            submitLabel="Sign In"
            switchText="Don't have an account?"
            switchActionLabel="Register"
            onSwitch={() => navigate("register")}
            onSubmit={handleSubmit}
        />
    );
}