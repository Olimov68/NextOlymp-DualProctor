import { useAuthStore } from '../store/useAuthStore';

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const logout = useAuthStore((state) => state.logout);
  const setRole = useAuthStore((state) => state.setRole);

  const isStudent = user?.role === 'student';
  const isTeacher = user?.role === 'teacher';
  const isAdmin = user?.role === 'admin';

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    isStudent,
    isTeacher,
    isAdmin,
    login,
    register,
    logout,
    setRole,
  };
}
