import { useState } from "react";

import Login from "./Login/Login";
import Register from "./Register/Register";
import Dashboard from "./Dashboard/Dashboard";
import Admin from "./Admin/Admin";
import type { Screen } from "./types"

export default function App() {
  // Store authentication token initialized from local storage
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("token")
  );

  // Track admin status persisted in local storage
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem("isAdmin") === "true";
  });

  // Track current active screen view
  const [screen, setScreen] = useState<Screen>("dashboard");

  // Save session token locally and redirect user to dashboard
  function handleLogin(token: string) {
    localStorage.setItem("token", token);
    setToken(token);
    setScreen("dashboard");
  }

  // Update and persist administrator status
  function handleSetIsAdmin(adminStatus: boolean) {
    localStorage.setItem("isAdmin", String(adminStatus));
    setIsAdmin(adminStatus);
  }

  // Clear session data from storage and reset app state to login
  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("isAdmin");
    setToken(null);
    setIsAdmin(false);
    setScreen("login");
  }

  // Unauthenticated user routing guard
  if (!token) {
    if (screen === "register") {
      return <Register navigate={setScreen} />;
    }

    return (
      <Login
        setToken={handleLogin}
        setIsAdmin={handleSetIsAdmin}
        navigate={setScreen}
      />
    );
  }

  // Restricted admin view route guard
  if (screen === "admin") {
    return isAdmin ? (
      <Admin token={token} navigate={setScreen} />
    ) : (
      <Dashboard
        token={token}
        isAdmin={isAdmin}
        logout={logout}
        navigate={setScreen}
      />
    );
  }

  // Default authenticated view fallback
  return (
    <Dashboard
      token={token}
      isAdmin={isAdmin}
      logout={logout}
      navigate={setScreen}
    />
  );
}