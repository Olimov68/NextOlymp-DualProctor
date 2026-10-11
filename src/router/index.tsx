import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

import { PublicLayout } from '../layouts/PublicLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { AdminLayout } from '../layouts/AdminLayout';

import { HomePage } from '../pages/public/HomePage';
const OlympiadListPage = React.lazy(() => import('../pages/public/OlympiadListPage').then(module => ({ default: module.OlympiadListPage })));
const OlympiadDetailPage = React.lazy(() => import('../pages/public/OlympiadDetailPage').then(module => ({ default: module.OlympiadDetailPage })));
const LeaderboardPage = React.lazy(() => import('../pages/public/LeaderboardPage').then(module => ({ default: module.LeaderboardPage })));
const VerifyCertificatePage = React.lazy(() => import('../pages/public/VerifyCertificatePage').then(module => ({ default: module.VerifyCertificatePage })));
const AboutPage = React.lazy(() => import('../pages/public/AboutPage').then(module => ({ default: module.AboutPage })));
const LoginPage = React.lazy(() => import('../pages/public/LoginPage').then(module => ({ default: module.LoginPage })));
const RegisterPage = React.lazy(() => import('../pages/public/RegisterPage').then(module => ({ default: module.RegisterPage })));
const ForgotPasswordPage = React.lazy(() => import('../pages/public/ForgotPasswordPage').then(module => ({ default: module.ForgotPasswordPage })));
const TermsPage = React.lazy(() => import('../pages/public/TermsPage').then(module => ({ default: module.TermsPage })));
const PrivacyPage = React.lazy(() => import('../pages/public/PrivacyPage').then(module => ({ default: module.PrivacyPage })));
const RulesPage = React.lazy(() => import('../pages/public/RulesPage').then(module => ({ default: module.RulesPage })));
const ProctorStreamView = React.lazy(() => import('../pages/public/ProctorStreamView').then(module => ({ default: module.ProctorStreamView })));

const StudentDashboard = React.lazy(() => import('../pages/student/StudentDashboard').then(module => ({ default: module.StudentDashboard })));
const StudentProfilePage = React.lazy(() => import('../pages/student/StudentProfilePage').then(module => ({ default: module.StudentProfilePage })));
const StudentResultsPage = React.lazy(() => import('../pages/student/StudentResultsPage').then(module => ({ default: module.StudentResultsPage })));
const StudentCertificatesPage = React.lazy(() => import('../pages/student/StudentCertificatesPage').then(module => ({ default: module.StudentCertificatesPage })));
const StudentOlympiadsPage = React.lazy(() => import('../pages/student/StudentOlympiadsPage').then(module => ({ default: module.StudentOlympiadsPage })));
const StudentLeaderboardPage = React.lazy(() => import('../pages/student/StudentLeaderboardPage').then(module => ({ default: module.StudentLeaderboardPage })));
const PracticeLibraryPage = React.lazy(() => import('../pages/student/PracticeLibraryPage').then(module => ({ default: module.PracticeLibraryPage })));
const SharedExamAdminPage = React.lazy(() => import('../pages/ega/SharedExamAdminPage').then(module => ({ default: module.SharedExamAdminPage })));
const StudentSupportPage = React.lazy(() => import('../pages/student/StudentSupportPage').then(module => ({ default: module.StudentSupportPage })));
const ContestParticipatePage = React.lazy(() => import('../pages/student/ContestParticipatePage').then(module => ({ default: module.ContestParticipatePage })));
const ExamDiagnosticPage = React.lazy(() => import('../pages/student/ExamDiagnosticPage').then(module => ({ default: module.ExamDiagnosticPage })));

const TeacherDashboard = React.lazy(() => import('../pages/teacher/TeacherDashboard').then(module => ({ default: module.TeacherDashboard })));
const TeacherOlympiadsPage = React.lazy(() => import('../pages/teacher/TeacherOlympiadsPage').then(module => ({ default: module.TeacherOlympiadsPage })));


const EgaLoginPage = React.lazy(() => import('../pages/ega/EgaLoginPage').then(module => ({ default: module.EgaLoginPage })));
const EgaDashboardPage = React.lazy(() => import('../pages/ega/EgaDashboardPage').then(module => ({ default: module.EgaDashboardPage })));
const EgaLeaderboardPage = React.lazy(() => import('../pages/ega/EgaLeaderboardPage').then(module => ({ default: module.EgaLeaderboardPage })));
const EgaSubjectsPage = React.lazy(() => import('../pages/ega/EgaSubjectsPage').then(module => ({ default: module.EgaSubjectsPage })));
const EgaUsersPage = React.lazy(() => import('../pages/ega/EgaUsersPage').then(module => ({ default: module.EgaUsersPage })));
const EgaCertificatesPage = React.lazy(() => import('../pages/ega/EgaCertificatesPage').then(module => ({ default: module.EgaCertificatesPage })));
const EgaTeamPage = React.lazy(() => import('../pages/ega/EgaTeamPage').then(module => ({ default: module.EgaTeamPage })));
const EgaLocationsPage = React.lazy(() => import('../pages/ega/EgaLocationsPage').then(module => ({ default: module.EgaLocationsPage })));
const EgaNotificationsPage = React.lazy(() => import('../pages/ega/EgaNotificationsPage').then(module => ({ default: module.EgaNotificationsPage })));
const EgaSupportPage = React.lazy(() => import('../pages/ega/EgaSupportPage').then(module => ({ default: module.EgaSupportPage })));
const EgaSecurityPage = React.lazy(() => import('../pages/ega/EgaSecurityPage').then(module => ({ default: module.EgaSecurityPage })));

export const AppRouter: React.FC = () => {
  return (
    <React.Suspense fallback={<div role="status" className="p-8 text-center">Sahifa yuklanmoqda…</div>}>
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
        <Route path="/student/level-test" element={<PracticeLibraryPage />} />
        <Route path="/student/practice" element={<PracticeLibraryPage />} />
        <Route path="/student/leaderboard" element={<StudentLeaderboardPage />} />
        <Route path="/student/support" element={<StudentSupportPage />} />
        
        
        <Route path="/dashboard/milliy-sertifikat" element={<PracticeLibraryPage key="national" nationalOnly />} />
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
        <Route path="/ega/competitions" element={<SharedExamAdminPage key="olympiad" kind="olympiad" />} />
        <Route path="/ega/competitions/:id" element={<SharedExamAdminPage key="olympiad-direct" kind="olympiad" />} />
        <Route path="/ega/olympiads" element={<SharedExamAdminPage key="olympiad" kind="olympiad" />} />
        <Route path="/ega/level-tests" element={<SharedExamAdminPage key="level" kind="level_test" />} />
        <Route path="/ega/users" element={<EgaUsersPage />} />
        <Route path="/ega/proctoring" element={<Navigate to="/ega" replace />} />
        <Route path="/ega/leaderboard" element={<EgaLeaderboardPage />} />
        <Route path="/ega/ratings" element={<EgaLeaderboardPage />} />
        <Route path="/ega/subjects" element={<EgaSubjectsPage />} />
        <Route path="/ega/locations" element={<EgaLocationsPage />} />
        <Route path="/ega/team" element={<EgaTeamPage />} />
        <Route path="/ega/certificates" element={<EgaCertificatesPage />} />

        <Route path="/ega/notifications" element={<EgaNotificationsPage />} />
        <Route path="/ega/support" element={<EgaSupportPage />} />
        <Route path="/ega/security" element={<EgaSecurityPage />} />
        <Route path="/ega/settings" element={<EgaSecurityPage />} />

        
        <Route path="/ega/baholash" element={<SharedExamAdminPage key="national" kind="national_certificate" />} />
        <Route path="/ega/baholash/rubric" element={<Navigate to="/ega/baholash" replace />} />
      </Route>

      
      <Route path="/admin" element={<Navigate to="/ega" replace />} />
      <Route path="/admin/*" element={<Navigate to="/ega" replace />} />

      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </React.Suspense>
  );
};

export default AppRouter;
