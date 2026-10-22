import { useState, useEffect, useCallback } from 'react';
import * as THREE from 'three';



interface SBColorPickerProps {
  children: React.ReactNode;
  defaultColor?: string; // Optional default color in hex format (e.g., '#ff0000')
  onChange?: (newColor: string) => void; // Optional callback for color changes
}

export function SBColorPicker({ children, defaultColor, onChange }: SBColorPickerProps) 
{
  const [currentColor, setCurrentColor] = useState<string>(
    defaultColor ? defaultColor : '#ffffff');

  const handleColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => 
  {
    const newHex = e.target.value;
    setCurrentColor(newHex);
    if(onChange)
    {
      onChange(newHex);
    }
  },[]);

  return (
    <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-300">{children}</label>
        <span className="text-xs font-mono text-slate-400 uppercase">{currentColor}</span>
      </div>

      <div className="flex items-center space-x-3">
        {/* HTML Color Input */}
        <input
          type="color"
          value={currentColor}
          onChange={handleColorChange}
          className="w-10 h-10 rounded border border-slate-700 bg-transparent 
          cursor-pointer p-0.5 [&::-webkit-color-swatch-wrapper]:p-0 
          [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded"
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
              className="w-5 h-5 rounded-full border border-slate-700 hover:scale-110 
              transition-transform"
              title={preset}
            />
          ))}
        </div>
      </div>
    </div>
  );
}