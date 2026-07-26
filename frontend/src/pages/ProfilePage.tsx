import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Camera, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useAuthStore } from '@/store';
import { authService } from '@/services/auth.service';
import { uploadService } from '@/services/template.service';
import { getInitials } from '@/lib/utils';
import { toast } from 'sonner';

export function ProfilePage() {
  const { user, setUser, logout } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit } = useForm({
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      address: user?.address || '',
      website: user?.website || '',
      linkedin: user?.linkedin || '',
      github: user?.github || '',
      portfolio: user?.portfolio || '',
    },
  });

  const onSubmit = async (data: Record<string, string>) => {
    setLoading(true);
    try {
      const response = await authService.updateProfile(data);
      setUser(response.data.data);
      toast.success('Profile updated');
    } catch {
      toast.error('Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { data } = await uploadService.uploadAvatar(file);
      const profile = await authService.getProfile();
      setUser(profile.data.data);
      toast.success('Avatar updated');
    } catch {
      toast.error('Upload failed');
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure? This action cannot be undone.')) return;
    try {
      await authService.deleteAccount();
      logout();
      toast.success('Account deleted');
    } catch {
      toast.error('Failed to delete account');
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>

      <Card className="glass">
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="text-lg">{getInitials(user?.name || 'U')}</AvatarFallback>
              </Avatar>
              <label className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-white cursor-pointer hover:bg-primary/90">
                <Camera className="h-4 w-4" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </label>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{user?.name}</h2>
              <p className="text-muted-foreground">{user?.email}</p>
              <div className="mt-3">
                <div className="flex justify-between text-sm mb-1">
                  <span>Profile Completion</span>
                  <span>{user?.profileCompletion || 0}%</span>
                </div>
                <Progress value={user?.profileCompletion || 0} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Full Name" {...register('name')} />
            <Input label="Phone" {...register('phone')} />
            <Input label="Address" {...register('address')} />
            <Input label="Website" {...register('website')} />
            <Input label="LinkedIn" {...register('linkedin')} />
            <Input label="GitHub" {...register('github')} />
            <Input label="Portfolio" {...register('portfolio')} />
            <Button type="submit" loading={loading}><Save className="h-4 w-4" /> Save Changes</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader><CardTitle className="text-destructive">Danger Zone</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">Permanently delete your account and all associated data.</p>
          <Button variant="destructive" onClick={handleDeleteAccount}>
            <Trash2 className="h-4 w-4" /> Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
