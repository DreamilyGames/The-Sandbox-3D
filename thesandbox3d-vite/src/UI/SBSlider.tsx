import { useState, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { Clamp } from '../Maths/SBBasicMaths';

interface SBSliderProps {
  children: React.ReactNode;
  mesh: THREE.Mesh | null;
  /** propName key on the material (e.g., 'roughness', 'metalness', 'opacity', 'transmission') */
  propName: string;
  numBoxEditable?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

export function SBSlider({
  children,
  mesh,
  propName,
  numBoxEditable = true,
  min = 0,
  max = 1,
  step = 0.01,
}: SBSliderProps) {
  const [value, setValue] = useState<number>(0);
  const [inputValue, setInputValue] = useState<string>('0.00');
  const [activeMaterial, setActiveMaterial] = useState<THREE.Material | null>(null);

  // Sync component state when the selected mesh or propName changes
  useEffect(() => {
    if (!mesh) {
      setActiveMaterial(null);
      return;
    }

    // Handle single material or first material in a multi-material array
    const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;

    if (mat && propName in mat && typeof (mat as any)[propName] === 'number') {
      setActiveMaterial(mat);
      setValue((mat as any)[propName]);
      setInputValue(((mat as any)[propName] as number).toFixed(2));
    } else {
      setActiveMaterial(null);
    }
  }, [mesh, propName]);

  const updateMaterialProperty = useCallback(
    (newValue: number) => {
      setValue(newValue);
      setInputValue(newValue.toFixed(2));

      if (activeMaterial && propName in activeMaterial) {
        // 1. Update the propName on the Three.js material
        (activeMaterial as any)[propName] = newValue;

        // 2. Special flags for specific properties
        if (propName === 'opacity') {
          activeMaterial.transparent = newValue < 1;
        }

        // 3. Mark material as needing GPU update
        activeMaterial.needsUpdate = true;
      }
    },
    [activeMaterial, propName]
  );

  // Handle range slider drag
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    updateMaterialProperty(val);
  };

  const handleNumInputChange = (newValue: string) => {
    const parsed = parseFloat(newValue);
    if (!isNaN(parsed)) 
    {
      updateMaterialProperty(Clamp(parsed, min, max));
    } 
    else 
    {
      // Reset input if invalid string was typed
      setInputValue(value.toFixed(2));
    }
  };

  // Handle direct text box typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Commit value on blur or when pressing Enter
  const handleInputBlurOrEnter = (e: React.FocusEvent<HTMLInputElement> | React.KeyboardEvent<HTMLInputElement>) => {
    if ('key' in e && e.key !== 'Enter') return;

    handleNumInputChange(inputValue)
  };

  const displayLabel = children || propName.charAt(0).toUpperCase() + propName.slice(1);

  if (!mesh) {
    return <div className="text-xs text-slate-500 italic">No mesh selected</div>;
  }

  if (!activeMaterial) {
    return null; // propName not supported by this material type (e.g., metalness on MeshBasicMaterial)
  }

  return (
    <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
      {/* Header: propName Label and Live Readout */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-300">{displayLabel}</label>

        {/* Editable Number Input */}
        <div className="flex items-center space-x-1">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlurOrEnter}
            onKeyDown={handleInputBlurOrEnter}
            className="w-16 text-right text-xs font-mono text-sky-400 
            bg-slate-950 px-1.5 py-0.5 rounded border border-slate-700 focus:outline-none 
            focus:border-sky-500 [appearance:textfield] 
            [&::-webkit-outer-spin-button]:appearance-none 
            [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
      </div>

      {/* Drag Bar Input */}
      <div className="relative flex items-center">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleSliderChange}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-400"
        />
      </div>

      {/* Range Indicators */}
      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}