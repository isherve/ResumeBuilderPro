import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { authService } from '@/services/auth.service';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    const refresh = searchParams.get('refresh');

    if (token && refresh) {
      localStorage.setItem('accessToken', token);
      localStorage.setItem('refreshToken', refresh);

      authService.getProfile()
        .then(({ data }) => {
          setUser(data.data);
          toast.success('Signed in with Google!');
          navigate('/dashboard');
        })
        .catch(() => {
          toast.error('Authentication failed');
          navigate('/login');
        });
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="space-y-4 w-64">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <p className="text-sm text-muted-foreground text-center">Completing sign in...</p>
      </div>
    </div>
  );
}
