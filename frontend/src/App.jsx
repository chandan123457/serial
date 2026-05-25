import { useState } from "react";
import AdminDashboardPage from "./admin/pages/AdminDashboardPage";
import SignInPage from "./auth/pages/SignInPage";
import { clearStoredSession, getStoredSession, setStoredSession } from "./auth/authStorage";
import ProductionDashboardPage from "./pages/ProductionDashboardPage";

export default function App() {
  const [session, setSession] = useState(() => getStoredSession());

  function handleLogin(nextSession) {
    setStoredSession(nextSession);
    setSession(nextSession);
  }

  function handleLogout() {
    clearStoredSession();
    setSession(null);
  }

  if (!session) {
    return <SignInPage onLogin={handleLogin} />;
  }

  if (session.role === "admin") {
    return <AdminDashboardPage session={session} onLogout={handleLogout} />;
  }

  return <ProductionDashboardPage session={session} onLogout={handleLogout} />;
}
