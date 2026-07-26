import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { aiService } from '@/services/template.service';
import type { ResumeContent } from '@/types';
import { toast } from 'sonner';

interface EditorProps {
  content: ResumeContent;
  updateContent: (updater: (prev: ResumeContent) => ResumeContent) => void;
}

export function SummaryEditor({ content, updateContent }: EditorProps) {
  const generateSummary = async () => {
    try {
      const { data } = await aiService.generateSummary({
        jobTitle: content.personalInfo?.jobTitle || 'Professional',
        experience: content.experience?.map((e) => `${e.jobTitle} at ${e.company}`).join(', ') || '',
        skills: [
          ...(content.skills?.technical?.map((s) => s.name) || []),
          ...(content.skills?.soft?.map((s) => s.name) || []),
        ],
      });
      updateContent((prev) => ({ ...prev, summary: data.data.summary }));
      toast.success('Summary generated!');
    } catch {
      toast.error('AI generation failed. Check your API key.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Professional Summary</label>
        <Button variant="outline" size="sm" onClick={generateSummary}>
          <Sparkles className="h-4 w-4" /> AI Generate
        </Button>
      </div>
      <textarea
        value={content.summary || ''}
        onChange={(e) => updateContent((prev) => ({ ...prev, summary: e.target.value }))}
        rows={6}
        className="w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        placeholder="Write a compelling professional summary..."
      />
    </div>
  );
}
