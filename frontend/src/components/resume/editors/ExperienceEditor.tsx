import { Plus, Trash2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { generateId } from '@/lib/utils';
import { aiService } from '@/services/template.service';
import type { ResumeContent, Experience } from '@/types';
import { toast } from 'sonner';

interface EditorProps {
  content: ResumeContent;
  updateContent: (updater: (prev: ResumeContent) => ResumeContent) => void;
}

export function ExperienceEditor({ content, updateContent }: EditorProps) {
  const experiences = content.experience || [];

  const addExperience = () => {
    const newExp: Experience = {
      id: generateId(),
      jobTitle: '',
      company: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      responsibilities: [''],
    };
    updateContent((prev) => ({
      ...prev,
      experience: [...(prev.experience || []), newExp],
    }));
  };

  const updateExp = (id: string, field: keyof Experience, value: unknown) => {
    updateContent((prev) => ({
      ...prev,
      experience: prev.experience?.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    }));
  };

  const removeExp = (id: string) => {
    updateContent((prev) => ({
      ...prev,
      experience: prev.experience?.filter((e) => e.id !== id),
    }));
  };

  const improveBullet = async (expId: string, bulletIndex: number, bullet: string) => {
    try {
      const { data } = await aiService.improveBullet(bullet, content.personalInfo?.jobTitle);
      const exp = experiences.find((e) => e.id === expId);
      if (exp?.responsibilities) {
        const updated = [...exp.responsibilities];
        updated[bulletIndex] = data.data.bullet;
        updateExp(expId, 'responsibilities', updated);
        toast.success('Bullet improved!');
      }
    } catch {
      toast.error('AI improvement failed');
    }
  };

  return (
    <div className="space-y-6">
      {experiences.map((exp) => (
        <div key={exp.id} className="p-4 rounded-lg border space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Experience</span>
            <Button variant="ghost" size="icon" onClick={() => removeExp(exp.id)} aria-label="Remove experience">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
          <Input label="Job Title" value={exp.jobTitle} onChange={(e) => updateExp(exp.id, 'jobTitle', e.target.value)} />
          <Input label="Company" value={exp.company} onChange={(e) => updateExp(exp.id, 'company', e.target.value)} />
          <Input label="Location" value={exp.location || ''} onChange={(e) => updateExp(exp.id, 'location', e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start Date" value={exp.startDate} onChange={(e) => updateExp(exp.id, 'startDate', e.target.value)} placeholder="Jan 2020" />
            <Input label="End Date" value={exp.endDate || ''} onChange={(e) => updateExp(exp.id, 'endDate', e.target.value)} placeholder="Present" disabled={exp.isCurrent} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={exp.isCurrent} onChange={(e) => updateExp(exp.id, 'isCurrent', e.target.checked)} />
            Currently working here
          </label>
          <div className="space-y-2">
            <label className="text-sm font-medium">Responsibilities</label>
            {exp.responsibilities?.map((bullet, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={bullet}
                  onChange={(e) => {
                    const updated = [...(exp.responsibilities || [])];
                    updated[i] = e.target.value;
                    updateExp(exp.id, 'responsibilities', updated);
                  }}
                  placeholder="Describe an achievement..."
                />
                <Button variant="ghost" size="icon" onClick={() => improveBullet(exp.id, i, bullet)} aria-label="AI improve">
                  <Sparkles className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateExp(exp.id, 'responsibilities', [...(exp.responsibilities || []), ''])}
            >
              <Plus className="h-4 w-4" /> Add Bullet
            </Button>
          </div>
        </div>
      ))}
      <Button variant="outline" onClick={addExperience} className="w-full">
        <Plus className="h-4 w-4" /> Add Experience
      </Button>
    </div>
  );
}
