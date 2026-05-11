import { createRoot } from "react-dom/client";
import { useMemo } from "react";
import App from "./App";
import AdminPage from "./pages/AdminPage";
import "./index.css";

function Root() {
  const isAdmin = useMemo(() => {
    const basePath = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
    const path = window.location.pathname;
    const relative = basePath ? path.replace(basePath, "") : path;
    return relative === "/admin" || relative.startsWith("/admin/");
  }, []);

  return isAdmin ? <AdminPage /> : <App />;
}

createRoot(document.getElementById("root")!).render(<Root />);
