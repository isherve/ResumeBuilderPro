import type { Template } from '@/types';

interface TemplateThumbnailProps {
  template: Template;
  className?: string;
}

function SectionLines({ count = 3, width = '100%' }: { count?: number; width?: string }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="h-1 rounded-full bg-gray-200/90"
          style={{ width: index === count - 1 ? '70%' : width }}
        />
      ))}
    </div>
  );
}

export function TemplateThumbnail({ template, className = '' }: TemplateThumbnailProps) {
  const theme = template.defaultTheme;
  const primary = theme.primaryColor || '#6366f1';
  const accent = theme.accentColor || '#8b5cf6';
  const layout = template.layout as { type?: string } | undefined;
  const isSidebar = theme.headerStyle === 'sidebar' || layout?.type === 'sidebar';

  return (
    <div
      className={`relative h-full w-full overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(135deg, ${primary}18 0%, ${accent}12 50%, ${primary}08 100%)`,
      }}
    >
      <div className="absolute inset-0 opacity-30">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl" style={{ background: accent }} />
        <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full blur-2xl" style={{ background: primary }} />
      </div>

      <div className="relative flex h-full items-center justify-center p-4">
        <div className="w-[68%] max-w-[140px] aspect-[210/297] overflow-hidden rounded-[3px] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.12)] ring-1 ring-black/5">
          {isSidebar ? (
            <div className="flex h-full">
              <div
                className="flex w-[30%] flex-col items-center gap-1.5 px-1 py-2"
                style={{ background: `linear-gradient(180deg, ${primary}, ${accent})` }}
              >
                {theme.showPhoto !== false && (
                  <div className="h-4 w-4 rounded-full bg-white/35 ring-1 ring-white/40" />
                )}
                <div className="h-1 w-full rounded bg-white/70" />
                <div className="h-0.5 w-[80%] rounded bg-white/45" />
                <div className="mt-1 h-0.5 w-full rounded bg-white/35" />
                <div className="h-0.5 w-full rounded bg-white/25" />
              </div>
              <div className="flex flex-1 flex-col gap-1.5 p-1.5">
                <div className="h-1 w-8 rounded" style={{ background: primary }} />
                <SectionLines count={2} />
                <div className="mt-0.5 h-1 w-7 rounded" style={{ background: primary }} />
                <SectionLines count={3} />
                <div className="mt-0.5 h-1 w-6 rounded" style={{ background: primary }} />
                <SectionLines count={2} width="85%" />
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col p-2">
              <div className="border-b pb-1.5 text-center" style={{ borderColor: `${primary}55` }}>
                {theme.showPhoto !== false && (
                  <div
                    className="mx-auto mb-1 h-3.5 w-3.5 rounded-full"
                    style={{ background: `${primary}22`, border: `1px solid ${primary}44` }}
                  />
                )}
                <div className="mx-auto h-1.5 w-10 rounded" style={{ background: primary }} />
                <div className="mx-auto mt-1 h-1 w-14 rounded bg-gray-200" />
                <div className="mx-auto mt-1 flex justify-center gap-1">
                  <div className="h-0.5 w-3 rounded bg-gray-200" />
                  <div className="h-0.5 w-3 rounded bg-gray-200" />
                  <div className="h-0.5 w-3 rounded bg-gray-200" />
                </div>
              </div>
              <div className="mt-1.5 space-y-2">
                <div>
                  <div className="mb-1 h-1 w-8 rounded" style={{ background: primary }} />
                  <SectionLines count={2} />
                </div>
                <div>
                  <div className="mb-1 h-1 w-10 rounded" style={{ background: primary }} />
                  <SectionLines count={3} />
                </div>
                <div>
                  <div className="mb-1 h-1 w-7 rounded" style={{ background: primary }} />
                  <div className="flex flex-wrap gap-0.5">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div
                        key={index}
                        className="h-1.5 rounded-full px-1"
                        style={{ width: `${18 + index * 4}px`, background: `${accent}33` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
