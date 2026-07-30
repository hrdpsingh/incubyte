import { useState } from "react";

import Login from "./Login/Login";
import Register from "./Register/Register";
import Dashboard from "./Dashboard/Dashboard";

type Screen = "login" | "register";

export default function App() {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );

  const [screen, setScreen] = useState<Screen>("login");

  function handleLogin(token: string) {
    localStorage.setItem("token", token);
    setToken(token);
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setScreen("login");
  }

  if (token) {
    return (
      <Dashboard
        token={token}
        logout={logout}
      />
    );
  }

  if (screen === "register") {
    return (
      <Register
        navigate={setScreen}
      />
    );
  }

  return (
    <Login
      setToken={handleLogin}
      navigate={setScreen}
    />
  );
}