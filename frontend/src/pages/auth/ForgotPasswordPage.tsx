import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { authService } from '@/services/auth.service';
import { toast } from 'sonner';

const schema = z.object({ email: z.string().email('Invalid email address') });

export function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<{ email: string }>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: { email: string }) => {
    setLoading(true);
    try {
      await authService.forgotPassword(data.email);
      setSent(true);
      toast.success('Reset link sent if email exists');
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md glass">
        <CardHeader className="text-center">
          <CardTitle>Forgot Password</CardTitle>
          <CardDescription>
            {sent ? 'Check your email for a reset link' : 'Enter your email to receive a reset link'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!sent ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-[38px] h-4 w-4 text-muted-foreground" />
                <Input {...register('email')} label="Email" type="email" className="pl-10" error={errors.email?.message} />
              </div>
              <Button type="submit" className="w-full" loading={loading}>Send Reset Link</Button>
            </form>
          ) : (
            <Button className="w-full" asChild><Link to="/login">Back to Login</Link></Button>
          )}
          <Link to="/login" className="flex items-center gap-2 text-sm text-muted-foreground mt-4 hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to login
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
