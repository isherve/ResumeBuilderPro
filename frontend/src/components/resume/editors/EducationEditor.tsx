import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { generateId } from '@/lib/utils';
import type { ResumeContent, Education } from '@/types';

interface EditorProps {
  content: ResumeContent;
  updateContent: (updater: (prev: ResumeContent) => ResumeContent) => void;
}

export function EducationEditor({ content, updateContent }: EditorProps) {
  const education = content.education || [];

  const addEducation = () => {
    const newEdu: Education = {
      id: generateId(),
      degree: '',
      institution: '',
      startDate: '',
      endDate: '',
    };
    updateContent((prev) => ({
      ...prev,
      education: [...(prev.education || []), newEdu],
    }));
  };

  const updateEdu = (id: string, field: keyof Education, value: string) => {
    updateContent((prev) => ({
      ...prev,
      education: prev.education?.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    }));
  };

  const removeEdu = (id: string) => {
    updateContent((prev) => ({
      ...prev,
      education: prev.education?.filter((e) => e.id !== id),
    }));
  };

  return (
    <div className="space-y-6">
      {education.map((edu) => (
        <div key={edu.id} className="p-4 rounded-lg border space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Education</span>
            <Button variant="ghost" size="icon" onClick={() => removeEdu(edu.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
          <Input label="Degree" value={edu.degree} onChange={(e) => updateEdu(edu.id, 'degree', e.target.value)} />
          <Input label="Institution" value={edu.institution} onChange={(e) => updateEdu(edu.id, 'institution', e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start Date" value={edu.startDate} onChange={(e) => updateEdu(edu.id, 'startDate', e.target.value)} />
            <Input label="End Date" value={edu.endDate || ''} onChange={(e) => updateEdu(edu.id, 'endDate', e.target.value)} />
          </div>
          <Input label="GPA" value={edu.gpa || ''} onChange={(e) => updateEdu(edu.id, 'gpa', e.target.value)} />
        </div>
      ))}
      <Button variant="outline" onClick={addEducation} className="w-full">
        <Plus className="h-4 w-4" /> Add Education
      </Button>
    </div>
  );
}
