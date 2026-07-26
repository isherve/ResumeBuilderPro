import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Crown, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SkeletonCard } from '@/components/ui/skeleton';
import { templateService } from '@/services/template.service';
import { resumeService } from '@/services/resume.service';
import { toast } from 'sonner';
import type { Template } from '@/types';

export function TemplatesPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [creating, setCreating] = useState<string | null>(null);
  const navigate = useNavigate();

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

  const handleUseTemplate = async (template: Template) => {
    setCreating(template.id);
    try {
      const { data } = await resumeService.create({
        title: `${template.name} Resume`,
        templateId: template.id,
        theme: template.defaultTheme,
      });
      toast.success('Resume created!');
      navigate(`/builder/${data.data.id}`);
    } catch {
      toast.error('Failed to create resume');
    } finally {
      setCreating(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Resume Templates</h1>
        <p className="text-muted-foreground mt-1">Choose from {templates.length}+ professional templates</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search templates..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        <Button variant={!category ? 'default' : 'outline'} size="sm" onClick={() => setCategory('')}>All</Button>
        {categories.map((cat: { name: string; count: number }) => (
          <Button key={cat.name} variant={category === cat.name ? 'default' : 'outline'} size="sm" onClick={() => setCategory(cat.name)}>
            {cat.name} ({cat.count})
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {templates.map((template: Template, i: number) => (
            <motion.div key={template.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="relative h-48 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                  <div className="text-6xl font-bold text-primary/20">{template.name[0]}</div>
                  {template.isPremium && (
                    <Badge variant="premium" className="absolute top-3 right-3">
                      <Crown className="h-3 w-3 mr-1" /> Premium
                    </Badge>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button onClick={() => handleUseTemplate(template)} loading={creating === template.id}>
                      Use Template
                    </Button>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold">{template.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{template.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <Badge variant="outline">{template.category}</Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Star className="h-3 w-3" /> {template.popularity}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
