import { useCallback, useRef } from 'react';
import { resumeService } from '@/services/resume.service';
import { useBuilderStore } from '@/store';
import { debounce } from '@/lib/utils';
import { toast } from 'sonner';

export function useAutosave(resumeId: string | undefined) {
  const { content, theme, isDirty, setDirty, setSaving } = useBuilderStore();
  const debouncedSave = useRef(
    debounce(async (id: string, c: typeof content, t: typeof theme) => {
      try {
        setSaving(true);
        await resumeService.update(id, { content: c, theme: t });
        setDirty(false);
        toast.success('Saved', { duration: 1500, id: 'autosave' });
      } catch {
        toast.error('Failed to save');
      } finally {
        setSaving(false);
      }
    }, 2000),
  ).current;

  const save = useCallback(() => {
    if (resumeId && isDirty) {
      debouncedSave(resumeId, content, theme);
    }
  }, [resumeId, isDirty, content, theme, debouncedSave]);

  return { save, isDirty };
}
