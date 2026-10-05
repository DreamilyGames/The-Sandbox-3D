import { useState, useEffect } from 'react';
import * as THREE from 'three';

interface SBThreeJSTexturePreviewProps {
  children: React.ReactNode;
  texture: THREE.Texture | null;
}

export function SBThreeJSTexturePreview({ children, texture }: SBThreeJSTexturePreviewProps) 
{
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => 
  {
    if (!texture || !texture.image) return;

    const img = texture.image;

    // Case A: Image is an HTMLImageElement (e.g., loaded via TextureLoader)
    if (img instanceof HTMLImageElement || img instanceof HTMLCanvasElement) {
      if (img instanceof HTMLImageElement && img.src) {
        setImageSrc(img.src);
        console.log('html image')
      } else {
        // Convert canvas element to Data URL
        setImageSrc((img as HTMLCanvasElement).toDataURL());
        console.log('html canvas')
      }
    } 
    // Case B: Image is an ImageBitmap (common in modern glTF/R3F loaders)
    else if (typeof ImageBitmap !== 'undefined' && img instanceof ImageBitmap) {
        console.log('img bitmap')
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        setImageSrc(canvas.toDataURL('image/png'));
        console.log('valid ctx')
      }
    }
  }, [texture]);

  if (!imageSrc || !texture
    || !texture.image
  ) return <div className="text-xs text-slate-500">No {children} Texture</div>;

  return (
    <div className="flex-1 p-2 bg-slate-900 rounded border border-slate-800">
      <div className="text-left items-start">
        <label className="text-left py-3 text-xs font-medium text-slate-300
        ">{children} Texture</label>
      </div>
      
      <div className="flex-1 py-3 items-center justify-between">
        <img
          src={imageSrc}
          alt={`${children} Texture Preview`}
          className="w-32 h-32 object-cover rounded border border-slate-700"
        />
      </div>
      
    </div>
  );
}