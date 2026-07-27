import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Save, Download, Undo, Redo, ZoomIn, ZoomOut, Maximize,
  Share2, Palette, Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ResumePreview } from '@/components/resume/ResumePreview';
import { PersonalInfoEditor } from '@/components/resume/editors/PersonalInfoEditor';
import { ExperienceEditor } from '@/components/resume/editors/ExperienceEditor';
import { EducationEditor } from '@/components/resume/editors/EducationEditor';
import { SkillsEditor } from '@/components/resume/editors/SkillsEditor';
import { SummaryEditor } from '@/components/resume/editors/SummaryEditor';
import { ImportResumeModal } from '@/components/resume/ImportResumeModal';
import { useBuilderStore } from '@/store';
import { resumeService } from '@/services/resume.service';
import { useAutosave } from '@/hooks/useAutosave';
import { exportToPDF, exportToJSON, printResume } from '@/utils/export';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { unwrapApiData } from '@/lib/apiHelpers';
import { hasImportedContent } from '@/lib/resumeContent';
import type { Resume, ResumeContent } from '@/types';

export function BuilderPage() {
  const { id } = useParams<{ id: string }>();
  const [zoom, setZoom] = useState(0.6);
  const [activeSection, setActiveSection] = useState('personalInfo');
  const [title, setTitle] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [templateLayout, setTemplateLayout] = useState<Record<string, unknown>>({});
  const queryClient = useQueryClient();
  const {
    content, theme, setContent, loadContent, applyImportedContent, setTheme, updateContent,
    undo, redo, undoStack, redoStack, isSaving, reset,
  } = useBuilderStore();

  const { save, isDirty, cancelSave } = useAutosave(id);

  const { data, isLoading } = useQuery({
    queryKey: ['resume', id],
    queryFn: () => resumeService.getById(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (data?.data?.data) {
      const resume = data.data.data;
      loadContent((resume.content ?? {}) as ResumeContent);
      setTheme(resume.theme ?? {});
      setTitle(resume.title);
      setTemplateLayout(resume.template?.layout ?? {});
    }
  }, [data, loadContent, setTheme]);

  useEffect(() => () => reset(), [reset]);

  useEffect(() => {
    if (isDirty) save();
  }, [content, theme, isDirty, save]);

  const handleSave = async () => {
    if (!id) return;
    try {
      await resumeService.update(id, { content, theme, title });
      toast.success('Resume saved');
    } catch {
      toast.error('Failed to save');
    }
  };

  const handleExportPDF = async () => {
    try {
      await exportToPDF('resume-preview', title || 'resume');
      if (id) await resumeService.recordDownload(id, 'PDF');
      toast.success('PDF exported');
    } catch {
      try {
        printResume('resume-preview');
        toast.success('Opening print dialog — choose "Save as PDF"');
      } catch {
        toast.error('Export failed. Try allowing pop-ups, then click PDF again.');
      }
    }
  };

  const handleExportJSON = () => {
    exportToJSON(content, theme, title || 'resume');
    toast.success('JSON exported');
  };

  const handleShare = async () => {
    if (!id) return;
    try {
      const { data: res } = await resumeService.share(id);
      const url = `${window.location.origin}/share/${res.data.shareToken}`;
      await navigator.clipboard.writeText(url);
      toast.success('Share link copied!');
    } catch {
      toast.error('Failed to generate share link');
    }
  };

  const sections = [
    { id: 'personalInfo', label: 'Personal Info' },
    { id: 'summary', label: 'Summary' },
    { id: 'experience', label: 'Experience' },
    { id: 'education', label: 'Education' },
    { id: 'skills', label: 'Skills' },
  ];

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-card/80 backdrop-blur-xl shrink-0 overflow-x-auto">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-48 h-8"
          placeholder="Resume title"
        />
        {isSaving && <Badge variant="secondary">Saving...</Badge>}
        {isDirty && !isSaving && <Badge variant="outline">Unsaved</Badge>}

        <div className="flex-1" />

        <Button variant="ghost" size="icon" onClick={undo} disabled={undoStack.length === 0} aria-label="Undo">
          <Undo className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={redo} disabled={redoStack.length === 0} aria-label="Redo">
          <Redo className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setZoom(Math.max(0.3, zoom - 0.1))} aria-label="Zoom out">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground w-10 text-center">{Math.round(zoom * 100)}%</span>
        <Button variant="ghost" size="icon" onClick={() => setZoom(Math.min(1.2, zoom + 0.1))} aria-label="Zoom in">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setZoom(0.8)} aria-label="Fullscreen preview">
          <Maximize className="h-4 w-4" />
        </Button>

        <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
          <Upload className="h-4 w-4" /> Import CV
        </Button>
        <Button variant="outline" size="sm" onClick={handleSave}><Save className="h-4 w-4" /> Save</Button>
        <Button variant="outline" size="sm" onClick={handleShare}><Share2 className="h-4 w-4" /> Share</Button>
        <Button variant="outline" size="sm" onClick={handleExportJSON}><Download className="h-4 w-4" /> JSON</Button>
        <Button size="sm" onClick={handleExportPDF}><Download className="h-4 w-4" /> PDF</Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Editor Panel */}
        <div className="w-full lg:w-[400px] border-r overflow-y-auto shrink-0">
          <div className="flex border-b overflow-x-auto">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeSection === s.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="p-4">
            <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm font-medium">Have a CV or document about you?</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Import PDF or Word to fill this template with your details. Sections stay separate.
              </p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setImportOpen(true)}>
                <Upload className="h-4 w-4" /> Import document
              </Button>
            </div>

            {activeSection === 'personalInfo' && <PersonalInfoEditor content={content} updateContent={updateContent} />}
            {activeSection === 'summary' && <SummaryEditor content={content} updateContent={updateContent} />}
            {activeSection === 'experience' && <ExperienceEditor content={content} updateContent={updateContent} />}
            {activeSection === 'education' && <EducationEditor content={content} updateContent={updateContent} />}
            {activeSection === 'skills' && <SkillsEditor content={content} updateContent={updateContent} />}
          </div>

          {/* Theme Customization */}
          <div className="p-4 border-t">
            <h3 className="font-semibold flex items-center gap-2 mb-3"><Palette className="h-4 w-4" /> Theme</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Primary Color</label>
                <input
                  type="color"
                  value={theme.primaryColor || '#6366f1'}
                  onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                  className="w-full h-8 rounded cursor-pointer"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Accent Color</label>
                <input
                  type="color"
                  value={theme.accentColor || '#8b5cf6'}
                  onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })}
                  className="w-full h-8 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="hidden lg:flex flex-1 bg-muted/30 overflow-auto justify-center p-8" id="resume-preview-container">
          <div id="resume-preview">
            <ResumePreview content={content} theme={theme} zoom={zoom} layout={templateLayout} />
          </div>
        </div>
      </div>

      <ImportResumeModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        resumeId={id}
        resumeTitle={title}
        onImported={(resume) => {
          cancelSave();
          if (!resume?.content || !hasImportedContent(resume.content)) {
            toast.error('Import completed but no readable content was found. Try a Word (.docx) file.');
            return;
          }
          applyImportedContent(resume.content);
          if (resume.title) setTitle(resume.title);
          queryClient.setQueryData(['resume', id], {
            data: { success: true, data: resume },
          });
        }}
      />
    </div>
  );
}
