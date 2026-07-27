import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, Star, Copy, Trash2, FileText, Plus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SkeletonCard } from '@/components/ui/skeleton';
import { ImportResumeModal } from '@/components/resume/ImportResumeModal';
import { resumeService } from '@/services/resume.service';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import type { Resume } from '@/types';

export function ResumesPage() {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [importOpen, setImportOpen] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['resumes', search, sort],
    queryFn: () => resumeService.getAll({ search, sort }),
  });

  const resumes = data?.data?.data || [];

  const handleDuplicate = async (id: string) => {
    try {
      await resumeService.duplicate(id);
      toast.success('Resume duplicated');
      refetch();
    } catch {
      toast.error('Failed to duplicate');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resume?')) return;
    try {
      await resumeService.delete(id);
      toast.success('Resume deleted');
      refetch();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleFavorite = async (id: string) => {
    try {
      await resumeService.toggleFavorite(id);
      refetch();
    } catch {
      toast.error('Failed to update favorite');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">My Resumes</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4" /> Import CV
          </Button>
          <Button asChild><Link to="/templates"><Plus className="h-4 w-4" /> New Resume</Link></Button>
        </div>
      </div>

      <ImportResumeModal open={importOpen} onClose={() => setImportOpen(false)} />

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search resumes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="downloaded">Most Downloaded</option>
          <option value="favorites">Favorites</option>
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : resumes.length === 0 ? (
        <Card className="p-16 text-center">
          <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No resumes found</h3>
          <p className="text-muted-foreground mb-6">Create your first professional resume or import an existing CV</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4" /> Import CV
            </Button>
            <Button asChild><Link to="/templates">Browse Templates</Link></Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resumes.map((resume: Resume) => (
            <Card key={resume.id} className="group hover:shadow-lg transition-all duration-300">
              <CardContent className="p-0">
                <Link to={`/builder/${resume.id}`} className="block p-6 pb-4">
                  <div className="flex h-32 items-center justify-center rounded-lg bg-gradient-to-br from-primary/5 to-accent/5 mb-4">
                    <FileText className="h-12 w-12 text-primary/40" />
                  </div>
                  <h3 className="font-semibold truncate">{resume.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {resume.template?.name} &middot; {formatDate(resume.updatedAt)}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Badge variant={resume.atsScore >= 70 ? 'success' : 'secondary'}>ATS {resume.atsScore}%</Badge>
                    {resume.downloadCount > 0 && <Badge variant="outline">{resume.downloadCount} downloads</Badge>}
                  </div>
                </Link>
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <button onClick={() => handleFavorite(resume.id)} className="p-1.5 rounded hover:bg-muted" aria-label="Toggle favorite">
                    <Star className={`h-4 w-4 ${resume.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
                  </button>
                  <div className="flex gap-1">
                    <button onClick={() => handleDuplicate(resume.id)} className="p-1.5 rounded hover:bg-muted" aria-label="Duplicate">
                      <Copy className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button onClick={() => handleDelete(resume.id)} className="p-1.5 rounded hover:bg-destructive/10" aria-label="Delete">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
