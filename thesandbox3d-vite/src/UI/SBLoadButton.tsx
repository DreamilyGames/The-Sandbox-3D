import { useRef, useState } from 'react';
import type { ButtonHTMLAttributes, ChangeEvent } from 'react';
import { FolderOpen } from 'lucide-react';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { Group } from 'three';
import { GetTailwindColor } from './SBTailwindCSSReader';

interface SBLoadButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 
'children' | 'onClick'> {
  onClick: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function SBLoadButton({
  onClick,
  className = '',
  disabled = false,
  ...buttonProps
}: SBLoadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
        className="hidden"
        onChange={(event) => 
        {
          onClick(event);
        }}
      />
      <button
        {...buttonProps}
        type="button"
        disabled={disabled || isLoading}
        onClick={() => {
          setError(null);
          inputRef.current?.click();
        }}
        aria-label={isLoading ? 'Loading model' : 'Load glTF model'}
        title={isLoading ? 'Loading model' : 'Load glTF model'}
        className={`inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-sky-400/30 bg-sky-600 text-white transition-colors hover:bg-sky-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      >
        <FolderOpen size={18} aria-hidden="true" 
        color={GetTailwindColor(`--color-default-white`)
          }/>
      </button>
    </div>
  );
}
