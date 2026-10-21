import React from 'react';
import Svg, { Circle, Ellipse, Line, Path } from 'react-native-svg';

import type { useColors } from '@/hooks/useColors';

export type AnimalId = 'dog' | 'cat';
export type MascotPalette = ReturnType<typeof useColors>;

export const animalInfo: Record<
  AnimalId,
  { name: string; subtitle: string; colorKey: 'coral' | 'marigold' | 'teal' | 'tangerine' | 'lilac' }
> = {
  dog: { name: 'Köpek', subtitle: 'Neşeli hav hav', colorKey: 'coral' },
  cat: { name: 'Kedi', subtitle: 'Meraklı miyav', colorKey: 'marigold' },
};

export function AnimalMascot({
  animal,
  colors,
  size = 120,
  muted = false,
}: {
  animal: AnimalId;
  colors: MascotPalette;
  size?: number;
  muted?: boolean;
}) {
  const body = muted ? colors.locked : animal === 'dog' ? colors.coralLight : colors.marigold;
  const ink = muted ? colors.lockedSurface : colors.inkSoft;
  const inner = muted ? colors.lockedSurface : colors.whiteWarm;
  const spot = muted ? colors.lockedSurface : colors.coral;

  const face = (
    <>
      <Ellipse cx="60" cy="73" rx="5" ry="7" fill={ink} />
      <Circle cx="43" cy="59" r="4.5" fill={ink} />
      <Circle cx="77" cy="59" r="4.5" fill={ink} />
      <Circle cx="41.5" cy="57.5" r="1.5" fill={inner} />
      <Circle cx="75.5" cy="57.5" r="1.5" fill={inner} />
      <Path d="M53 82 Q60 89 67 82" fill="none" stroke={ink} strokeWidth="2.8" strokeLinecap="round" />
    </>
  );

  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" accessibilityLabel={`${animalInfo[animal].name} maskotu`}>
      <Circle cx="60" cy="60" r="54" fill={muted ? colors.lockedSurface : colors.whiteWarm} opacity={0.5} />
      {animal === 'dog' && (
        <>
          <Ellipse cx="28" cy="50" rx="17" ry="27" fill={muted ? colors.locked : colors.tangerine} transform="rotate(22 28 50)" />
          <Ellipse cx="92" cy="50" rx="17" ry="27" fill={muted ? colors.locked : colors.tangerine} transform="rotate(-22 92 50)" />
          <Circle cx="60" cy="61" r="38" fill={body} />
          <Ellipse cx="48" cy="51" rx="12" ry="16" fill={inner} opacity={0.55} />
          <Circle cx="42" cy="48" r="10" fill={spot} opacity={0.78} />
          {face}
        </>
      )}
      {animal === 'cat' && (
        <>
          <Path d="M29 42 L32 16 Q33 12 37 16 L53 29" fill={body} />
          <Path d="M91 42 L88 16 Q87 12 83 16 L67 29" fill={body} />
          <Circle cx="60" cy="62" r="38" fill={body} />
          {face}
          <Line x1="38" y1="73" x2="19" y2="68" stroke={ink} strokeWidth="2" opacity={0.7} />
          <Line x1="82" y1="73" x2="101" y2="68" stroke={ink} strokeWidth="2" opacity={0.7} />
        </>
      )}
    </Svg>
  );
}