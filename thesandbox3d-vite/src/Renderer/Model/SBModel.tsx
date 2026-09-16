import { PivotControls, useGLTF } from '@react-three/drei'
import  { useLoader, type ThreeEvent } from '@react-three/fiber'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { SimplifyModifier, type OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { MeshoptSimplifier } from 'meshoptimizer'
import { useMemo } from 'react';
import * as THREE from 'three'

/**
 * Simplifies a 3D model by reducing its vertex count and applying flat shading.
 * @param modelPath - The path to the 3D model file (GLTF format).
 * @param vertRetain - The percentage of vertices to retain (between 0 and 1). 
 * @returns 
 */
function SimplifyModel({ modelPath, vertRetain }: { modelPath: string, vertRetain: number }) 
{
  const { scene } = useGLTF(modelPath);

  const lowPolyScene = useMemo(() => 
  {
    const clonedScene = scene.clone();

    clonedScene.traverse(async (child) => 
    {
      if ((child as THREE.Mesh).isMesh) 
    {
        const mesh = child as THREE.Mesh;

        const geometry = mesh.geometry;
        const positionAttribute = geometry.attributes.position;
        const indexAttribute = geometry.index;

        if (!indexAttribute) 
        {
            console.error('Geometry must be indexed to simplify.');
            return;
        }

        // Extract raw typed arrays and normalize them to the types expected by meshoptimizer.
        const vertices = positionAttribute.array instanceof Float32Array
          ? positionAttribute.array
          : new Float32Array(positionAttribute.array.buffer, 
            positionAttribute.array.byteOffset, 
            positionAttribute.array.byteLength / Float32Array.BYTES_PER_ELEMENT);
        const indices = indexAttribute.array instanceof Uint32Array
          ? indexAttribute.array
          : new Uint32Array(indexAttribute.array.buffer, 
            indexAttribute.array.byteOffset, 
            indexAttribute.array.byteLength / Uint32Array.BYTES_PER_ELEMENT);
        const indexCount = indices.length
        const vertexStride = 3; // x, y, z
        const targetIdxCount = Math.max(6, Math.floor(indexCount * vertRetain))
        const targetIdxCountMultiplesOf3 = 
        targetIdxCount - (targetIdxCount % 3); // Ensure count is a multiple of 3

        // Wait for module initialization if your meshoptimizer wrapper requires it:
        await MeshoptSimplifier.ready;

        // Call the simplifier
        // Returns a new Uint32Array containing the simplified indices
        const simplifiedIndices = MeshoptSimplifier.simplify(
            indices,
            vertices,
            vertexStride,
            targetIdxCountMultiplesOf3,
            0.1
        )

        // Update Three.js geometry index
        geometry.setIndex(new THREE.Uint32BufferAttribute(
            simplifiedIndices[0], 1));
        const geometryIndex = geometry.index;
        if (geometryIndex) {
          geometryIndex.needsUpdate = true;
        }
        
        // Compute flat normals for classic low-poly faceted look
        mesh.geometry.computeVertexNormals();
        if (mesh.material) 
        {
          (mesh.material as THREE.MeshStandardMaterial).flatShading = true;
          (mesh.material as THREE.MeshStandardMaterial).needsUpdate = true;
        }
      }
    });

    return clonedScene;
  }, 
  [scene]);

  return <primitive object={lowPolyScene} />;
}

export function SBModel({withPivotCtrls, modelPath, camCtrlRef}: 
    
    { withPivotCtrls: boolean, 
    modelPath: string, 
    camCtrlRef: React.RefObject<OrbitControlsImpl | null> })
{
    const gltf = useLoader(GLTFLoader, modelPath)

    return(
        <>
            <PivotControls
            enabled={withPivotCtrls}
            onDragStart={() => 
            {
                if(camCtrlRef.current)
                {
                    camCtrlRef.current.enabled = false
                }
            }}
            onDragEnd={() => 
            {
                if(camCtrlRef.current)
                {
                    camCtrlRef.current.enabled = true
                }
            }}>
                <group>
                    
                    <SimplifyModel modelPath={modelPath} vertRetain={0.1} />

                    {/* The original (complex) model for display */}
                    <group dispose={null} raycast={() => null}>
                        <primitive object={gltf.scene}
                        onClick = {(e: ThreeEvent<MouseEvent>) =>
                        {
                            e.stopPropagation()

                        }}
                        visible = {false}
                        raycast={() => null}
                        />
                    </group>
                </group>
                
            </PivotControls>
        </>
    )
}