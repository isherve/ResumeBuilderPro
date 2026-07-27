import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Upload,
  Shield,
  LayoutTemplate,
  Sparkles,
  TrendingUp,
  FileCheck,
  ArrowDownAZ,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SkeletonCard } from '@/components/ui/skeleton';
import { ImportResumeModal } from '@/components/resume/ImportResumeModal';
import { TemplateCard } from '@/components/templates/TemplateCard';
import { templateService } from '@/services/template.service';
import { resumeService } from '@/services/resume.service';
import { useAuthStore } from '@/store';
import { buildStarterContent } from '@/data/sampleResumeContent';
import { toast } from 'sonner';
import type { Template } from '@/types';

type SortOption = 'popular' | 'name';

export function TemplatesPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState<SortOption>('popular');
  const [creating, setCreating] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['templates', search, category],
    queryFn: () => templateService.getAll({ search, category: category || undefined }),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['template-categories'],
    queryFn: () => templateService.getCategories(),
  });

  const templates = templatesData?.data?.data || [];
  const categories = categoriesData?.data?.data || [];

  const sortedTemplates = useMemo(() => {
    const list = [...templates];
    if (sort === 'name') {
      return list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list.sort((a, b) => b.popularity - a.popularity);
  }, [templates, sort]);

  const featuredTemplates = useMemo(
    () => [...templates].sort((a, b) => b.popularity - a.popularity).slice(0, 4),
    [templates],
  );

  const featuredIds = new Set(featuredTemplates.map((template) => template.id));
  const showFeatured = !search && !category && featuredTemplates.length >= 4;

  const handleUseTemplate = async (template: Template) => {
    setCreating(template.id);
    try {
      const content = buildStarterContent(user, template);
      const { data } = await resumeService.create({
        title: `${template.name} Resume`,
        templateId: template.id,
        theme: template.defaultTheme,
        content,
      });
      toast.success('Resume created with starter content — replace with your details!');
      navigate(`/builder/${data.data.id}`);
    } catch {
      toast.error('Failed to create resume');
    } finally {
      setCreating(null);
    }
  };

  return (
    <div className="min-h-full">
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-primary via-primary to-accent px-6 py-10 text-primary-foreground md:px-10 md:py-14">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-16 top-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        </div>

        <div className="relative mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <Badge className="border-white/20 bg-white/15 text-white hover:bg-white/15">
              <LayoutTemplate className="mr-1 h-3.5 w-3.5" />
              {templates.length || '27'}+ professional templates
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              Choose a template that gets you hired
            </h1>
            <p className="text-base text-white/85 md:text-lg">
              Recruiter-approved designs, ATS-friendly layouts, and one-click customization.
              Start blank or import your existing CV in seconds.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-primary hover:bg-white/90"
                onClick={() => document.getElementById('template-grid')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <Sparkles className="h-4 w-4" /> Browse templates
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                onClick={() => setImportOpen(true)}
              >
                <Upload className="h-4 w-4" /> Import PDF / CV
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:max-w-md">
            {[
              { icon: Shield, label: 'ATS friendly', value: 'Optimized' },
              { icon: TrendingUp, label: 'Used by', value: '10k+ users' },
              { icon: FileCheck, label: 'Export', value: 'PDF ready' },
              { icon: Sparkles, label: 'AI assist', value: 'Built-in' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm"
              >
                <stat.icon className="mb-2 h-5 w-5 text-white/90" />
                <p className="text-lg font-semibold">{stat.value}</p>
                <p className="text-xs text-white/70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        <ImportResumeModal open={importOpen} onClose={() => setImportOpen(false)} />

        {/* Toolbar */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, industry, or style..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-11 pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={sort === 'popular' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSort('popular')}
            >
              <TrendingUp className="h-4 w-4" /> Popular
            </Button>
            <Button
              variant={sort === 'name' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSort('name')}
            >
              <ArrowDownAZ className="h-4 w-4" /> A–Z
            </Button>
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={!category ? 'default' : 'outline'}
            size="sm"
            className="rounded-full"
            onClick={() => setCategory('')}
          >
            All styles
          </Button>
          {categories.map((cat: { name: string; count: number }) => (
            <Button
              key={cat.name}
              variant={category === cat.name ? 'default' : 'outline'}
              size="sm"
              className="rounded-full"
              onClick={() => setCategory(cat.name)}
            >
              {cat.name}
              <span className="ml-1 opacity-60">({cat.count})</span>
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : (
          <>
            {showFeatured && (
              <section className="space-y-4">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold">Featured this week</h2>
                    <p className="text-sm text-muted-foreground">Most popular picks from our community</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                  {featuredTemplates.map((template, index) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      index={index}
                      featured
                      loading={creating === template.id}
                      onUse={handleUseTemplate}
                    />
                  ))}
                </div>
              </section>
            )}

            <section id="template-grid" className="space-y-4">
              <div>
                <h2 className="text-xl font-bold">
                  {category ? `${category} templates` : 'All templates'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {sortedTemplates.length} template{sortedTemplates.length === 1 ? '' : 's'} available
                </p>
              </div>

              {sortedTemplates.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-12 text-center">
                  <LayoutTemplate className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">No templates found</h3>
                  <p className="mt-2 text-muted-foreground">Try a different search or category.</p>
                  <Button variant="outline" className="mt-4" onClick={() => { setSearch(''); setCategory(''); }}>
                    Clear filters
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {(showFeatured
                    ? sortedTemplates.filter((template) => !featuredIds.has(template.id))
                    : sortedTemplates
                  ).map((template, index) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      index={index}
                      loading={creating === template.id}
                      onUse={handleUseTemplate}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Bottom CTA */}
            <section className="rounded-2xl border bg-gradient-to-r from-muted/50 to-muted p-8 text-center md:p-10">
              <h3 className="text-2xl font-bold">Already have a resume?</h3>
              <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
                Upload your PDF or Word CV and we&apos;ll extract your experience, education, and skills
                into any template above.
              </p>
              <Button size="lg" className="mt-6" onClick={() => setImportOpen(true)}>
                <Upload className="h-4 w-4" /> Import existing CV
              </Button>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
