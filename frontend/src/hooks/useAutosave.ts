import { useCallback, useRef } from 'react';
import { resumeService } from '@/services/resume.service';
import { useBuilderStore } from '@/store';
import { toast } from 'sonner';

export function useAutosave(resumeId: string | undefined) {
  const { content, theme, isDirty, setDirty, setSaving } = useBuilderStore();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelSave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setSaving(false);
  }, [setSaving]);

  const save = useCallback(() => {
    if (!resumeId || !isDirty) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(async () => {
      timerRef.current = null;
      try {
        setSaving(true);
        await resumeService.update(resumeId, { content, theme });
        setDirty(false);
        toast.success('Saved', { duration: 1500, id: 'autosave' });
      } catch {
        toast.error('Failed to save');
      } finally {
        setSaving(false);
      }
    }, 2000);
  }, [resumeId, isDirty, content, theme, setDirty, setSaving]);

  return { save, isDirty, cancelSave };
}
