import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Target, FileSearch, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { resumeService } from '@/services/resume.service';
import { aiService } from '@/services/template.service';
import type { ATSAnalysis, JobMatch } from '@/types';
import { toast } from 'sonner';

export function AIToolsPage() {
  const [selectedResume, setSelectedResume] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [atsResult, setAtsResult] = useState<ATSAnalysis | null>(null);
  const [jobMatch, setJobMatch] = useState<JobMatch | null>(null);
  const [loading, setLoading] = useState('');

  const { data: resumesData } = useQuery({
    queryKey: ['resumes'],
    queryFn: () => resumeService.getAll(),
  });

  const resumes = resumesData?.data?.data || [];

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

      <div>
        <label className="text-sm font-medium">Select Resume</label>
        <select
          value={selectedResume}
          onChange={(e) => setSelectedResume(e.target.value)}
          className="mt-1.5 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="">Choose a resume...</option>
          {resumes.map((r: { id: string; title: string }) => (
            <option key={r.id} value={r.id}>{r.title}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ATS Checker */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileSearch className="h-5 w-5" /> ATS Checker</CardTitle>
            <CardDescription>Analyze your resume for ATS compatibility</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={runATSCheck} loading={loading === 'ats'} className="w-full">
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
            <Button onClick={runJobMatch} loading={loading === 'match'} className="w-full">
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
    </div>
  );
}
