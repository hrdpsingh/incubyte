import { useState } from "react";
import type { Screen } from "../types";
import { API, extractError } from "../utilities";
import AuthForm from "../Components/Authentication";

interface RegisterProps {
    navigate: (screen: Screen) => void;
}

export default function Register({ navigate }: RegisterProps) {
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(username: string, password: string) {
        setError("");
        setSuccess("");
        setIsLoading(true);

        try {
            const response = await fetch(`${API}/api/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                setError(await extractError(response, "Registration failed."));
                return;
            }

            setSuccess("Registration successful!");
            navigate("login");
        } catch {
            setError("Unable to contact server.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <AuthForm
            title="Create an Account"
            subtitle="Join the dealership network today"
            error={error}
            success={success}
            isLoading={isLoading}
            submitLabel="Register Account"
            submitClassName="bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500/50"
            switchText="Already have an account?"
            switchActionLabel="Sign in"
            onSwitch={() => navigate("login")}
            onSubmit={handleSubmit}
        />
    );
}