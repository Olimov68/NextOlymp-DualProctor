import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRouter } from './router';
import { useAuthStore } from './store/useAuthStore';
import { useUserStore } from './store/useUserStore';
import { submissionService } from './services/submissionService';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  const user = useAuthStore(state => state.user);
  useEffect(() => { void useAuthStore.getState().checkAuth(); }, []);
  useEffect(() => {
    submissionService.clearCache();
    if (user?.role === 'admin') void useUserStore.getState().fetchFromApi();
    else useUserStore.getState().resetToDefaults();
  }, [user?.id, user?.role]);
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
