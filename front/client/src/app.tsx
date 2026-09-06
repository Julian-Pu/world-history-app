import React, { useEffect } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';

import Layout from './components/Layout';
import NotFound from './pages/NotFound/NotFound';
import HomePage from './pages/Home/HomePage';
import TimelinePage from './pages/Timeline/TimelinePage';
import EventDetailPage from './pages/EventDetail/EventDetailPage';
import FigureDetailPage from './pages/FigureDetail/FigureDetailPage';
import HistoryMapPage from './pages/HistoryMap/HistoryMapPage';
import QuizListPage from './pages/QuizList/QuizListPage';
import QuizPlayPage from './pages/QuizPlay/QuizPlayPage';
import QuizResultPage from './pages/QuizResult/QuizResultPage';
import WrongBookPage from './pages/WrongBook/WrongBookPage';
import NotesPage from './pages/Notes/NotesPage';
import NoteEditorPage from './pages/NoteEditor/NoteEditorPage';
import SearchPage from './pages/Search/SearchPage';
import ProfilePage from './pages/Profile/ProfilePage';
import SettingsPage from './pages/Settings/SettingsPage';
import AuthPage from './pages/Auth/AuthPage';
import WelcomePage from './pages/Welcome/WelcomePage';
import PersonNetworkPage from './pages/PersonNetwork/PersonNetworkPage';

const AppInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useAppStore((s) => s.theme);
  const fontSize = useAppStore((s) => s.fontSize);
  const setTheme = useAppStore((s) => s.setTheme);
  const setFontSize = useAppStore((s) => s.setFontSize);

  useEffect(() => {
    setTheme(theme);
    setFontSize(fontSize);

    const welcomeShown = localStorage.getItem('welcome-shown');
    if (!welcomeShown && location.pathname !== '/welcome') {
      navigate('/welcome', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
};

const RoutesComponent = () => {
  return (
    <AppInitializer>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="timeline" element={<TimelinePage />} />
          <Route path="event/:id" element={<EventDetailPage />} />
          <Route path="figure/:id" element={<FigureDetailPage />} />
          <Route path="map" element={<HistoryMapPage />} />
          <Route path="quiz" element={<QuizListPage />} />
          <Route path="quiz/play" element={<QuizPlayPage />} />
          <Route path="quiz/result" element={<QuizResultPage />} />
          <Route path="quiz/wrong" element={<WrongBookPage />} />
          <Route path="notes" element={<NotesPage />} />
          <Route path="notes/edit" element={<NoteEditorPage />} />
          <Route path="notes/edit/:id" element={<NoteEditorPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="auth" element={<AuthPage />} />
          <Route path="welcome" element={<WelcomePage />} />
          <Route path="person-network" element={<PersonNetworkPage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppInitializer>
  );
};

export default RoutesComponent;
