import type { ResumeContent, ResumeTheme } from '@/types';
import { Mail, Phone, MapPin, Globe, Link2 } from 'lucide-react';

interface ResumePreviewProps {
  content: ResumeContent;
  theme: ResumeTheme;
  zoom?: number;
}

export function ResumePreview({ content, theme, zoom = 1 }: ResumePreviewProps) {
  const { personalInfo, summary, experience, education, skills, projects, languages, certifications } = content;
  const primaryColor = theme.primaryColor || '#6366f1';
  const fontSize = theme.fontSize || 11;
  const fontFamily = theme.fontFamily || 'Inter';

  const fullName = [personalInfo?.firstName, personalInfo?.lastName].filter(Boolean).join(' ') || 'Your Name';

  return (
    <div
      className="bg-white text-gray-900 shadow-lg mx-auto origin-top"
      style={{
        width: `${794 * zoom}px`,
        minHeight: `${1123 * zoom}px`,
        transform: `scale(${zoom})`,
        transformOrigin: 'top center',
        fontSize: `${fontSize}px`,
        fontFamily,
        padding: `${(theme.margins?.top || 40) * zoom}px ${(theme.margins?.right || 40) * zoom}px`,
      }}
    >
      {/* Header */}
      <div className="text-center mb-6" style={{ borderBottom: `2px solid ${primaryColor}`, paddingBottom: '16px' }}>
        {theme.showPhoto && personalInfo?.photo && (
          <img src={personalInfo.photo} alt={fullName} className="w-20 h-20 rounded-full mx-auto mb-3 object-cover" />
        )}
        <h1 className="text-2xl font-bold" style={{ color: primaryColor, fontSize: `${fontSize * 2}px` }}>
          {fullName}
        </h1>
        {personalInfo?.jobTitle && (
          <p className="text-gray-600 mt-1" style={{ fontSize: `${fontSize * 1.2}px` }}>{personalInfo.jobTitle}</p>
        )}
        <div className="flex flex-wrap justify-center gap-3 mt-3 text-gray-500" style={{ fontSize: `${fontSize * 0.9}px` }}>
          {personalInfo?.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{personalInfo.email}</span>}
          {personalInfo?.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{personalInfo.phone}</span>}
          {personalInfo?.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{personalInfo.city}</span>}
          {personalInfo?.website && <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{personalInfo.website}</span>}
          {personalInfo?.linkedin && <span className="flex items-center gap-1"><Link2 className="h-3 w-3" />{personalInfo.linkedin}</span>}
          {personalInfo?.github && <span className="flex items-center gap-1"><Link2 className="h-3 w-3" />{personalInfo.github}</span>}
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <Section title="Professional Summary" color={primaryColor} fontSize={fontSize}>
          <p className="text-gray-700 leading-relaxed">{summary}</p>
        </Section>
      )}

      {/* Experience */}
      {experience && experience.length > 0 && (
        <Section title="Work Experience" color={primaryColor} fontSize={fontSize}>
          {experience.map((exp) => (
            <div key={exp.id} className="mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-gray-900">{exp.jobTitle}</h4>
                  <p style={{ color: primaryColor }}>{exp.company}{exp.location ? ` · ${exp.location}` : ''}</p>
                </div>
                <span className="text-gray-500 text-sm whitespace-nowrap">
                  {exp.startDate} — {exp.isCurrent ? 'Present' : exp.endDate}
                </span>
              </div>
              {exp.responsibilities?.map((r, i) => (
                <p key={i} className="text-gray-700 ml-4 mt-1">• {r}</p>
              ))}
            </div>
          ))}
        </Section>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <Section title="Education" color={primaryColor} fontSize={fontSize}>
          {education.map((edu) => (
            <div key={edu.id} className="mb-3 flex justify-between">
              <div>
                <h4 className="font-semibold">{edu.degree}</h4>
                <p style={{ color: primaryColor }}>{edu.institution}</p>
              </div>
              <span className="text-gray-500 text-sm">{edu.startDate} — {edu.endDate}</span>
            </div>
          ))}
        </Section>
      )}

      {/* Skills */}
      {skills && (skills.technical?.length || skills.soft?.length) && (
        <Section title="Skills" color={primaryColor} fontSize={fontSize}>
          {skills.technical && skills.technical.length > 0 && (
            <div className="mb-2">
              <span className="font-medium">Technical: </span>
              <span className="text-gray-700">{skills.technical.map((s) => s.name).join(', ')}</span>
            </div>
          )}
          {skills.soft && skills.soft.length > 0 && (
            <div>
              <span className="font-medium">Soft Skills: </span>
              <span className="text-gray-700">{skills.soft.map((s) => s.name).join(', ')}</span>
            </div>
          )}
        </Section>
      )}

      {/* Projects */}
      {projects && projects.length > 0 && (
        <Section title="Projects" color={primaryColor} fontSize={fontSize}>
          {projects.map((proj) => (
            <div key={proj.id} className="mb-3">
              <h4 className="font-semibold">{proj.name}</h4>
              {proj.description && <p className="text-gray-700">{proj.description}</p>}
              {proj.technologies && <p className="text-gray-500 text-sm mt-1">{proj.technologies.join(' · ')}</p>}
            </div>
          ))}
        </Section>
      )}

      {/* Languages */}
      {languages && languages.length > 0 && (
        <Section title="Languages" color={primaryColor} fontSize={fontSize}>
          <div className="flex flex-wrap gap-4">
            {languages.map((lang) => (
              <span key={lang.id}>{lang.name}{lang.level ? ` (${lang.level})` : ''}</span>
            ))}
          </div>
        </Section>
      )}

      {/* Certifications */}
      {certifications && certifications.length > 0 && (
        <Section title="Certifications" color={primaryColor} fontSize={fontSize}>
          {certifications.map((cert) => (
            <div key={cert.id} className="mb-2">
              <span className="font-medium">{cert.name}</span>
              <span className="text-gray-500"> — {cert.issuer}{cert.issueDate ? ` (${cert.issueDate})` : ''}</span>
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ title, color, fontSize, children }: { title: string; color: string; fontSize: number; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3
        className="font-bold uppercase tracking-wide mb-3 pb-1"
        style={{ color, fontSize: `${fontSize * 1.1}px`, borderBottom: `1px solid ${color}33` }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}
