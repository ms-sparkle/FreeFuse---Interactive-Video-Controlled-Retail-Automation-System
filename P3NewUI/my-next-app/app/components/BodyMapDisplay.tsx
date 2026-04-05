"use client";
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

export default function BodyMapDisplay({
  sorenessRows,
  sex = 'male',
  scale = 0.85,
}: {
  sorenessRows: SorenessRow[];
  sex?: string;
  scale?: number;
}) {
  const variant = sex.toLowerCase() === 'female' ? 'female' : 'male';
  const Wrapper = variant === 'female' ? SvgFemaleWrapper : SvgMaleWrapper;

  const sorenessMap: Record<string, number> = {};
  for (const row of sorenessRows) {
    const slug = dbToSlug(row.BodyPartName, row.Side);
    sorenessMap[slug] = row.SorenessLevel;
  }

  function renderSide(side: 'front' | 'back') {
    const bodyData =
      side === 'front'
        ? variant === 'female' ? bodyFemaleFront : bodyFront
        : variant === 'female' ? bodyFemaleBack : bodyBack;

    const svgH = 400 * scale;
    const topCrop = Math.round((165 / 1448) * svgH);

    return (
      <div key={side} className="flex flex-col items-center">
        <div style={{ overflow: 'hidden', height: svgH - topCrop }}>
          <div style={{ marginTop: -topCrop }}>
            <Wrapper scale={scale} side={side} border="none">
              <g>
                {bodyData.map((muscle) => {
                  if (muscle.slug === 'hair' || muscle.slug === 'head') return null;
                  return (
                    <g key={muscle.slug}>
                      {muscle.path.common?.map((d, i) => (
                        <path key={`${muscle.slug}-c-${i}`} d={d}
                          fill={muscleColor(muscle.slug, sorenessMap)}
                          stroke="white" strokeWidth="2" opacity={0.85} />
                      ))}
                      {muscle.path.left?.map((d, i) => (
                        <path key={`${muscle.slug}-l-${i}`} d={d}
                          fill={muscleColor(`${muscle.slug}_left`, sorenessMap)}
                          stroke="white" strokeWidth="2" opacity={0.85} />
                      ))}
                      {muscle.path.right?.map((d, i) => (
                        <path key={`${muscle.slug}-r-${i}`} d={d}
                          fill={muscleColor(`${muscle.slug}_right`, sorenessMap)}
                          stroke="white" strokeWidth="2" opacity={0.85} />
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
    </div>
  );
}
