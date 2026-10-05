import * as THREE from 'three';

export function GetTailwindColor(varName: string, fallback = '#ffffff'): string 
{
  if (typeof window === 'undefined') return fallback;

  // Formats input safely whether passed as '--color-sky-500' or 'color-sky-500'
  const formattedVar = varName.startsWith('--') ? varName : `--${varName}`;
  const computedColor = getComputedStyle(document.documentElement)
    .getPropertyValue(formattedVar)
    .trim();

  return computedColor || fallback;
}