import * as THREE from 'three'
import { SBActor } from '../SBActor';

export class SBMesh extends SBActor
{
    Dispose()
    {
        const mesh = this.object as THREE.Mesh
        if (mesh.geometry) 
        {
            mesh.geometry.dispose();
        }

        // 2. Dispose Materials & Textures
        if (mesh.material) 
        {
            const materials = Array.isArray(mesh.material)
                ? mesh.material as Array<THREE.Material>
                : [mesh.material];

            materials.forEach((material) => {
                // Dispose any textures attached to the material properties
                for (const key of Object.keys(material)) {
                const value = (material as any)[key];
                if (value instanceof THREE.Texture) {
                    value.dispose();
                }
                }

                // Handle custom ShaderMaterial uniforms containing textures
                if (material instanceof THREE.ShaderMaterial && material.uniforms) {
                for (const uKey of Object.keys(material.uniforms)) {
                    const uVal = material.uniforms[uKey].value;
                    if (uVal instanceof THREE.Texture) {
                    uVal.dispose();
                    }
                }
                }
                
                (material as THREE.Material).dispose();
            });
        }

        super.Dispose()
    }
}