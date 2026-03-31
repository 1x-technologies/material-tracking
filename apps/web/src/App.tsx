import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AuthProvider, useAuthContext } from './context/AuthContext';
import { TRPCProvider } from './trpc';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { SignInPage } from './pages/SignInPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { Spinner } from './components/ui/Spinner';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
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
