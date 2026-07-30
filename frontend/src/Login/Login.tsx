import { useState } from "react";
import type { Screen } from "../types";
import { API } from "../utilities";
import AuthForm from "../Components/Authentication";

interface LoginProps {
    setToken: (token: string) => void;
    setIsAdmin: (isAdmin: boolean) => void;
    navigate: (screen: Screen) => void;
}

export default function Login({ setToken, setIsAdmin, navigate }: LoginProps) {
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(username: string, password: string) {
        setError("");
        setIsLoading(true);

        try {
            const response = await fetch(`${API}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                setError("Invalid credentials");
                return;
            }

            const data = await response.json();
            setToken(data.access_token);
            setIsAdmin(data.is_admin);
        } catch {
            setError("Unable to contact server.");
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