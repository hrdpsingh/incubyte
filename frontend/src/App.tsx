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

  const [screen, setScreen] = useState<Screen>("dashboard");

  function handleLogin(token: string) {
    localStorage.setItem("token", token);
    setToken(token);
    setScreen("dashboard");
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setScreen("login");
  }

  if (!token) {
    if (screen === "register") {
      return <Register navigate={setScreen} />;
    }

    return <Login setToken={handleLogin} navigate={setScreen} />;
  }

  if (screen === "admin") {
    return <Admin token={token} navigate={setScreen} />;
  }

  return <Dashboard token={token} logout={logout} navigate={setScreen} />;
}