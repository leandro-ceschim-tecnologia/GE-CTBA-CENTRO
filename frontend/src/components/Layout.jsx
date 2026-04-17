import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout({
    children,
    title = "Dashboard",
    subtitle = "Ambiente administrativo",
}) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    function handleToggleSidebar() {
        setSidebarCollapsed((prev) => !prev);
    }

    return (
        <div className="app-shell">
            <Sidebar collapsed={sidebarCollapsed} />

            <div className="main">
                <Topbar
                    title={title}
                    subtitle={subtitle}
                    onToggleSidebar={handleToggleSidebar}
                />

                <main className="content">{children}</main>

                <footer className="footer">
                    Desenvolvido por Leandro Ceschim Tecnologia - © 2026 Todos os direitos reservados. · v1.0.0
                </footer>
            </div>
        </div>

    );
}