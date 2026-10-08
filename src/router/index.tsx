import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

import { PublicLayout } from '../layouts/PublicLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { AdminLayout } from '../layouts/AdminLayout';

import { HomePage } from '../pages/public/HomePage';
import { OlympiadListPage } from '../pages/public/OlympiadListPage';
import { OlympiadDetailPage } from '../pages/public/OlympiadDetailPage';
import { LeaderboardPage } from '../pages/public/LeaderboardPage';
import { VerifyCertificatePage } from '../pages/public/VerifyCertificatePage';
import { AboutPage } from '../pages/public/AboutPage';
import { LoginPage } from '../pages/public/LoginPage';
import { RegisterPage } from '../pages/public/RegisterPage';
import { ForgotPasswordPage } from '../pages/public/ForgotPasswordPage';
import { TermsPage } from '../pages/public/TermsPage';
import { PrivacyPage } from '../pages/public/PrivacyPage';
import { RulesPage } from '../pages/public/RulesPage';
import { BaholashPage } from '../pages/public/BaholashPage';
import { ProctorStreamView } from '../pages/public/ProctorStreamView';

import { StudentDashboard } from '../pages/student/StudentDashboard';
import { StudentProfilePage } from '../pages/student/StudentProfilePage';
import { StudentResultsPage } from '../pages/student/StudentResultsPage';
import { StudentCertificatesPage } from '../pages/student/StudentCertificatesPage';
import { StudentOlympiadsPage } from '../pages/student/StudentOlympiadsPage';
import { StudentLeaderboardPage } from '../pages/student/StudentLeaderboardPage';
import { StudentLevelTestPage } from '../pages/student/StudentLevelTestPage';
import { StudentSupportPage } from '../pages/student/StudentSupportPage';
import { ContestParticipatePage } from '../pages/student/ContestParticipatePage';
import { ExamDiagnosticPage } from '../pages/student/ExamDiagnosticPage';

import { TeacherDashboard } from '../pages/teacher/TeacherDashboard';
import { TeacherOlympiadsPage } from '../pages/teacher/TeacherOlympiadsPage';

import { MilliySertifikatDashboardPage } from '../pages/dashboard/MilliySertifikatDashboardPage';

import { EgaLoginPage } from '../pages/ega/EgaLoginPage';
import { EgaDashboardPage } from '../pages/ega/EgaDashboardPage';
import { EgaCompetitionsPage } from '../pages/ega/EgaCompetitionsPage';
import { EgaSingleCompetitionPage } from '../pages/ega/EgaSingleCompetitionPage';
import { EgaLeaderboardPage } from '../pages/ega/EgaLeaderboardPage';
import { EgaSubjectsPage } from '../pages/ega/EgaSubjectsPage';
import { EgaUsersPage } from '../pages/ega/EgaUsersPage';
import { EgaCertificatesPage } from '../pages/ega/EgaCertificatesPage';
import { EgaFinancePage } from '../pages/ega/EgaFinancePage';
import { EgaTeamPage } from '../pages/ega/EgaTeamPage';
import { EgaLocationsPage } from '../pages/ega/EgaLocationsPage';
import { EgaNotificationsPage } from '../pages/ega/EgaNotificationsPage';
import { EgaSupportPage } from '../pages/ega/EgaSupportPage';
import { EgaPackagesPage } from '../pages/ega/EgaPackagesPage';
import { EgaSecurityPage } from '../pages/ega/EgaSecurityPage';
import { EgaBaholashPage } from '../pages/ega/EgaBaholashPage';
import { EgaLevelTestsPage } from '../pages/ega/EgaLevelTestsPage';

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/olympiads" element={<OlympiadListPage />} />
        <Route path="/olympiads/:id" element={<OlympiadDetailPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/verify-certificate" element={<VerifyCertificatePage />} />
        <Route path="/verify-certificate/:code" element={<VerifyCertificatePage />} />
        <Route path="/verify/:code" element={<VerifyCertificatePage />} />
        <Route path="/about" element={<AboutPage />} />

        
        <Route path="/baholash" element={<Navigate to="/dashboard/milliy-sertifikat" replace />} />
        <Route path="/rash-modul" element={<Navigate to="/dashboard/milliy-sertifikat" replace />} />

        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/rules" element={<RulesPage />} />

        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      
      <Route
        element={
          <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<StudentDashboard />} />
        <Route path="/profile" element={<StudentProfilePage />} />
        <Route path="/results" element={<StudentResultsPage />} />
        <Route path="/certificates" element={<StudentCertificatesPage />} />
        <Route path="/student/olympiads" element={<StudentOlympiadsPage />} />
        <Route path="/student/level-test" element={<StudentLevelTestPage />} />
        <Route path="/student/leaderboard" element={<StudentLeaderboardPage />} />
        <Route path="/student/support" element={<StudentSupportPage />} />
        
        
        <Route path="/dashboard/milliy-sertifikat" element={<MilliySertifikatDashboardPage />} />
        <Route path="/dashboard/baholash" element={<Navigate to="/dashboard/milliy-sertifikat" replace />} />
        
        
        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        <Route path="/teacher/olympiads" element={<TeacherOlympiadsPage />} />
      </Route>

      
      <Route
        path="/olympiads/:id/diagnostic"
        element={
          <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
            <ExamDiagnosticPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/olympiads/:id/participate"
        element={
          <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
            <ContestParticipatePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/olympiads/:id/participate"
        element={
          <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
            <ContestParticipatePage />
          </ProtectedRoute>
        }
      />

      
      <Route path="/proctor/stream" element={<ProctorStreamView />} />

      
      <Route path="/ega/login" element={<EgaLoginPage />} />
      <Route path="/admin/login" element={<EgaLoginPage />} />

      <Route
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/ega" element={<EgaDashboardPage />} />
        <Route path="/ega/competitions" element={<EgaCompetitionsPage />} />
        <Route path="/ega/competitions/:id" element={<EgaSingleCompetitionPage />} />
        <Route path="/ega/olympiads" element={<EgaCompetitionsPage />} />
        <Route path="/ega/level-tests" element={<EgaLevelTestsPage />} />
        <Route path="/ega/users" element={<EgaUsersPage />} />
        <Route path="/ega/proctoring" element={<Navigate to="/ega" replace />} />
        <Route path="/ega/leaderboard" element={<EgaLeaderboardPage />} />
        <Route path="/ega/ratings" element={<EgaLeaderboardPage />} />
        <Route path="/ega/subjects" element={<EgaSubjectsPage />} />
        <Route path="/ega/locations" element={<EgaLocationsPage />} />
        <Route path="/ega/team" element={<EgaTeamPage />} />
        <Route path="/ega/certificates" element={<EgaCertificatesPage />} />
        <Route path="/ega/finance" element={<EgaFinancePage />} />
        <Route path="/ega/payments" element={<EgaFinancePage />} />
        <Route path="/ega/notifications" element={<EgaNotificationsPage />} />
        <Route path="/ega/support" element={<EgaSupportPage />} />
        <Route path="/ega/packages" element={<EgaPackagesPage />} />
        <Route path="/ega/security" element={<EgaSecurityPage />} />
        <Route path="/ega/settings" element={<EgaSecurityPage />} />

        
        <Route path="/ega/baholash" element={<EgaBaholashPage />} />
        <Route path="/ega/baholash/rubric" element={<EgaBaholashPage />} />
      </Route>

      
      <Route path="/admin" element={<Navigate to="/ega" replace />} />
      <Route path="/admin/*" element={<Navigate to="/ega" replace />} />

      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;
