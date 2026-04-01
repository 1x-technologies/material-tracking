import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { RequireRole } from "./components/auth/RequireRole";
import { AppLayout } from "./components/layout/AppLayout";
import { Spinner } from "./components/ui/Spinner";
import { AuthProvider, useAuthContext } from "./context/AuthContext";
import { AccessDeniedPage } from "./pages/AccessDeniedPage";
import { DashboardPage } from "./pages/DashboardPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ScanPage } from "./pages/ScanPage";
import { ShipmentFormPage } from "./pages/ShipmentFormPage";
import { SignInPage } from "./pages/SignInPage";
import { SignPiecePage } from "./pages/SignPiecePage";
import { TRPCProvider } from "./trpc";

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, profileLoading } = useAuthContext();

  if (loading || (user && profileLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen" aria-live="polite">
        <div className="flex flex-col items-center gap-3">
          <Spinner />
          <p className="text-sm text-neutral-500">Loading session…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <SignInPage />;
  }

  return <>{children}</>;
}

function AuthenticatedRoutes() {
  return (
    <AuthGate>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route
            path="shipments/new"
            element={
              <RequireRole allowedRoles={["staff", "admin"]}>
                <ShipmentFormPage />
              </RequireRole>
            }
          />
          <Route
            path="shipments/:shipmentId/edit"
            element={
              <RequireRole allowedRoles={["staff", "admin"]}>
                <ShipmentFormPage />
              </RequireRole>
            }
          />
          <Route
            path="shipments/:shipmentId"
            element={
              <RequireRole allowedRoles={["staff", "admin"]}>
                <ShipmentFormPage />
              </RequireRole>
            }
          />
          <Route path="scan" element={<ScanPage />} />
          <Route path="access-denied" element={<AccessDeniedPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </AuthGate>
  );
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="sign/:token" element={<SignPiecePage />} />
        <Route path="*" element={<AuthenticatedRoutes />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <TRPCProvider>
        <AppRoutes />
      </TRPCProvider>
    </AuthProvider>
  );
}
