import { Outlet } from "react-router";
import { Toaster } from "sonner";
import { LogOut01, Moon01, Sun } from "@untitledui/icons";
import { MenuTrigger as AriaMenuTrigger, Button as AriaButton, Popover as AriaPopover, Menu as AriaMenu, MenuItem as AriaMenuItem } from "react-aria-components";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badges";
import { cx } from "@/utils/cx";
import { useDarkMode } from "../../hooks/useDarkMode";
import { useAuthContext } from "../../context/AuthContext";
import { Sidebar } from "./Sidebar";

const roleLabelMap: Record<string, string> = { admin: "Admin", driver: "Driver", staff: "Staff" };

export function AppLayout() {
  const { isDark, toggle } = useDarkMode();
  const { user, appUser, signOutUser } = useAuthContext();

  const displayName = appUser?.displayName || user?.displayName || "";
  const email = appUser?.email || user?.email || "";
  const photoURL = user?.photoURL || undefined;
  const initials = (displayName || email || "?")[0].toUpperCase();

  return (
    <div className="flex min-h-screen bg-primary">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar: user avatar dropdown — top right */}
        <div className="flex items-center justify-end px-4 pt-3 lg:px-6 lg:pt-4">
          <AriaMenuTrigger>
            <AriaButton className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 outline-focus-ring transition hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2">
              <Avatar size="sm" src={photoURL} initials={initials} />
              <div className="hidden items-center gap-2 sm:flex">
                <span className="text-sm font-medium text-primary">{displayName || email}</span>
                {appUser?.role && (
                  <Badge color="gray" type="pill-color" size="sm">
                    {roleLabelMap[appUser.role] ?? appUser.role}
                  </Badge>
                )}
              </div>
            </AriaButton>

            <AriaPopover
              placement="bottom end"
              className={({ isEntering, isExiting }) =>
                cx(
                  "w-56 overflow-hidden rounded-lg bg-primary shadow-lg ring-1 ring-secondary_alt outline-hidden",
                  isEntering && "duration-200 ease-out animate-in fade-in slide-in-from-top-1",
                  isExiting && "duration-150 ease-in animate-out fade-out slide-out-to-top-1",
                )
              }
            >
              <div className="border-b border-secondary px-4 py-3">
                <p className="text-sm font-medium text-primary truncate">{displayName || email}</p>
                <p className="text-xs text-tertiary truncate">{email}</p>
              </div>

              <AriaMenu className="p-1 outline-hidden">
                <AriaMenuItem
                  onAction={toggle}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-secondary outline-hidden transition hover:bg-primary_hover focus:bg-primary_hover"
                >
                  {isDark ? <Sun className="size-4 text-fg-quaternary" /> : <Moon01 className="size-4 text-fg-quaternary" />}
                  {isDark ? "Light mode" : "Dark mode"}
                </AriaMenuItem>
                <AriaMenuItem
                  onAction={signOutUser}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-secondary outline-hidden transition hover:bg-primary_hover focus:bg-primary_hover"
                >
                  <LogOut01 className="size-4 text-fg-quaternary" />
                  Sign out
                </AriaMenuItem>
              </AriaMenu>
            </AriaPopover>
          </AriaMenuTrigger>
        </div>

        <main className="relative flex-1 overflow-y-auto px-4 pb-4 lg:px-6 lg:pb-6" style={{ isolation: "isolate" }}>
          <div className="mx-auto max-w-[--max-width-container]">
            <Outlet />
          </div>
        </main>
      </div>

      <Toaster position="top-right" richColors />
    </div>
  );
}
