import { useEffect } from 'react';
import { useAuthStore } from '@/store';
import { authService } from '@/services/auth.service';

export function useAuthInit() {
  const { setUser, setLoading, logout } = useAuthStore();

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await authService.getProfile();
        setUser(data.data);
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [setUser, setLoading, logout]);
}
