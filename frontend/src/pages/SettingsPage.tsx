import { Moon, Sun, Monitor } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useThemeStore } from '@/store';

export function SettingsPage() {
  const { theme, setTheme } = useThemeStore();

  const themes = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
    { value: 'system' as const, label: 'System', icon: Monitor },
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize how ResumeBuilder Pro looks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {themes.map((t) => (
              <Button
                key={t.value}
                variant={theme === t.value ? 'default' : 'outline'}
                className="flex flex-col h-auto py-4 gap-2"
                onClick={() => setTheme(t.value)}
              >
                <t.icon className="h-5 w-5" />
                {t.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Manage your notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: 'Email notifications', desc: 'Receive updates via email' },
            { label: 'Autosave notifications', desc: 'Show toast when resume is saved' },
            { label: 'Reminders', desc: 'Get reminders to update your resume' },
          ].map((item) => (
            <label key={item.label} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded" />
            </label>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privacy</CardTitle>
          <CardDescription>Control your data and privacy settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Public profile</p>
              <p className="text-xs text-muted-foreground">Allow others to view your profile</p>
            </div>
            <input type="checkbox" className="rounded" />
          </label>
          <label className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Analytics</p>
              <p className="text-xs text-muted-foreground">Help improve our service with usage data</p>
            </div>
            <input type="checkbox" defaultChecked className="rounded" />
          </label>
        </CardContent>
      </Card>
    </div>
  );
}
