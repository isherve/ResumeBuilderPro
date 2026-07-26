import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { generateId } from '@/lib/utils';
import type { ResumeContent } from '@/types';

interface EditorProps {
  content: ResumeContent;
  updateContent: (updater: (prev: ResumeContent) => ResumeContent) => void;
}

export function SkillsEditor({ content, updateContent }: EditorProps) {
  const technical = content.skills?.technical || [];
  const soft = content.skills?.soft || [];

  const addSkill = (type: 'technical' | 'soft') => {
    updateContent((prev) => ({
      ...prev,
      skills: {
        ...prev.skills,
        [type]: [...(prev.skills?.[type] || []), { id: generateId(), name: '', level: 3 }],
      },
    }));
  };

  const updateSkill = (type: 'technical' | 'soft', id: string, name: string) => {
    updateContent((prev) => ({
      ...prev,
      skills: {
        ...prev.skills,
        [type]: prev.skills?.[type]?.map((s) => (s.id === id ? { ...s, name } : s)),
      },
    }));
  };

  const removeSkill = (type: 'technical' | 'soft', id: string) => {
    updateContent((prev) => ({
      ...prev,
      skills: {
        ...prev.skills,
        [type]: prev.skills?.[type]?.filter((s) => s.id !== id),
      },
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium mb-3">Technical Skills</h4>
        <div className="space-y-2">
          {technical.map((skill) => (
            <div key={skill.id} className="flex gap-2">
              <Input value={skill.name} onChange={(e) => updateSkill('technical', skill.id, e.target.value)} placeholder="e.g. React, Python" />
              <Button variant="ghost" size="icon" onClick={() => removeSkill('technical', skill.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => addSkill('technical')}>
            <Plus className="h-4 w-4" /> Add Technical Skill
          </Button>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-3">Soft Skills</h4>
        <div className="space-y-2">
          {soft.map((skill) => (
            <div key={skill.id} className="flex gap-2">
              <Input value={skill.name} onChange={(e) => updateSkill('soft', skill.id, e.target.value)} placeholder="e.g. Leadership, Communication" />
              <Button variant="ghost" size="icon" onClick={() => removeSkill('soft', skill.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => addSkill('soft')}>
            <Plus className="h-4 w-4" /> Add Soft Skill
          </Button>
        </div>
      </div>
    </div>
  );
}
