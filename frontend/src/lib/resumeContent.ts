import type { ResumeContent } from '@/types';

export function hasImportedContent(content?: ResumeContent | null): boolean {
  if (!content) return false;

  const personal = content.personalInfo;
  if (personal?.firstName?.trim() || personal?.lastName?.trim()) return true;
  if (personal?.email?.trim() || personal?.phone?.trim()) return true;
  if (content.summary?.trim()) return true;
  if ((content.experience?.length ?? 0) > 0) return true;
  if ((content.education?.length ?? 0) > 0) return true;
  if ((content.skills?.technical?.length ?? 0) > 0) return true;
  if ((content.customSections?.length ?? 0) > 0) return true;

  return false;
}

export function countImportedSections(content?: ResumeContent | null): number {
  if (!content) return 0;
  let count = 0;
  if (content.personalInfo?.firstName || content.personalInfo?.lastName) count += 1;
  if (content.summary?.trim()) count += 1;
  count += content.experience?.length ?? 0;
  count += content.education?.length ?? 0;
  count += content.customSections?.length ?? 0;
  return count;
}
