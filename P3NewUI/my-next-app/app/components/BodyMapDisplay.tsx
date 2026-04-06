"use client";
import { useState } from 'react';
import { bodyFront } from '../assets/bodyFront';
import { bodyBack } from '../assets/bodyBack';
import { bodyFemaleFront } from '../assets/bodyFemaleFront';
import { bodyFemaleBack } from '../assets/bodyFemaleBack';
import { SvgFemaleWrapper } from './SvgFemaleWrapper';
import { SvgMaleWrapper } from './SvgMaleWrapper';

type SorenessRow = { BodyPartName: string; Side: string; SorenessLevel: number };

function dbToSlug(name: string, side: string): string {
  const base = name.toLowerCase().replace(/\s+/g, '-');
  if (!side || side === 'N/A') return base;
  return `${base}_${side.toLowerCase()}`;
}

function muscleColor(slug: string, map: Record<string, number>): string {
  const level = map[slug];
  if (!level) return '#334155';
  if (level < 4) return '#22c55e';
  if (level < 7) return '#eab308';
  return '#ef4444';
}

function slugToLabel(slug: string): string {
  const [base, side] = slug.split('_');
  const name = base.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  if (side === 'left') return `${name} (Left)`;
  if (side === 'right') return `${name} (Right)`;
  return name;
}

type Tooltip = { label: string; level: number | null; x: number; y: number };

export default function BodyMapDisplay({
  sorenessRows,
  sex = 'male',
  scale = 0.85,
}: {
  sorenessRows: SorenessRow[];
  sex?: string;
  scale?: number;
}) {
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);

  const variant = sex.toLowerCase() === 'female' ? 'female' : 'male';
  const Wrapper = variant === 'female' ? SvgFemaleWrapper : SvgMaleWrapper;

  const sorenessMap: Record<string, number> = {};
  for (const row of sorenessRows) {
    const slug = dbToSlug(row.BodyPartName, row.Side);
    sorenessMap[slug] = row.SorenessLevel;
  }

  const showTooltip = (slug: string, e: React.MouseEvent) => {
    const level = sorenessMap[slug] ?? null;
    setTooltip({ label: slugToLabel(slug), level, x: e.clientX, y: e.clientY });
  };

  function renderSide(side: 'front' | 'back') {
    const bodyData =
      side === 'front'
        ? variant === 'female' ? bodyFemaleFront : bodyFront
        : variant === 'female' ? bodyFemaleBack : bodyBack;

    const svgH = 400 * scale;
    const topCrop = Math.round((165 / 1448) * svgH);

    return (
      <div key={side} className="flex flex-col items-center">
        <div style={{ overflow: 'hidden', height: svgH - topCrop, position: 'relative' }}>
          <div style={{ marginTop: -topCrop }}>
            <Wrapper scale={scale} side={side} border="none">
              <g>
                {bodyData.map((muscle) => {
                  if (muscle.slug === 'hair' || muscle.slug === 'head') return null;

                  const hc = muscle.hitPath?.common ?? [];
                  const hl = muscle.hitPath?.left ?? [];
                  const hr = muscle.hitPath?.right ?? [];

                  const eventsFor = (slug: string) => ({
                    className: 'cursor-pointer',
                    onMouseEnter: (e: React.MouseEvent) => showTooltip(slug, e),
                    onMouseMove:  (e: React.MouseEvent) => showTooltip(slug, e),
                    onMouseLeave: () => setTooltip(null),
                  });

                  return (
                    <g key={muscle.slug}>
                      {/* Visual paths — events only applied when no hitPath exists for that subpart */}
                      {muscle.path.common?.map((d, i) => (
                        <path key={`${muscle.slug}-c-${i}`} d={d}
                          fill={muscleColor(muscle.slug, sorenessMap)}
                          stroke="white" strokeWidth="2" opacity={0.85}
                          {...(hc.length === 0 ? eventsFor(muscle.slug) : {})} />
                      ))}
                      {muscle.path.left?.map((d, i) => (
                        <path key={`${muscle.slug}-l-${i}`} d={d}
                          fill={muscleColor(`${muscle.slug}_left`, sorenessMap)}
                          stroke="white" strokeWidth="2" opacity={0.85}
                          {...(hl.length === 0 ? eventsFor(`${muscle.slug}_left`) : {})} />
                      ))}
                      {muscle.path.right?.map((d, i) => (
                        <path key={`${muscle.slug}-r-${i}`} d={d}
                          fill={muscleColor(`${muscle.slug}_right`, sorenessMap)}
                          stroke="white" strokeWidth="2" opacity={0.85}
                          {...(hr.length === 0 ? eventsFor(`${muscle.slug}_right`) : {})} />
                      ))}
                      {/* Invisible hit paths for accurate hover detection */}
                      {hc.map((d, i) => (
                        <path key={`${muscle.slug}-hc-${i}`} d={d}
                          fill="transparent" stroke="none"
                          {...eventsFor(muscle.slug)} />
                      ))}
                      {hl.map((d, i) => (
                        <path key={`${muscle.slug}-hl-${i}`} d={d}
                          fill="transparent" stroke="none"
                          {...eventsFor(`${muscle.slug}_left`)} />
                      ))}
                      {hr.map((d, i) => (
                        <path key={`${muscle.slug}-hr-${i}`} d={d}
                          fill="transparent" stroke="none"
                          {...eventsFor(`${muscle.slug}_right`)} />
                      ))}
                    </g>
                  );
                })}
              </g>
            </Wrapper>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-row items-start gap-1">
      {renderSide('front')}
      {renderSide('back')}
      {/* Tooltip — fixed so it's never clipped by overflow:hidden */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded-lg bg-slate-800 border border-slate-600 px-2.5 py-1.5 text-xs shadow-lg whitespace-nowrap"
          style={{ left: tooltip.x + 12, top: tooltip.y - 36 }}
        >
          <span className="text-slate-200 font-medium">{tooltip.label}</span>
          {tooltip.level !== null ? (
            <span className={`ml-2 font-semibold tabular-nums ${
              tooltip.level >= 7 ? 'text-red-400' :
              tooltip.level >= 4 ? 'text-yellow-400' : 'text-green-400'
            }`}>{tooltip.level}/10</span>
          ) : (
            <span className="ml-2 text-slate-500">No soreness</span>
          )}
        </div>
      )}
    </div>
  );
}
