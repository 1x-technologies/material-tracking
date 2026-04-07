import { type FC, type HTMLAttributes, useCallback, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import type { UserRole } from "@material-tracking/shared";
import {
  BarChart01,
  ChevronLeft,
  ChevronRight,
  ClockRewind,
  LogOut01,
  Moon01,
  Package,
  QrCode01,
  Settings01,
  Sun,
} from "@untitledui/icons";
import { useDarkMode } from "../../hooks/useDarkMode";
import { X as CloseIcon, Menu02 } from "@untitledui/icons";
import {
  Button as AriaButton,
  Dialog as AriaDialog,
  DialogTrigger as AriaDialogTrigger,
  Modal as AriaModal,
  ModalOverlay as AriaModalOverlay,
} from "react-aria-components";
import { AvatarLabelGroup } from "@/components/base/avatar/avatar-label-group";
import { Badge } from "@/components/base/badges/badges";
import { cx } from "@/utils/cx";
import { useAuthContext } from "../../context/AuthContext";

interface NavItem {
  label: string;
  path: string;
  icon: FC<HTMLAttributes<HTMLOrSVGElement>>;
  roles: UserRole[];
}

const allRoles: UserRole[] = ["admin", "driver", "staff"];

const navItems: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: BarChart01, roles: allRoles },
  { label: "History", path: "/history", icon: ClockRewind, roles: ["staff", "admin"] },
  { label: "New Shipment", path: "/shipments/new", icon: Package, roles: ["staff", "admin"] },
  { label: "Scan", path: "/scan", icon: QrCode01, roles: ["driver", "admin"] },
  { label: "Admin", path: "/admin", icon: Settings01, roles: ["admin"] },
];

const roleLabelMap: Record<string, string> = {
  admin: "Admin",
  driver: "Driver",
  staff: "Staff",
};

const SIDEBAR_WIDTH_EXPANDED = 280;
const SIDEBAR_WIDTH_COLLAPSED = 68;

function SidebarContent({ onNavClick, collapsed, onToggleCollapse }: { onNavClick?: () => void; collapsed?: boolean; onToggleCollapse?: () => void }) {
  const { user, appUser, signOutUser } = useAuthContext();
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggle: toggleDark } = useDarkMode();

  const visibleItems = navItems.filter(
    (item) => appUser && appUser.role && item.roles.includes(appUser.role),
  );

  const displayName = appUser?.displayName || user?.displayName || "";
  const email = appUser?.email || user?.email || "";
  const photoURL = user?.photoURL || undefined;
  const initials = (displayName || email || "?")[0].toUpperCase();

  const sidebarWidth = collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;

  return (
    <aside
      style={{ "--width": `${sidebarWidth}px` } as React.CSSProperties}
      className={cx(
        "flex h-full max-w-full flex-col justify-between overflow-auto border-secondary bg-primary pt-4 transition-all duration-200 lg:border-r lg:pt-5",
        collapsed ? "w-[68px] items-center" : "w-full lg:w-(--width)",
      )}
    >
      {/* Logo / App name */}
      <div className={cx("flex items-center pb-1", collapsed ? "justify-center px-2" : "gap-2.5 px-5")}>
        <div className="flex size-8 items-center justify-center rounded-lg bg-brand-solid shrink-0">
          <Package className="size-4.5 text-white" />
        </div>
        {!collapsed && <span className="text-md font-semibold text-primary">Material Tracking</span>}
      </div>

      {/* Navigation items */}
      <ul className={cx("flex flex-1 flex-col pt-5", collapsed ? "px-2" : "px-4")}>
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path
            || (item.path !== "/dashboard" && location.pathname.startsWith(item.path));

          return (
            <li key={item.path} className="py-px">
              <button
                type="button"
                title={collapsed ? item.label : undefined}
                onClick={() => {
                  navigate(item.path);
                  onNavClick?.();
                }}
                className={cx(
                  "group/item relative flex w-full min-h-[44px] cursor-pointer items-center rounded-md p-2 outline-focus-ring transition duration-100 ease-linear select-none",
                  collapsed && "justify-center",
                  isActive
                    ? "bg-secondary hover:bg-secondary_hover"
                    : "bg-primary hover:bg-primary_hover",
                )}
              >
                <Icon
                  aria-hidden="true"
                  className={cx(
                    "size-5 shrink-0 transition duration-100",
                    !collapsed && "mr-2",
                    isActive
                      ? "text-fg-quaternary_hover"
                      : "text-fg-quaternary group-hover/item:text-fg-quaternary_hover",
                  )}
                />
                {!collapsed && (
                  <span
                    className={cx(
                      "flex-1 text-left text-sm font-semibold transition duration-100",
                      isActive
                        ? "text-secondary_hover"
                        : "text-secondary group-hover/item:text-secondary_hover",
                    )}
                  >
                    {item.label}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {/* Collapse toggle (desktop only) */}
      {onToggleCollapse && (
        <div className="flex justify-center px-2 pb-4 lg:pb-5">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex items-center justify-center rounded-md p-2 text-fg-quaternary transition hover:bg-primary_hover hover:text-fg-quaternary_hover"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="size-5" /> : <ChevronLeft className="size-5" />}
          </button>
        </div>
      )}
    </aside>
  );
}

export function Sidebar() {
  // Desktop preference (persisted) -- only applies on lg+ screens
  const [desktopCollapsed, setDesktopCollapsed] = useState(() => {
    return localStorage.getItem("sidebar-collapsed") === "true";
  });

  const toggleCollapse = useCallback(() => {
    setDesktopCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  }, []);

  return (
    <>
      {/* Tablet/mobile: always icons-only (collapsed), no toggle */}
      <div className="fixed inset-y-0 left-0 z-20 flex lg:hidden">
        <SidebarContent collapsed />
      </div>
      <div
        style={{ width: SIDEBAR_WIDTH_COLLAPSED, minWidth: SIDEBAR_WIDTH_COLLAPSED }}
        className="shrink-0 lg:hidden"
      />

      {/* Desktop: collapsible with toggle */}
      <div className="fixed inset-y-0 left-0 z-20 hidden lg:flex transition-all duration-200">
        <SidebarContent collapsed={desktopCollapsed} onToggleCollapse={toggleCollapse} />
      </div>
      <div
        style={{ width: desktopCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED, minWidth: desktopCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED }}
        className="hidden shrink-0 lg:block transition-all duration-200"
      />
    </>
  );
}

function MobileSidebarHeader() {
  return (
    <AriaDialogTrigger>
      <header className="flex h-14 items-center justify-between border-b border-secondary bg-primary p-3 pl-4 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-brand-solid">
            <Package className="size-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-primary">Material Tracking</span>
        </div>

        <AriaButton
          aria-label="Expand navigation menu"
          className="group flex items-center justify-center rounded-lg bg-primary p-2 text-fg-secondary outline-focus-ring hover:bg-primary_hover hover:text-fg-secondary_hover focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <Menu02 className="size-6 transition duration-200 ease-in-out group-aria-expanded:opacity-0" />
          <CloseIcon className="absolute size-6 opacity-0 transition duration-200 ease-in-out group-aria-expanded:opacity-100" />
        </AriaButton>
      </header>

      <AriaModalOverlay
        isDismissable
        className={({ isEntering, isExiting }) =>
          cx(
            "fixed inset-0 z-50 cursor-pointer bg-overlay/70 pr-16 backdrop-blur-md lg:hidden",
            isEntering && "duration-300 ease-in-out animate-in fade-in",
            isExiting && "duration-200 ease-in-out animate-out fade-out",
          )
        }
      >
        {({ state }) => (
          <>
            <AriaButton
              aria-label="Close navigation menu"
              onPress={() => state.close()}
              className="fixed top-2.5 right-3 flex cursor-pointer items-center justify-center rounded-lg p-2 text-fg-white/70 outline-focus-ring hover:bg-white/10 hover:text-fg-white focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <CloseIcon className="size-6" />
            </AriaButton>

            <AriaModal className="w-full max-w-74 cursor-auto will-change-transform">
              <AriaDialog className="h-dvh outline-hidden focus:outline-hidden">
                <SidebarContent onNavClick={() => state.close()} />
              </AriaDialog>
            </AriaModal>
          </>
        )}
      </AriaModalOverlay>
    </AriaDialogTrigger>
  );
}
