import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import WeatherImpact from './pages/WeatherImpact';
import CarbonFootprint from './pages/CarbonFootprint';
import RecyclingSorter from './pages/RecyclingSorter';
import EnergyOptimizer from './pages/EnergyOptimizer';
import WaterQuality from './pages/WaterQuality';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import SearchResults from './pages/SearchResults';
import Notifications from './pages/Notifications';
import ForgotPassword from './pages/ForgotPassword';
import AdminPanel from './pages/AdminPanel';
import Contact from './pages/Contact';
import Feedback from './pages/Feedback';
import AIResults from './pages/AIResults';
import AIInsights from './pages/AIInsights';
import AIBacklog from './pages/AIBacklog';
import Goals from './pages/Goals';
import MapView from './pages/MapView';
import PdfReports from './pages/PdfReports';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import OnboardingTour from './components/OnboardingTour';

import Batch03Features from './pages/Batch03Features';

interface User {
  id: number;
  email: string;
  name: string;
  role?: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData: User, token: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading AI Environment Monitor...</p>
      </div>
    );
  }

  return (
    <div className="App">
      {user && <OnboardingTour />}
      <a href="#main-content" className="skip-to-content">Skip to content</a>
      <Routes>
          <Route path="/batch03" element={<Batch03Features />} />
        <Route
          path="/login"
          element={
            user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />
          }
        />
        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />
        <Route
          path="/privacy"
          element={<PrivacyPolicy />}
        />
        <Route
          path="/terms"
          element={<TermsOfService />}
        />
        <Route
          path="/dashboard"
          element={
            user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/weather"
          element={
            user ? <WeatherImpact user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/carbon"
          element={
            user ? <CarbonFootprint user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/recycling"
          element={
            user ? <RecyclingSorter user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/energy"
          element={
            user ? <EnergyOptimizer user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/water"
          element={
            user ? <WaterQuality user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/profile"
          element={
            user ? <Profile user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/settings"
          element={
            user ? <Settings user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/search"
          element={
            user ? <SearchResults user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/notifications"
          element={
            user ? <Notifications user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/admin"
          element={
            user ? <AdminPanel user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/contact"
          element={
            user ? <Contact user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/feedback"
          element={
            user ? <Feedback user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/ai-results"
          element={
            user ? <AIResults user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/ai-insights"
          element={
            user ? <AIInsights user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/ai-backlog"
          element={
            user ? <AIBacklog user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/goals"
          element={
            user ? <Goals user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/map"
          element={
            user ? <MapView user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/reports"
          element={
            user ? <PdfReports user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
          }
        />
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      </Routes>
    </div>
  );
}

export default App;
