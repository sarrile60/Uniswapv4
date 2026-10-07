import React from "react";
import "@/App.css";
import "@/pages/InsidePages.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import ErrorBoundary from "@/components/ErrorBoundary";
import RockieLayout from "@/components/RockieLayout";
import PageTransition from "@/components/PageTransition";

import { LangProvider } from "@/i18n";

// Pages
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import WalletDashboard from "@/pages/WalletDashboard";
import TransactionsPage from "@/pages/TransactionsPage";
import KYCPage from "@/pages/KYCPage";
import ProfilePage from "@/pages/ProfilePage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import PrivacyPolicyPage from "@/pages/PrivacyPolicyPage";
import TermsOfServicePage from "@/pages/TermsOfServicePage";
import AboutPage from "@/pages/AboutPage";
import CheckPage from "@/pages/CheckPage";
import CreateAccountPage from "@/pages/CreateAccountPage";
import MarketsPage from "@/pages/MarketsPage";
import CoinDetailPage from "@/pages/CoinDetailPage";
import LearnPage from "@/pages/LearnPage";
import LearnArticlePage from "@/pages/LearnArticlePage";
import EarnPage from "@/pages/EarnPage";
import SecurityPage from "@/pages/SecurityPage";

// Admin Pages
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminCreateUser from "@/pages/admin/AdminCreateUser";
import AdminEditUser from "@/pages/admin/AdminEditUser";
import AdminKYCQueue from "@/pages/admin/AdminKYCQueue";
import AdminTransactions from "@/pages/admin/AdminTransactions";
import AdminAuditLogs from "@/pages/admin/AdminAuditLogs";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminWalletPool from "@/pages/admin/AdminWalletPool";
import AdminAgents from "@/pages/admin/AdminAgents";

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/wallet" replace />;
  }

  return children;
};

// Public Route (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={isAdmin ? "/admin" : "/wallet"} replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <PageTransition>
      <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/privacy" element={<RockieLayout><PrivacyPolicyPage /></RockieLayout>} />
      <Route path="/terms" element={<RockieLayout><TermsOfServicePage /></RockieLayout>} />
      <Route path="/about" element={<RockieLayout><AboutPage /></RockieLayout>} />
      <Route path="/check" element={<CheckPage />} />
      <Route path="/CreateAccount" element={<CreateAccountPage />} />
      <Route path="/markets" element={<RockieLayout><MarketsPage /></RockieLayout>} />
      <Route path="/markets/:symbol" element={<RockieLayout><CoinDetailPage /></RockieLayout>} />
      <Route path="/learn" element={<RockieLayout><LearnPage /></RockieLayout>} />
      <Route path="/learn/:slug" element={<RockieLayout><LearnArticlePage /></RockieLayout>} />
      <Route path="/earn" element={<RockieLayout><EarnPage /></RockieLayout>} />
      <Route path="/security" element={<ProtectedRoute><RockieLayout><SecurityPage /></RockieLayout></ProtectedRoute>} />

      {/* User Routes — wrapped with RockieLayout */}
      <Route
        path="/wallet"
        element={
          <ProtectedRoute>
            <RockieLayout><WalletDashboard /></RockieLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/transactions"
        element={
          <ProtectedRoute>
            <RockieLayout><TransactionsPage /></RockieLayout>
          </ProtectedRoute>
        }
      />
      <Route path="/kyc" element={<RockieLayout><KYCPage /></RockieLayout>} />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <RockieLayout><ProfilePage /></RockieLayout>
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute adminOnly>
            <AdminUsers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users/create"
        element={
          <ProtectedRoute adminOnly>
            <AdminCreateUser />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users/:userId"
        element={
          <ProtectedRoute adminOnly>
            <AdminEditUser />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/kyc"
        element={
          <ProtectedRoute adminOnly>
            <AdminKYCQueue />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/transactions"
        element={
          <ProtectedRoute adminOnly>
            <AdminTransactions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/audit-logs"
        element={
          <ProtectedRoute adminOnly>
            <AdminAuditLogs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute adminOnly>
            <AdminSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/wallet-pool"
        element={
          <ProtectedRoute adminOnly>
            <AdminWalletPool />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/agents"
        element={
          <ProtectedRoute adminOnly>
            <AdminAgents />
          </ProtectedRoute>
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </PageTransition>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <LangProvider>
          <AuthProvider>
            <AppRoutes />
            <Toaster position="top-right" richColors />
          </AuthProvider>
        </LangProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
