import { JSX } from "react";
import { NavLink } from "react-router-dom";

export function NavItem({ to, icon, label }: { to: string; icon: JSX.Element; label: string }) {
    return (
      <NavLink
        to={to}
        className={({ isActive }) =>
          `flex items-center gap-3 p-2 rounded-lg text-base font-medium transition-colors duration-200 ${
            isActive ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
          }`
        }
      >
        {icon}
        {label}
      </NavLink>
    );
  }