import * as THREE from 'three'
import { SBActor } from '../SBActor';

export class SBMesh extends SBActor
{
    // An instance of a simple custom shader to create an inverted shell outline
    InvertedHullMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uOutlineColor: { value: new THREE.Color('cyan') },
        uOutlineAlpha: { value: 0 }, // Animated alpha
      },
      vertexShader: `
        const float cOutlineWidth = 0.01; // Default thickness
        void main() {
          // Scale vertex outward based on normal direction
          vec3 newPosition = position + normal * cOutlineWidth;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uOutlineColor;
        uniform float uOutlineAlpha;
        void main() {
          gl_FragColor = vec4(uOutlineColor * uOutlineAlpha, uOutlineAlpha);
        }
      `,
      side: THREE.BackSide, // Render only inner faces
      transparent: true,  // REQUIRED for smooth alpha fading
      depthWrite: false,   // Prevents alpha z-buffer clipping artifacts
    })

    /**
     * Clone the mesh. Optionally includes its geometries and materials
     * to ensure that the original model remains unaltered if requested.
     * @param mesh - Target mesh
     * @param deepClone - Whether to perform a deep clone of the mesh (default: true).
     * @param cloneGeometriesAndMaterials - Whether to clone geometries and materials (default: false).
     * @returns The cloned 3D mesh
     */
    CloneMesh( 
        deepClone: boolean = true,
        cloneGeometriesAndMaterials: boolean = false): THREE.Mesh
    {
        const mesh = this.object as THREE.Mesh
        const clonedMesh = mesh.clone(deepClone)
    
        if(cloneGeometriesAndMaterials)
        {
            // Traverse and clone individual geometries/index buffers
            // Clone the geometry so vertex and index buffers are detached
            clonedMesh.geometry = mesh.geometry.clone()
            clonedMesh.matrixWorld = mesh.matrixWorld.clone()
    
            //Independent material instances
            if (Array.isArray(mesh.material)) 
            {
                clonedMesh.material = mesh.material.map((mat) => mat.clone());
            } 
            else if (mesh.material) 
            {
                clonedMesh.material = mesh.material.clone();
            }
        }
    
        return clonedMesh;
    }

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