import { useState } from "react";

import Login from "./Login/Login";
import Register from "./Register/Register";
import Dashboard from "./Dashboard/Dashboard";
import Admin from "./Admin/Admin";

export type Screen = "login" | "register" | "admin" | "dashboard";

export default function App() {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("token")
  );

  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem("isAdmin") === "true";
  });

  const [screen, setScreen] = useState<Screen>("dashboard");

  function handleLogin(token: string) {
    localStorage.setItem("token", token);
    setToken(token);
    setScreen("dashboard");
  }

  function handleSetIsAdmin(adminStatus: boolean) {
    localStorage.setItem("isAdmin", String(adminStatus));
    setIsAdmin(adminStatus);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("isAdmin");
    setToken(null);
    setIsAdmin(false);
    setScreen("login");
  }

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

  return (
    <Dashboard
      token={token}
      isAdmin={isAdmin}
      logout={logout}
      navigate={setScreen}
    />
  );
}