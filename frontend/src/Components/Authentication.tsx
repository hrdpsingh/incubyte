import { useState } from "react";
import Spinner from "./Spinner";

interface AuthFormProps {
    title: string;
    subtitle?: string;
    error?: string;
    success?: string;
    isLoading?: boolean;
    submitLabel: string;
    submitClassName?: string;
    switchText: string;
    switchActionLabel: string;
    onSwitch: () => void;
    onSubmit: (username: string, password: string) => void;
}

export default function AuthForm({
    title,
    subtitle,
    error,
    success,
    isLoading = false,
    submitLabel,
    submitClassName = "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500/50",
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
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl shadow-slate-200/50 ring-1 ring-slate-100">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
                    {subtitle && <p className="mt-2 text-sm text-slate-500">{subtitle}</p>}
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-600 border border-emerald-100">
                            {success}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="sr-only" htmlFor="username">Username</label>
                            <input
                                id="username"
                                type="text"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="block w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                                required
                            />
                        </div>
                        <div>
                            <label className="sr-only" htmlFor="password">Password</label>
                            <input
                                id="password"
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`flex items-center justify-center gap-2 w-full rounded-xl p-3 font-semibold text-white shadow-sm transition-all active:scale-[0.98] focus:outline-none focus:ring-4 ${submitClassName}`}
                    >
                        {isLoading && <Spinner />}
                        {submitLabel}
                    </button>
                </form>

                <div className="mt-8 border-t border-slate-100 pt-6 text-center">
                    <p className="text-sm text-slate-600">
                        {switchText}{" "}
                        <button type="button" onClick={onSwitch} className="font-semibold text-blue-600 hover:text-blue-500 hover:underline">
                            {switchActionLabel}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}