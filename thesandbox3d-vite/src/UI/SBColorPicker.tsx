import { useState, useEffect } from 'react';
import * as THREE from 'three';

interface MaterialColorPickerProps {
  mesh: THREE.Mesh | null;
}

export function SBColorPicker({ mesh }: MaterialColorPickerProps) 
{
  const [currentColor, setCurrentColor] = useState<string>('#ffffff');
  const [supportedMaterial, setSupportedMaterial] = useState<THREE.Material | null>(null);

  useEffect(() => 
  {
    if (!mesh) 
    {
      setSupportedMaterial(null);
      return;
    }

    // Handle single material or pick the first from a multi-material array
    const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
    if (!mat) 
    {
      setSupportedMaterial(null);
      return;
    }

    // Check if the material supports color (Standard, Basic, Physical, Phong, Lambert)
    if ('color' in mat && (mat as any).color instanceof THREE.Color) 
    {
      const hexColor = `#${(mat as any).color.getHexString()}`;
      setCurrentColor(hexColor);
      setSupportedMaterial(mat);
    } else 
    {
      setSupportedMaterial(null);
    }
  }, [mesh]);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => 
  {
    const newHex = e.target.value;
    setCurrentColor(newHex);

    if (supportedMaterial && 'color' in supportedMaterial) 
    {
      // 1. Update the THREE.Color object
      (supportedMaterial as any).color.set(newHex);

      // 2. Mark material as needing a GPU update
      supportedMaterial.needsUpdate = true;
    }
  };

  if (!mesh) 
  {
    return <div className="text-xs text-slate-500 italic">No mesh selected</div>;
  }

  if (!supportedMaterial) 
  {
    return (
      <div className="text-xs text-slate-500 italic p-2 bg-slate-900 rounded border border-slate-800">
        Selected material (${mesh.material ? (mesh.material as THREE.Material).type : `null`}) does not support direct color modifications.
      </div>
    );
  }

  return (
    <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-300">Material Color</label>
        <span className="text-xs font-mono text-slate-400 uppercase">{currentColor}</span>
      </div>

      <div className="flex items-center space-x-3">
        {/* HTML Color Input */}
        <input
          type="color"
          value={currentColor}
          onChange={handleColorChange}
          className="w-10 h-10 rounded border border-slate-700 bg-transparent cursor-pointer p-0.5 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded"
        />

        {/* Quick Swatches (Optional Preset Buttons) */}
        <div className="flex items-center space-x-1.5">
          {['#ff0000', '#00ff00', '#0088ff', '#ffffff', '#111111'].map((preset) => (
            <button
              key={preset}
              onClick={() => {
                handleColorChange({ target: { value: preset } } as any);
              }}
              style={{ backgroundColor: preset }}
              className="w-5 h-5 rounded-full border border-slate-700 hover:scale-110 transition-transform"
              title={preset}
            />
          ))}
        </div>
      </div>
    </div>
  );
}