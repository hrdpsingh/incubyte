import { useState } from "react";
import type { Screen } from "../types";
import { API, extractError } from "../utilities";
import AuthForm from "../Components/Authentication";

interface RegisterProps {
    navigate: (screen: Screen) => void;
}

interface FormState {
    error: string;
    success: string;
    isLoading: boolean;
}

// Immutable default state to ensure clean resets across render cycles
const INITIAL_STATE: FormState = {
    error: "",
    success: "",
    isLoading: false,
};

export default function Register({ navigate }: RegisterProps) {
    const [formState, setFormState] = useState<FormState>(INITIAL_STATE);

    async function handleSubmit(username: string, password: string) {
        // Clear prior status banners and block duplicate submissions
        setFormState({ error: "", success: "", isLoading: true });

        try {
            const response = await fetch(`${API}/api/authentication/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                // Fallback message ensures UI feedback even if the backend payload lacks an error field
                const errorMessage = await extractError(response, "Registration failed.");
                setFormState({ error: errorMessage, success: "", isLoading: false });
                return;
            }

            setFormState({ error: "", success: "Registration successful!", isLoading: false });

            // Redirect immediately to credentials check after provisioning
            navigate("login");
        } catch {
            // Catches network dropouts or CORS errors before a response is received
            setFormState({ error: "Unable to contact server.", success: "", isLoading: false });
        }
    }

    return (
        <AuthForm
            title="Create an Account"
            subtitle="Join the dealership network today"
            error={formState.error}
            success={formState.success}
            isLoading={formState.isLoading}
            submitLabel="Register Account"
            submitClassName="bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500/50"
            switchText="Already have an account?"
            switchActionLabel="Sign in"
            onSwitch={() => navigate("login")}
            onSubmit={handleSubmit}
        />
    );
}