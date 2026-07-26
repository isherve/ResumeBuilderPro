import { Input } from '@/components/ui/input';
import type { ResumeContent } from '@/types';

interface EditorProps {
  content: ResumeContent;
  updateContent: (updater: (prev: ResumeContent) => ResumeContent) => void;
}

export function PersonalInfoEditor({ content, updateContent }: EditorProps) {
  const info = content.personalInfo || {};

  const update = (field: string, value: string) => {
    updateContent((prev) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value },
    }));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input label="First Name" value={info.firstName || ''} onChange={(e) => update('firstName', e.target.value)} />
        <Input label="Last Name" value={info.lastName || ''} onChange={(e) => update('lastName', e.target.value)} />
      </div>
      <Input label="Job Title" value={info.jobTitle || ''} onChange={(e) => update('jobTitle', e.target.value)} />
      <Input label="Email" type="email" value={info.email || ''} onChange={(e) => update('email', e.target.value)} />
      <Input label="Phone" value={info.phone || ''} onChange={(e) => update('phone', e.target.value)} />
      <Input label="City" value={info.city || ''} onChange={(e) => update('city', e.target.value)} />
      <Input label="Website" value={info.website || ''} onChange={(e) => update('website', e.target.value)} />
      <Input label="LinkedIn" value={info.linkedin || ''} onChange={(e) => update('linkedin', e.target.value)} />
      <Input label="GitHub" value={info.github || ''} onChange={(e) => update('github', e.target.value)} />
    </div>
  );
}
