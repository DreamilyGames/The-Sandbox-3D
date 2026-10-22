import * as THREE from 'three';

export function GetHexColorFromThreeColor(color: THREE.Color): string 
{
    return `#${color.getHexString()}`;
}