import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import TeacherDashboard from './pages/dashboards/TeacherDashboard';
import StudentDashboard from './pages/dashboards/StudentDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuthStore } from './store/auth'; // ✅ 추가

function App() {
  const token = useAuthStore((s) => s.token); // ✅ 추가: 최신 토큰 읽기

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login/:role" element={<LoginPage />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['admin']}>
              {/* ✅ 토큰 기준으로 강제 리마운트 */}
              <AdminDashboard key={token ?? 'no-token'} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher"
          element={
            <ProtectedRoute roles={['teacher']}>
              <TeacherDashboard key={token ?? 'no-token'} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student"
          element={
            <ProtectedRoute roles={['student']}>
              <StudentDashboard key={token ?? 'no-token'} />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;