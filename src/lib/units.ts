const ML_PER_OZ = 29.5735295625;

export function mlToOz(ml: number): number {
  return ml / ML_PER_OZ;
}

export function ozToMl(oz: number): number {
  return Math.round(oz * ML_PER_OZ);
}

export function formatVolume(ml: number, unit: 'ml' | 'oz'): string {
  if (unit === 'oz') {
    return `${mlToOz(ml).toFixed(1)} oz`;
  }
  return `${Math.round(ml)} ml`;
}
