import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { api } from './api';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import ContainersPage from './pages/ContainersPage';
import SchedulesPage from './pages/SchedulesPage';
import ImagesPage from './pages/ImagesPage';
import SettingsPage from './pages/SettingsPage';
import StatsPage from './pages/StatsPage';

/**
 * ProtectedRoute component that redirects to login if the user is not authenticated.
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (!api.isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
};

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(api.isAuthenticated());

    useEffect(() => {
        // Polling to check auth state
        const interval = setInterval(() => {
            setIsAuthenticated(api.isAuthenticated());
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <HashRouter>
            <Routes>
                <Route path="/login" element={<LoginPage onLogin={() => setIsAuthenticated(true)} />} />

                <Route path="/" element={
                    <ProtectedRoute>
                        <Layout>
                            <ContainersPage />
                        </Layout>
                    </ProtectedRoute>
                } />

                <Route path="/schedules" element={
                    <ProtectedRoute>
                        <Layout>
                            <SchedulesPage />
                        </Layout>
                    </ProtectedRoute>
                } />

                <Route path="/images" element={
                    <ProtectedRoute>
                        <Layout>
                            <ImagesPage />
                        </Layout>
                    </ProtectedRoute>
                } />

                <Route path="/settings" element={
                    <ProtectedRoute>
                        <Layout>
                            <SettingsPage />
                        </Layout>
                    </ProtectedRoute>
                } />

                <Route path="/stats" element={
                    <ProtectedRoute>
                        <Layout>
                            <StatsPage />
                        </Layout>
                    </ProtectedRoute>
                } />

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </HashRouter>
    );
}

export default App;
