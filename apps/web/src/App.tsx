import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { AppLayout } from "./components/layout/AppLayout";
import { Spinner } from "./components/ui/Spinner";
import { AuthProvider, useAuthContext } from "./context/AuthContext";
import { DashboardPage } from "./pages/DashboardPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { SignInPage } from "./pages/SignInPage";
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

function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthGate>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AuthGate>
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
