import { NavLink } from "react-router-dom";
import { useState } from "react";
import { getMenuByRole } from "../config/MenuConfig";
import { useAuth } from "../contexts/AuthContext";
import logo from "../assets/logograu.png";

export default function Sidebar({ collapsed = false }) {
    const { user } = useAuth();
    const items = getMenuByRole(user?.role);
    const [openMenus, setOpenMenus] = useState({});

    function toggleMenu(label) {
        setOpenMenus((prev) => ({
            ...prev,
            [label]: !prev[label],
        }));
    }

    return (
        <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
            <div className="sidebar-header">
                <div className="sidebar-brand">
                    <img src={logo} alt="Logo" className="sidebar-logo" />
                </div>
            </div>

            <nav className="sidebar-nav">
                {items.map((item) => {
                    if (item.children?.length) {
                        const isOpen = !!openMenus[item.label];

                        return (
                            <div key={item.label} className="sidebar-group">
                                <button
                                    type="button"
                                    className={`sidebar-link sidebar-group-button ${isOpen ? "open" : ""}`}
                                    onClick={() => toggleMenu(item.label)}
                                >
                                    <span className="sidebar-link-icon">
                                        {item.icon || "•"}
                                    </span>

                                    {!collapsed && (
                                        <>
                                            <span className="sidebar-link-text">
                                                {item.label}
                                            </span>

                                            <span className="sidebar-link-arrow">
                                                {isOpen ? "▾" : "▸"}
                                            </span>
                                        </>
                                    )}
                                </button>

                                {!collapsed && isOpen && (
                                    <div className="sidebar-submenu">
                                        {item.children.map((child) =>
                                            child.external ? (
                                                <a
                                                    key={child.path}
                                                    href={child.path}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="sidebar-link sidebar-sublink"
                                                >
                                                    <span className="sidebar-link-icon">
                                                        {child.icon || "•"}
                                                    </span>

                                                    <span className="sidebar-link-text">
                                                        {child.label}
                                                    </span>
                                                </a>
                                            ) : (
                                                <NavLink
                                                    key={child.path}
                                                    to={child.path}
                                                    className={({ isActive }) =>
                                                        `sidebar-link sidebar-sublink ${isActive ? "active" : ""}`
                                                    }
                                                >
                                                    <span className="sidebar-link-icon">
                                                        {child.icon || "•"}
                                                    </span>

                                                    <span className="sidebar-link-text">
                                                        {child.label}
                                                    </span>
                                                </NavLink>
                                            )
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    }

                    if (item.external) {
                        return (
                            <a
                                key={item.path}
                                href={item.path}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="sidebar-link"
                            >
                                <span className="sidebar-link-icon">
                                    {item.icon || "•"}
                                </span>

                                {!collapsed && (
                                    <span className="sidebar-link-text">
                                        {item.label}
                                    </span>
                                )}
                            </a>
                        );
                    }

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `sidebar-link ${isActive ? "active" : ""}`
                            }
                        >
                            <span className="sidebar-link-icon">
                                {item.icon || "•"}
                            </span>

                            {!collapsed && (
                                <span className="sidebar-link-text">
                                    {item.label}
                                </span>
                            )}
                        </NavLink>
                    );
                })}
            </nav>
        </aside>
    );
}