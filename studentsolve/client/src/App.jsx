import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import RoadmapPage from './pages/RoadmapPage.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import OnboardingPage from './pages/OnboardingPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import TutorPage from './pages/TutorPage.jsx';
import EssayMarkerPage from './pages/EssayMarkerPage.jsx';
import NotesPage from './pages/NotesPage.jsx';
import FlashcardsPage from './pages/FlashcardsPage.jsx';
import QuickfirePage from './pages/QuickfirePage.jsx';
import SavedPage from './pages/SavedPage.jsx';
import RevisionTimetablePage from './pages/RevisionTimetablePage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';


export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/roadmap" element={<RoadmapPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/tutor" element={<TutorPage />} />
            <Route path="/essay-marker" element={<EssayMarkerPage />} />
            <Route path="/notes" element={<NotesPage />} />
            <Route path="/flashcards" element={<FlashcardsPage />} />
            <Route path="/quickfire" element={<QuickfirePage />} />
            <Route path="/saved" element={<SavedPage />} />
            <Route path="/revision-timetable" element={<RevisionTimetablePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}