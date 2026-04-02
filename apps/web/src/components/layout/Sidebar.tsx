import type { UserRole } from "@material-tracking/shared";
import { NavLink } from "react-router";
import { useAuthContext } from "../../context/AuthContext";

interface NavItem {
  label: string;
  path: string;
  icon: string;
  roles: UserRole[];
}

const allRoles: UserRole[] = ["admin", "driver", "staff"];

const navItems: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: "📊", roles: allRoles },
  { label: "History", path: "/history", icon: "📋", roles: ["staff", "admin"] },
  { label: "New Shipment", path: "/shipments/new", icon: "📦", roles: ["staff", "admin"] },
  { label: "Scan", path: "/scan", icon: "📷", roles: ["driver", "admin"] },
];

export function Sidebar() {
  const { appUser } = useAuthContext();

  const visibleItems = navItems.filter(
    (item) => appUser && item.roles.includes(appUser.role),
  );

  return (
    <aside className="hidden md:flex flex-col bg-white border-r border-neutral-200 w-18 lg:w-64 transition-all duration-200">
      <nav className="flex-1 py-4">
        <ul className="space-y-1 px-2">
          {visibleItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive
                      ? "bg-brand-50 text-brand-700 font-semibold"
                      : "text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900"
                  }`
                }
              >
                <span className="text-lg">{item.icon}</span>
                <span className="hidden lg:block">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
