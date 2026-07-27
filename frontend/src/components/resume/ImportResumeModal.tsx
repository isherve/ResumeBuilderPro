import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { templateService } from '@/services/template.service';
import { resumeService } from '@/services/resume.service';
import { toast } from 'sonner';
import type { Template } from '@/types';

const ACCEPTED_TYPES = '.pdf,.doc,.docx,.txt,.json';
const ACCEPTED_LABEL = 'PDF, Word (.doc / .docx), TXT, or JSON';

interface ImportResumeModalProps {
  open: boolean;
  onClose: () => void;
}

export function ImportResumeModal({ open, onClose }: ImportResumeModalProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [step, setStep] = useState<'idle' | 'extracting' | 'parsing' | 'creating'>('idle');
  const [dragOver, setDragOver] = useState(false);

  const { data: templatesData, isLoading: templatesLoading } = useQuery({
    queryKey: ['templates-import'],
    queryFn: () => templateService.getAll({}),
    enabled: open,
  });

  const templates = templatesData?.data?.data || [];
  const selectedTemplate = templates.find((template: Template) => template.id === templateId) ?? templates[0];

  const reset = () => {
    setFile(null);
    setTitle('');
    setTemplateId('');
    setStep('idle');
    setDragOver(false);
  };

  const handleClose = () => {
    if (step !== 'idle') return;
    reset();
    onClose();
  };

  const pickFile = (nextFile: File | null) => {
    if (!nextFile) return;
    const name = nextFile.name.toLowerCase();
    const valid = ['.pdf', '.doc', '.docx', '.txt', '.json'].some((ext) => name.endsWith(ext));
    if (!valid) {
      toast.error(`Unsupported file type. Upload ${ACCEPTED_LABEL}.`);
      return;
    }
    setFile(nextFile);
    if (!title) {
      setTitle(nextFile.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
    }
  };

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    pickFile(event.dataTransfer.files?.[0] ?? null);
  }, [title]);

  const handleImport = async () => {
    if (!file) {
      toast.error('Choose a file to import');
      return;
    }

    const chosenTemplateId = templateId || templates[0]?.id;
    if (!chosenTemplateId) {
      toast.error('Select a template');
      return;
    }

    try {
      setStep('extracting');
      await new Promise((resolve) => setTimeout(resolve, 300));
      setStep('parsing');

      const { data } = await resumeService.import(file, chosenTemplateId, title || undefined);

      setStep('creating');
      toast.success('Resume imported! Review the fields in the builder.');
      reset();
      onClose();
      navigate(`/builder/${data.data.id}`);
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || 'Failed to import resume');
      setStep('idle');
    }
  };

  if (!open) return null;

  const loading = step !== 'idle';
  const statusText =
    step === 'extracting'
      ? 'Reading your file...'
      : step === 'parsing'
        ? 'Extracting resume information...'
        : step === 'creating'
          ? 'Creating your resume...'
          : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader className="relative">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="absolute right-4 top-4 rounded-md p-1 hover:bg-muted disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <CardTitle>Import existing CV / Resume</CardTitle>
          <CardDescription>
            Upload a past resume and we&apos;ll fill in your new one automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            role="button"
            tabIndex={0}
            onDragOver={(event) => {
              event.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !loading && inputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click();
            }}
            className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
              dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
            } ${loading ? 'pointer-events-none opacity-60' : ''}`}
          >
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              className="hidden"
              onChange={(event) => pickFile(event.target.files?.[0] ?? null)}
            />
            {file ? (
              <>
                <FileText className="h-10 w-10 text-primary" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                </div>
                {!loading && (
                  <Button type="button" variant="outline" size="sm" onClick={(event) => {
                    event.stopPropagation();
                    setFile(null);
                  }}>
                    Choose another file
                  </Button>
                )}
              </>
            ) : (
              <>
                <Upload className="h-10 w-10 text-muted-foreground" />
                <div>
                  <p className="font-medium">Drop your file here or click to browse</p>
                  <p className="text-sm text-muted-foreground mt-1">{ACCEPTED_LABEL}</p>
                </div>
              </>
            )}
          </div>

          <Input
            label="Resume title"
            placeholder="My Imported Resume"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            disabled={loading}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium">Template layout</label>
            <select
              value={templateId || selectedTemplate?.id || ''}
              onChange={(event) => setTemplateId(event.target.value)}
              disabled={loading || templatesLoading}
              className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
            >
              {templates.map((template: Template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          {loading && (
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {statusText}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            AI extracts sections like experience, education, and skills. Always review imported data before downloading.
          </p>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleImport} loading={loading} disabled={!file || templatesLoading}>
              Import &amp; Edit
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
