import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Upload, FileText, X, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { templateService } from '@/services/template.service';
import { resumeService } from '@/services/resume.service';
import { unwrapApiData } from '@/lib/apiHelpers';
import { toast } from 'sonner';
import type { Resume, Template } from '@/types';

const ACCEPTED_TYPES = '.pdf,.doc,.docx,.txt,.json,.png,.jpg,.jpeg,.webp';
const ACCEPTED_LABEL = 'PDF, Word (.doc / .docx), TXT, JSON, or image (JPG/PNG)';

interface ImportResumeModalProps {
  open: boolean;
  onClose: () => void;
  /** When set, import fills this resume and keeps its current template */
  resumeId?: string;
  resumeTitle?: string;
  onImported?: (resume: Resume) => void;
}

export function ImportResumeModal({
  open,
  onClose,
  resumeId,
  resumeTitle,
  onImported,
}: ImportResumeModalProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [step, setStep] = useState<'idle' | 'extracting' | 'parsing' | 'creating'>('idle');
  const [dragOver, setDragOver] = useState(false);
  const isExistingResume = Boolean(resumeId);

  const {
    data: templates = [],
    isLoading: templatesLoading,
    isError: templatesError,
    refetch: refetchTemplates,
  } = useQuery({
    queryKey: ['templates-import'],
    queryFn: async () => unwrapApiData(await templateService.getAll({}), [] as Template[]),
    enabled: open && !isExistingResume,
  });

  const professionalTemplate = templates.find(
    (template) => template.slug === 'professional' || template.name.toLowerCase() === 'professional',
  );
  const selectedTemplate =
    templates.find((template) => template.id === templateId) ?? professionalTemplate ?? templates[0];

  useEffect(() => {
    if (!open || isExistingResume || templateId || templates.length === 0) return;
    setTemplateId(professionalTemplate?.id ?? templates[0]?.id ?? '');
  }, [open, isExistingResume, templateId, templates, professionalTemplate?.id]);

  const reset = () => {
    setFile(null);
    setTitle('');
    if (!isExistingResume) setTemplateId('');
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
    const valid = ['.pdf', '.doc', '.docx', '.txt', '.json', '.png', '.jpg', '.jpeg', '.webp'].some((ext) =>
      name.endsWith(ext),
    );
    if (!valid) {
      toast.error(`Unsupported file type. Upload ${ACCEPTED_LABEL}.`);
      return;
    }
    setFile(nextFile);
    if (!title && !isExistingResume) {
      setTitle(nextFile.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
    }
  };

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    pickFile(event.dataTransfer.files?.[0] ?? null);
  }, []);

  const handleImport = async () => {
    if (!file) {
      toast.error('Choose a file to import');
      return;
    }

    if (isExistingResume && resumeId) {
      try {
        setStep('extracting');
        setStep('parsing');
        const response = await resumeService.importIntoExisting(resumeId, file);
        const resume = unwrapApiData(response, null as unknown as Resume);
        setStep('creating');
        toast.success('Your document was imported into this resume.');
        onImported?.(resume);
        reset();
        onClose();
      } catch (error: unknown) {
        const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
        toast.error(message || 'Failed to import document');
        setStep('idle');
      }
      return;
    }

    const chosenTemplateId = templateId || templates[0]?.id;
    if (!chosenTemplateId) {
      toast.error('No templates available. Please try again in a moment.');
      return;
    }

    try {
      setStep('extracting');
      setStep('parsing');
      const response = await resumeService.import(file, chosenTemplateId, title || undefined);
      const resume = unwrapApiData(response, null as unknown as Resume);
      setStep('creating');
      toast.success('Resume imported! Review the fields in the builder.');
      reset();
      onClose();
      navigate(`/builder/${resume.id}`);
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
      ? 'Reading your file (OCR may take a moment for scanned PDFs)...'
      : step === 'parsing'
        ? 'Extracting resume information...'
        : step === 'creating'
          ? isExistingResume
            ? 'Updating your resume...'
            : 'Creating your resume...'
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
          <CardTitle>
            {isExistingResume ? 'Import your document' : 'Import existing CV / Resume'}
          </CardTitle>
          <CardDescription>
            {isExistingResume
              ? `Upload a PDF or Word file to fill "${resumeTitle || 'this resume'}" with your real details. Your chosen template stays the same.`
              : 'Upload your CV and we will place each section in the right field on a professional layout.'}
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
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      setFile(null);
                    }}
                  >
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

          {!isExistingResume && (
            <>
              <Input
                label="Resume title"
                placeholder="My Imported Resume"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                disabled={loading}
              />

              <div className="space-y-2">
                <label className="text-sm font-medium">Template layout</label>
                {templatesError ? (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
                    <p className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      Could not load templates.
                    </p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => refetchTemplates()}>
                      Retry
                    </Button>
                  </div>
                ) : (
                  <select
                    value={templateId || selectedTemplate?.id || ''}
                    onChange={(event) => setTemplateId(event.target.value)}
                    disabled={loading || templatesLoading}
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    {templatesLoading && <option value="">Loading templates...</option>}
                    {!templatesLoading && templates.length === 0 && (
                      <option value="">No templates available</option>
                    )}
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name} — {template.category}
                      </option>
                    ))}
                  </select>
                )}
                {!templatesLoading && templates.length > 0 && (
                  <p className="text-xs text-muted-foreground">{templates.length} templates available</p>
                )}
              </div>
            </>
          )}

          {loading && (
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {statusText}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Scanned PDFs and photos are supported (OCR). Word (.docx) gives the best results. Each section stays separate.
          </p>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleImport}
              loading={loading}
              disabled={
                !file ||
                (!isExistingResume && (templatesLoading || templates.length === 0))
              }
            >
              {isExistingResume ? 'Import into resume' : 'Import & Edit'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
