import type { ResumeContent, ResumeTheme } from '@/types';
import { Mail, Phone, MapPin, Globe, Link2 } from 'lucide-react';
import { getLayoutType } from '@/data/sampleResumeContent';

function getPadding(theme: ResumeTheme, fallback = 40): number {
  const margins = theme.margins;
  if (margins && typeof margins === 'object' && typeof margins.top === 'number') {
    return margins.top;
  }
  return fallback;
}

interface ResumePreviewProps {
  content: ResumeContent;
  theme: ResumeTheme;
  zoom?: number;
  layout?: Record<string, unknown>;
}

export function ResumePreview({ content, theme, zoom = 1, layout }: ResumePreviewProps) {
  const layoutType = getLayoutType(theme, layout);
  const baseStyle: React.CSSProperties = {
    width: '794px',
    minHeight: '1123px',
    transform: zoom !== 1 ? `scale(${zoom})` : undefined,
    transformOrigin: 'top center',
    fontSize: `${theme.fontSize || 11}px`,
    fontFamily: theme.fontFamily || 'Inter, sans-serif',
  };

  if (layoutType === 'sidebar') {
    return <SidebarLayout content={content} theme={theme} style={baseStyle} />;
  }
  if (layoutType === 'minimal') {
    return <MinimalLayout content={content} theme={theme} style={baseStyle} />;
  }
  return <CenteredLayout content={content} theme={theme} style={baseStyle} />;
}

type LayoutProps = {
  content: ResumeContent;
  theme: ResumeTheme;
  style: React.CSSProperties;
};

function CenteredLayout({ content, theme, style }: LayoutProps) {
  const primary = theme.primaryColor || '#6366f1';
  const { personalInfo, summary, experience, education, skills } = content;
  const fullName = [personalInfo?.firstName, personalInfo?.lastName].filter(Boolean).join(' ') || 'Your Name';
  const padding = getPadding(theme, 40);

  return (
    <div className="bg-white text-gray-900 shadow-lg mx-auto" style={{ ...style, padding }}>
      <header className="mb-6 border-b-2 pb-4 text-center" style={{ borderColor: primary }}>
        {theme.showPhoto !== false && personalInfo?.photo && (
          <img src={personalInfo.photo} alt={fullName} className="mx-auto mb-3 h-20 w-20 rounded-full object-cover" />
        )}
        <h1 className="text-2xl font-bold" style={{ color: primary }}>{fullName}</h1>
        {personalInfo?.jobTitle && <p className="mt-1 text-gray-600">{personalInfo.jobTitle}</p>}
        <ContactRow personalInfo={personalInfo} theme={theme} className="mt-3 justify-center" />
      </header>
      {summary && <Section title="Professional Summary" primary={primary} style={theme.sectionStyle}><p className="whitespace-pre-line leading-relaxed">{summary}</p></Section>}
      {experience && experience.length > 0 && (
        <Section title="Work Experience" primary={primary} style={theme.sectionStyle}>
          {experience.map((exp) => <ExperienceBlock key={exp.id} exp={exp} primary={primary} />)}
        </Section>
      )}
      {education && education.length > 0 && (
        <Section title="Education" primary={primary} style={theme.sectionStyle}>
          {education.map((edu) => <EducationBlock key={edu.id} edu={edu} primary={primary} />)}
        </Section>
      )}
      {skills && <SkillsBlock skills={skills} primary={primary} style={theme.sectionStyle} />}
      <ExtraSections content={content} primary={primary} style={theme.sectionStyle} />
    </div>
  );
}

function SidebarLayout({ content, theme, style }: LayoutProps) {
  const primary = theme.primaryColor || '#6366f1';
  const accent = theme.accentColor || '#8b5cf6';
  const { personalInfo, summary, experience, education, skills } = content;
  const fullName = [personalInfo?.firstName, personalInfo?.lastName].filter(Boolean).join(' ') || 'Your Name';

  return (
    <div className="mx-auto flex min-h-[1123px] bg-white text-gray-900 shadow-lg" style={style}>
      <aside
        className="w-[32%] shrink-0 p-6 text-white"
        style={{ background: `linear-gradient(180deg, ${primary}, ${accent})` }}
      >
        {theme.showPhoto !== false && personalInfo?.photo && (
          <img src={personalInfo.photo} alt={fullName} className="mx-auto mb-4 h-24 w-24 rounded-full border-2 border-white/40 object-cover" />
        )}
        <h1 className="text-xl font-bold leading-tight">{fullName}</h1>
        {personalInfo?.jobTitle && <p className="mt-2 text-sm text-white/90">{personalInfo.jobTitle}</p>}
        <div className="mt-6 space-y-2 text-xs text-white/90">
          {personalInfo?.email && <p className="flex gap-2"><Mail className="h-3.5 w-3.5 shrink-0" />{personalInfo.email}</p>}
          {personalInfo?.phone && <p className="flex gap-2"><Phone className="h-3.5 w-3.5 shrink-0" />{personalInfo.phone}</p>}
          {personalInfo?.city && <p className="flex gap-2"><MapPin className="h-3.5 w-3.5 shrink-0" />{personalInfo.city}</p>}
          {personalInfo?.linkedin && <p className="flex gap-2 break-all"><Link2 className="h-3.5 w-3.5 shrink-0" />{personalInfo.linkedin}</p>}
        </div>
        {skills && (skills.technical?.length || skills.soft?.length) && (
          <div className="mt-8">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider">Skills</h3>
            <div className="flex flex-wrap gap-1.5">
              {[...(skills.technical ?? []), ...(skills.soft ?? [])]
                .filter((s) => s.name?.trim() && s.name.trim().length > 1)
                .slice(0, 12)
                .map((s) => (
                <span key={s.id} className="rounded bg-white/20 px-2 py-0.5 text-[10px]">{s.name}</span>
              ))}
            </div>
          </div>
        )}
      </aside>
      <main className="flex-1 p-8">
        {summary && <Section title="Profile" primary={primary} style="underline">{summary}</Section>}
        {experience && experience.length > 0 && (
          <Section title="Experience" primary={primary} style="underline">
            {experience.map((exp) => <ExperienceBlock key={exp.id} exp={exp} primary={primary} />)}
          </Section>
        )}
        {education && education.length > 0 && (
          <Section title="Education" primary={primary} style="underline">
            {education.map((edu) => <EducationBlock key={edu.id} edu={edu} primary={primary} />)}
          </Section>
        )}
        <ExtraSections content={content} primary={primary} style="underline" />
      </main>
    </div>
  );
}

function MinimalLayout({ content, theme, style }: LayoutProps) {
  const primary = theme.primaryColor || '#374151';
  const { personalInfo, summary, experience, education, skills } = content;
  const fullName = [personalInfo?.firstName, personalInfo?.lastName].filter(Boolean).join(' ') || 'Your Name';
  const padding = getPadding(theme, 48);

  return (
    <div className="bg-white text-gray-900 shadow-lg mx-auto" style={{ ...style, padding }}>
      <header className="mb-8">
        <h1 className="text-3xl font-light tracking-tight text-gray-900">{fullName}</h1>
        {personalInfo?.jobTitle && <p className="mt-1 text-sm uppercase tracking-[0.2em] text-gray-500">{personalInfo.jobTitle}</p>}
        <ContactRow personalInfo={personalInfo} theme={theme} className="mt-4 text-xs" />
        <div className="mt-4 h-px w-16" style={{ background: primary }} />
      </header>
      {summary && <Section title="Summary" primary={primary} style="minimal">{summary}</Section>}
      {experience && experience.length > 0 && (
        <Section title="Experience" primary={primary} style="minimal">
          {experience.map((exp) => <ExperienceBlock key={exp.id} exp={exp} primary={primary} compact />)}
        </Section>
      )}
      {education && education.length > 0 && (
        <Section title="Education" primary={primary} style="minimal">
          {education.map((edu) => <EducationBlock key={edu.id} edu={edu} primary={primary} />)}
        </Section>
      )}
      {skills && <SkillsBlock skills={skills} primary={primary} style="minimal" inline />}
      <ExtraSections content={content} primary={primary} style="minimal" />
    </div>
  );
}

function Section({
  title,
  primary,
  style = 'underline',
  children,
}: {
  title: string;
  primary: string;
  style?: string;
  children: React.ReactNode;
}) {
  if (style === 'minimal') {
    return (
      <div className="mb-6">
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-500">{title}</h3>
        <div className="text-gray-700 leading-relaxed">{children}</div>
      </div>
    );
  }
  return (
    <div className="mb-5">
      <h3 className="mb-3 border-b pb-1 text-sm font-bold uppercase tracking-wide" style={{ color: primary, borderColor: `${primary}33` }}>
        {title}
      </h3>
      <div className="text-gray-700">{children}</div>
    </div>
  );
}

function ContactRow({
  personalInfo,
  theme,
  className = '',
}: {
  personalInfo?: ResumeContent['personalInfo'];
  theme: ResumeTheme;
  className?: string;
}) {
  if (!personalInfo) return null;
  const showIcons = theme.showIcons !== false;
  return (
    <div className={`flex flex-wrap gap-3 text-gray-500 text-xs ${className}`}>
      {personalInfo.email && <span className="flex items-center gap-1">{showIcons && <Mail className="h-3 w-3" />}{personalInfo.email}</span>}
      {personalInfo.phone && <span className="flex items-center gap-1">{showIcons && <Phone className="h-3 w-3" />}{personalInfo.phone}</span>}
      {personalInfo.city && <span className="flex items-center gap-1">{showIcons && <MapPin className="h-3 w-3" />}{personalInfo.city}</span>}
      {personalInfo.website && <span className="flex items-center gap-1">{showIcons && <Globe className="h-3 w-3" />}{personalInfo.website}</span>}
      {personalInfo.linkedin && <span className="flex items-center gap-1">{showIcons && <Link2 className="h-3 w-3" />}{personalInfo.linkedin}</span>}
    </div>
  );
}

function ExperienceBlock({
  exp,
  primary,
  compact,
}: {
  exp: NonNullable<ResumeContent['experience']>[0];
  primary: string;
  compact?: boolean;
}) {
  return (
    <div className={`${compact ? 'mb-4' : 'mb-4'}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-semibold text-gray-900">{exp.jobTitle}</h4>
          <p style={{ color: primary }} className="text-sm">{exp.company}{exp.location ? ` · ${exp.location}` : ''}</p>
        </div>
        <span className="shrink-0 text-xs text-gray-500">{exp.startDate} — {exp.isCurrent ? 'Present' : exp.endDate}</span>
      </div>
      {exp.responsibilities?.map((r, i) => (
        <p key={i} className="ml-4 mt-1 text-sm text-gray-700">• {r}</p>
      ))}
    </div>
  );
}

function EducationBlock({
  edu,
  primary,
}: {
  edu: NonNullable<ResumeContent['education']>[0];
  primary: string;
}) {
  return (
    <div className="mb-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-semibold">{edu.degree}</h4>
          {edu.institution && <p className="text-sm" style={{ color: primary }}>{edu.institution}</p>}
        </div>
        {(edu.startDate || edu.endDate) && (
          <span className="text-xs text-gray-500">{edu.startDate}{edu.endDate ? ` — ${edu.endDate}` : ''}</span>
        )}
      </div>
      {edu.description && <p className="mt-1 text-sm text-gray-700 whitespace-pre-line">{edu.description}</p>}
    </div>
  );
}

function SkillsBlock({
  skills,
  primary,
  style,
  inline,
}: {
  skills: NonNullable<ResumeContent['skills']>;
  primary: string;
  style?: string;
  inline?: boolean;
}) {
  if (!skills.technical?.length && !skills.soft?.length) return null;
  const all = [...(skills.technical ?? []), ...(skills.soft ?? [])];
  if (inline) {
    return (
      <Section title="Skills" primary={primary} style={style}>
        <p className="text-sm">{all.map((s) => s.name).join(' · ')}</p>
      </Section>
    );
  }
  return (
    <Section title="Skills" primary={primary} style={style}>
      {skills.technical && skills.technical.length > 0 && (
        <p className="mb-1 text-sm"><span className="font-medium">Technical: </span>{skills.technical.map((s) => s.name).join(', ')}</p>
      )}
      {skills.soft && skills.soft.length > 0 && (
        <p className="text-sm"><span className="font-medium">Soft: </span>{skills.soft.map((s) => s.name).join(', ')}</p>
      )}
    </Section>
  );
}

function formatSectionTitle(title: string): string {
  const normalized = title.trim();
  if (/^personality$/i.test(normalized)) return 'Personal Qualities';
  if (/^academic records$/i.test(normalized)) return 'Academic Background';
  return normalized
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function ExtraSections({
  content,
  primary,
  style,
}: {
  content: ResumeContent;
  primary: string;
  style?: string;
}) {
  return (
    <>
      {content.projects && content.projects.length > 0 && (
        <Section title="Projects" primary={primary} style={style}>
          {content.projects.map((project) => (
            <div key={project.id} className="mb-3">
              <h4 className="font-semibold text-gray-900">{project.name}</h4>
              {project.description && <p className="mt-1 text-sm text-gray-700 whitespace-pre-line">{project.description}</p>}
            </div>
          ))}
        </Section>
      )}
      {content.certifications && content.certifications.length > 0 && (
        <Section title="Certifications" primary={primary} style={style}>
          {content.certifications.map((cert) => (
            <p key={cert.id} className="mb-1 text-sm">• {cert.name}{cert.issuer ? ` — ${cert.issuer}` : ''}</p>
          ))}
        </Section>
      )}
      {content.languages && content.languages.length > 0 && (
        <Section title="Languages" primary={primary} style={style}>
          <p className="text-sm">
            {content.languages.map((lang) => lang.name + (lang.level ? ` (${lang.level})` : '')).join(' · ')}
          </p>
        </Section>
      )}
      {content.achievements && content.achievements.length > 0 && (
        <Section title="Achievements" primary={primary} style={style}>
          {content.achievements.map((item) => (
            <p key={item.id} className="mb-1 text-sm">• {item.title}{item.description ? ` — ${item.description}` : ''}</p>
          ))}
        </Section>
      )}
      {content.publications && content.publications.length > 0 && (
        <Section title="Publications" primary={primary} style={style}>
          {content.publications.map((item) => (
            <p key={item.id} className="mb-1 text-sm">• {item.title}{item.publisher ? ` — ${item.publisher}` : ''}</p>
          ))}
        </Section>
      )}
      {content.volunteer && content.volunteer.length > 0 && (
        <Section title="Volunteer" primary={primary} style={style}>
          {content.volunteer.map((item) => (
            <div key={item.id} className="mb-3">
              <h4 className="font-semibold">{item.role}</h4>
              <p className="text-sm" style={{ color: primary }}>{item.organization}</p>
              {item.description && <p className="mt-1 text-sm text-gray-700 whitespace-pre-line">{item.description}</p>}
            </div>
          ))}
        </Section>
      )}
      {content.customSections?.map((section) => (
        <Section key={section.id} title={formatSectionTitle(section.title)} primary={primary} style={style}>
          {section.items.map((item) => (
            <p key={item.id} className="mb-2 text-sm whitespace-pre-line leading-relaxed last:mb-0">
              {section.items.length > 1 ? `• ${item.content}` : item.content}
            </p>
          ))}
        </Section>
      ))}
    </>
  );
}
