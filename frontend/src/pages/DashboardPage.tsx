import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus, FileText, Download, TrendingUp, Sparkles, User,
  ArrowRight, Star, Clock, Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import { ImportResumeModal } from '@/components/resume/ImportResumeModal';
import { dashboardService } from '@/services/template.service';
import { formatDate } from '@/lib/utils';
import type { DashboardData, Resume, Activity } from '@/types';

export function DashboardPage() {
  const [importOpen, setImportOpen] = useState(false);
  const { data, isLoading } = useQuery<{ data: { data: DashboardData } }>({
    queryKey: ['dashboard'],
    queryFn: () => dashboardService.getDashboard(),
  });

  const dashboard = data?.data?.data;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  const stats = dashboard?.stats;

  const statCards = [
    { label: 'Total Resumes', value: stats?.totalResumes || 0, icon: FileText, color: 'text-blue-500' },
    { label: 'Downloads', value: stats?.totalDownloads || 0, icon: Download, color: 'text-green-500' },
    { label: 'ATS Score', value: `${stats?.avgAtsScore || 0}%`, icon: TrendingUp, color: 'text-purple-500' },
    { label: 'AI Uses', value: stats?.aiUsageCount || 0, icon: Sparkles, color: 'text-amber-500' },
  ];

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            Welcome back, {dashboard?.user?.name?.split(' ')[0] || 'there'}!
          </h1>
          <p className="text-muted-foreground mt-1">Here&apos;s an overview of your resume activity.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="h-5 w-5" /> Import CV
          </Button>
          <Button asChild size="lg">
            <Link to="/templates"><Plus className="h-5 w-5" /> Create Resume</Link>
          </Button>
        </div>
      </div>

      <ImportResumeModal open={importOpen} onClose={() => setImportOpen(false)} />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="glass">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-muted ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Resumes */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Resumes</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/resumes">View all <ArrowRight className="h-4 w-4 ml-1" /></Link>
            </Button>
          </div>
          {dashboard?.recentResumes?.length ? (
            <div className="space-y-3">
              {dashboard.recentResumes.map((resume: Resume) => (
                <Link key={resume.id} to={`/builder/${resume.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="flex items-center gap-4 py-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{resume.title}</p>
                          {resume.isFavorite && <Star className="h-4 w-4 fill-amber-400 text-amber-400" />}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {resume.template?.name} &middot; Updated {formatDate(resume.updatedAt)}
                        </p>
                      </div>
                      <Badge variant={resume.atsScore >= 70 ? 'success' : 'secondary'}>
                        ATS {resume.atsScore}%
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No resumes yet. Create your first one!</p>
              <Button asChild><Link to="/templates">Browse Templates</Link></Button>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Profile Completion */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" /> Profile Completion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold">{stats?.profileCompletion || 0}%</span>
                <Badge variant="secondary">{stats?.plan || 'FREE'}</Badge>
              </div>
              <Progress value={stats?.profileCompletion || 0} />
              <Button variant="outline" size="sm" className="w-full mt-4" asChild>
                <Link to="/profile">Complete Profile</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {[
                { to: '/templates', label: 'New Resume', icon: Plus },
                { to: '/ai-tools', label: 'AI Tools', icon: Sparkles },
                { to: '/templates', label: 'Browse Templates', icon: FileText },
              ].map((action) => (
                <Button key={action.label} variant="ghost" className="w-full justify-start" asChild>
                  <Link to={action.to}><action.icon className="h-4 w-4 mr-2" />{action.label}</Link>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Clock className="h-5 w-5" /> Recent Activity</CardTitle></CardHeader>
            <CardContent>
              {dashboard?.recentActivity?.length ? (
                <div className="space-y-3">
                  {dashboard.recentActivity.slice(0, 5).map((activity: Activity) => (
                    <div key={activity.id} className="flex items-start gap-3 text-sm">
                      <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                      <div>
                        <p className="font-medium capitalize">{activity.type.replace(/_/g, ' ').toLowerCase()}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(activity.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
