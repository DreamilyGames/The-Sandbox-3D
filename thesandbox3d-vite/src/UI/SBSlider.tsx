import { useState, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { Clamp } from '../Maths/SBBasicMaths';

interface SBSliderProps {
  children: React.ReactNode;
  defaultValue?: number;
  onChange?: (newValue: number) => void;

  numBoxEditable?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

export function SBSlider({
  children,
  defaultValue,
  onChange,
  numBoxEditable = true,
  min = 0,
  max = 1,
  step = 0.01
}: SBSliderProps) 
{
  // TODO: If the defaultValue is infinite, 
  // we will add a checkbox to allow for infinite values. 
  // This is useful for properties like "Attenuation Distance" 
  // where a value of Infinity means "no attenuation".
  if(!Number.isFinite(defaultValue))
  {

  }

  const [value, setValue] = useState<number>(defaultValue ? defaultValue : 0);
  const [inputValue, setInputValue] = useState<string>(
    defaultValue ? 
    defaultValue.toFixed(2) : '0.00');

  const onChange_Internal = 
    (newValue: number) => {
      setValue(newValue);
      setInputValue(newValue.toFixed(2));
      if(onChange)
      {
        onChange(newValue);
      }
    }
  ;

  // Handle range slider drag
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onChange_Internal(val);
  };

  const handleNumInputChange = (newValue: string) => {
    const parsed = parseFloat(newValue);
    if (!isNaN(parsed)) 
    {
      onChange_Internal(Clamp(parsed, min, max));
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

  const displayLabel = children;

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