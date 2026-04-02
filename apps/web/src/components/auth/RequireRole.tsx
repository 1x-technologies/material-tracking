import type { UserRole } from "@material-tracking/shared";
import { useAuthContext } from "../../context/AuthContext";
import { AccessDeniedPage } from "../../pages/AccessDeniedPage";

interface RequireRoleProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export function RequireRole({ allowedRoles, children }: RequireRoleProps) {
  const { appUser } = useAuthContext();

  if (!appUser || !appUser.role || !allowedRoles.includes(appUser.role)) {
    return <AccessDeniedPage />;
  }

  return <>{children}</>;
}
