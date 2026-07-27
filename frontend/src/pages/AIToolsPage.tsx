import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Target, FileSearch, Wand2, LayoutTemplate, Plus, Upload, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { SkeletonCard } from '@/components/ui/skeleton';
import { resumeService } from '@/services/resume.service';
import { templateService, aiService } from '@/services/template.service';
import { unwrapApiData } from '@/lib/apiHelpers';
import type { ATSAnalysis, JobMatch, Resume, Template } from '@/types';
import { toast } from 'sonner';

export function AIToolsPage() {
  const navigate = useNavigate();
  const [selectedResume, setSelectedResume] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [atsResult, setAtsResult] = useState<ATSAnalysis | null>(null);
  const [jobMatch, setJobMatch] = useState<JobMatch | null>(null);
  const [loading, setLoading] = useState('');

  const {
    data: resumes = [],
    isLoading: resumesLoading,
    isError: resumesError,
    refetch: refetchResumes,
  } = useQuery({
    queryKey: ['resumes'],
    queryFn: async () => unwrapApiData(await resumeService.getAll(), [] as Resume[]),
  });

  const {
    data: templates = [],
    isLoading: templatesLoading,
    isError: templatesError,
    refetch: refetchTemplates,
  } = useQuery({
    queryKey: ['templates-ai'],
    queryFn: async () => unwrapApiData(await templateService.getAll({ sort: 'popular' }), [] as Template[]),
  });

  const runATSCheck = async () => {
    if (!selectedResume) return toast.error('Select a resume first');
    setLoading('ats');
    try {
      const { data } = await aiService.analyzeATS(selectedResume);
      setAtsResult(data.data);
      toast.success('ATS analysis complete');
    } catch {
      toast.error('ATS check failed');
    } finally {
      setLoading('');
    }
  };

  const runJobMatch = async () => {
    if (!selectedResume || !jobDescription) return toast.error('Select resume and paste job description');
    setLoading('match');
    try {
      const { data } = await aiService.matchJob(selectedResume, jobDescription);
      setJobMatch(data.data);
      toast.success('Job match analysis complete');
    } catch {
      toast.error('Job matching failed');
    } finally {
      setLoading('');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-primary" /> AI Tools
        </h1>
        <p className="text-muted-foreground mt-1">Optimize your resume with AI-powered analysis</p>
      </div>

      {/* Resume picker */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Choose a resume</CardTitle>
          <CardDescription>Select one of your resumes to analyze with AI</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {resumesLoading ? (
            <SkeletonCard />
          ) : resumesError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
              <p className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" /> Could not load your resumes.
              </p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => refetchResumes()}>
                Retry
              </Button>
            </div>
          ) : resumes.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <p className="text-sm text-muted-foreground">You do not have a resume yet.</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Button asChild size="sm">
                  <Link to="/templates"><Plus className="h-4 w-4" /> Choose template</Link>
                </Button>
              </div>
            </div>
          ) : (
            <select
              value={selectedResume}
              onChange={(e) => setSelectedResume(e.target.value)}
              className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="">Choose a resume...</option>
              {resumes.map((resume) => (
                <option key={resume.id} value={resume.id}>{resume.title}</option>
              ))}
            </select>
          )}
        </CardContent>
      </Card>

      {/* Templates quick pick */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <LayoutTemplate className="h-5 w-5" /> Available templates
          </CardTitle>
          <CardDescription>Pick a professional template to create a resume for AI analysis</CardDescription>
        </CardHeader>
        <CardContent>
          {templatesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : templatesError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
              <p className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" /> Could not load templates.
              </p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => refetchTemplates()}>
                Retry
              </Button>
            </div>
          ) : templates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No templates available right now.</p>
          ) : (
            <>
              <p className="mb-3 text-sm text-muted-foreground">{templates.length} templates available</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {templates.slice(0, 6).map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => navigate('/templates')}
                    className="flex items-start justify-between rounded-lg border p-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{template.name}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{template.description}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0 ml-2">{template.category}</Badge>
                  </button>
                ))}
              </div>
              <Button asChild variant="outline" className="mt-4">
                <Link to="/templates">Browse all templates</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ATS Checker */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileSearch className="h-5 w-5" /> ATS Checker</CardTitle>
            <CardDescription>Analyze your resume for ATS compatibility</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={runATSCheck} loading={loading === 'ats'} className="w-full" disabled={!selectedResume}>
              <Wand2 className="h-4 w-4" /> Run ATS Analysis
            </Button>
            {atsResult && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-4xl font-bold gradient-text">{atsResult.overallScore}%</p>
                  <p className="text-sm text-muted-foreground">Overall ATS Score</p>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Keywords', score: atsResult.keywords.score },
                    { label: 'Formatting', score: atsResult.formatting.score },
                    { label: 'Sections', score: atsResult.sections.score },
                    { label: 'Length', score: atsResult.length.score },
                    { label: 'Readability', score: atsResult.readability.score },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{item.label}</span>
                        <span>{item.score}%</span>
                      </div>
                      <Progress value={item.score} />
                    </div>
                  ))}
                </div>
                {atsResult.suggestions.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Suggestions</p>
                    <ul className="space-y-1">
                      {atsResult.suggestions.map((s, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary mt-1">•</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Job Matching */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" /> Job Matching</CardTitle>
            <CardDescription>Match your resume against a job description</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={6}
              placeholder="Paste the job description here..."
              className="w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button
              onClick={runJobMatch}
              loading={loading === 'match'}
              className="w-full"
              disabled={!selectedResume || !jobDescription.trim()}
            >
              <Target className="h-4 w-4" /> Calculate Match
            </Button>
            {jobMatch && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-4xl font-bold gradient-text">{jobMatch.matchPercentage}%</p>
                  <p className="text-sm text-muted-foreground">Match Score</p>
                </div>
                {jobMatch.missingSkills.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Missing Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {jobMatch.missingSkills.map((s) => (
                        <Badge key={s} variant="outline">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {jobMatch.keywordSuggestions.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Suggested Keywords</p>
                    <div className="flex flex-wrap gap-2">
                      {jobMatch.keywordSuggestions.slice(0, 8).map((k) => (
                        <Badge key={k} variant="secondary">{k}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {!resumesLoading && resumes.length === 0 && (
        <div className="rounded-2xl border bg-muted/30 p-6 text-center">
          <Upload className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-medium">Tip: import your existing CV</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Go to Templates, pick a layout, then use Import CV to fill it with your document.
          </p>
          <Button asChild className="mt-4">
            <Link to="/templates">Go to Templates</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
