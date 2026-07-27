import { Crown, Eye, Sparkles, Star, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ResumePreview } from '@/components/resume/ResumePreview';
import { previewSampleContent } from '@/data/sampleResumeContent';
import type { Template } from '@/types';

interface TemplateCardProps {
  template: Template;
  index?: number;
  featured?: boolean;
  loading?: boolean;
  onUse: (template: Template) => void;
}

export function TemplateCard({ template, index = 0, featured = false, loading, onUse }: TemplateCardProps) {
  const isPopular = template.popularity >= 900;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
    >
      <Card
        className={`group overflow-hidden border-border/60 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl ${
          featured ? 'ring-2 ring-primary/20 shadow-lg' : ''
        }`}
      >
        <div className="relative h-56 overflow-hidden bg-slate-100 sm:h-60">
          <div className="absolute inset-0 flex justify-center overflow-hidden pt-1">
            <div className="pointer-events-none origin-top scale-[0.26]">
              <ResumePreview
                content={previewSampleContent}
                theme={template.defaultTheme}
                layout={template.layout}
              />
            </div>
          </div>

          {template.isPremium && (
            <Badge variant="premium" className="absolute left-3 top-3 z-10 shadow-sm">
              <Crown className="mr-1 h-3 w-3" /> Premium
            </Badge>
          )}

          {isPopular && !template.isPremium && (
            <Badge className="absolute left-3 top-3 z-10 border-0 bg-amber-500/90 text-white shadow-sm">
              <Sparkles className="mr-1 h-3 w-3" /> Popular
            </Badge>
          )}

          {featured && (
            <Badge className="absolute right-3 top-3 z-10 border-0 bg-primary text-primary-foreground shadow-sm">
              Featured
            </Badge>
          )}

          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-slate-950/70 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100">
            <Button
              size="lg"
              className="min-w-[150px] shadow-lg"
              onClick={() => onUse(template)}
              loading={loading}
            >
              <Zap className="h-4 w-4" /> Use Template
            </Button>
            <span className="flex items-center gap-1 text-xs text-white/80">
              <Eye className="h-3.5 w-3.5" /> Free to customize
            </span>
          </div>
        </div>

        <CardContent className="space-y-3 p-4">
          <div>
            <h3 className="font-semibold tracking-tight">{template.name}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{template.description}</p>
          </div>

          <div className="flex items-center justify-between gap-2">
            <Badge variant="outline" className="truncate font-normal">
              {template.category}
            </Badge>
            <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {template.popularity.toLocaleString()}
            </span>
          </div>

          {template.tags?.includes('ats') && (
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">ATS optimized</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
