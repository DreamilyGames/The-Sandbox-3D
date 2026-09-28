import { useState, useEffect } from 'react';
import * as THREE from 'three';

interface SBThreeJSTexturePreviewProps {
  texture: THREE.Texture | null;
}

export function SBThreeJSTexturePreview({ texture }: SBThreeJSTexturePreviewProps) 
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

  if (!imageSrc) return <div className="text-xs text-slate-500">No texture preview</div>;

  return (
    <div className="p-2 bg-slate-900 rounded border border-slate-800">
      <img
        src={imageSrc}
        alt="Material Texture Preview"
        className="w-32 h-32 object-cover rounded border border-slate-700"
      />
    </div>
  );
}