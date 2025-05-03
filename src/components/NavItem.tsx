import { LucideProps } from 'lucide-react';
import { NavLink } from 'react-router-dom';

interface NavItemProps {
  to: string;
  icon: React.ComponentType<LucideProps>;
  label: string;
}

export function NavItem({ to, icon: Icon, label }: NavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 p-2 rounded ${
          isActive ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
        }`
      }
    >
      <Icon className="w-5 h-5" />
      {label}
    </NavLink>
  );
}
