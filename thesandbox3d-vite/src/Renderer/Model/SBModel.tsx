import { PivotControls, useGLTF } from '@react-three/drei'
import  { useFrame, useLoader, type ThreeElements, type ThreeEvent } from '@react-three/fiber'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { type OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { MeshoptSimplifier } from 'meshoptimizer'
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three'
import { easing } from 'maath'
import '../../World/SBWorld'

interface SimplifiedModelProps extends React.ComponentPropsWithoutRef<'primitive'> 
{
  modelScene: THREE.Group
  vertRetain: number
}

/**
 * Simplifies a 3D model by reducing its vertex count and applying flat shading.
 * @param modelScene - The 3D model scene to simplify.
 * @param vertRetain - The percentage of vertices to retain (between 0 and 1). 
 * @returns 
 */
function SimplifiedModel({ modelScene, vertRetain, ...props }: 
    SimplifiedModelProps) 
{
  const scene = modelScene.clone();

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

  return <primitive {...props} object={lowPolyScene}  />;
}

// Simple custom shader to create an inverted shell outline
const InvertedHullMaterial = {
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
};

export function SBModel({withPivotCtrls, modelPath, camCtrlRef, camRotatingFlag}: 
    { withPivotCtrls: boolean, 
    modelPath: string, 
    camCtrlRef: React.RefObject<OrbitControlsImpl | null>, 
    camRotatingFlag: boolean })
{
    const gltf = useGLTF(modelPath)
    const [isHovered, setHovered] = useState(false)
    const uOutlineAlphaRef = useRef({ value: 0 }); // Initial alpha
    
    const outlineMaterial = useMemo(() => 
        new THREE.ShaderMaterial(InvertedHullMaterial), []);

    const gltfScene2 = useMemo(() => 
        gltf.scene.clone(), [gltf.scene]);

    useFrame((state, delta) => 
    {
        const targetAlpha = isHovered ? 1.0 : 0.0; // Scale factor, not pixel width

        easing.damp(
        uOutlineAlphaRef.current,
        'value',
        targetAlpha,
        0.03, // Faster growth speed
        delta
        );

        // Apply mutated uniform
        outlineMaterial.uniforms.uOutlineAlpha.value = uOutlineAlphaRef.current.value;
    });

    useEffect(() => 
    {
        gltfScene2.traverse((child ) =>
        {
            const mesh = child as THREE.Mesh;
            if (mesh.isMesh) 
            {
                // Replace or modify the material
                mesh.material = outlineMaterial
            }
        })
    }, [gltfScene2])

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
                    {/* We will use this to create a low-poly hitbox for the model for cursor
                        detection in the future. */
                    <SimplifiedModel modelScene={gltf.scene} vertRetain={0.1} 
                        onPointerOver = 
                        {(e: ThreeEvent<MouseEvent>) => 
                        {
                            if(!camRotatingFlag)
                            setHovered(true)
                        }}
                        onPointerOut = 
                        {
                            (e: ThreeEvent<MouseEvent>) => setHovered(false)
                        }
                        onClick = {(e: ThreeEvent<MouseEvent>) =>
                        {
                            e.stopPropagation()
                            
                        }}
                        visible = {false}
                    />
                    }
                    

                    {/* The original (complex) model for display */}
                    <group dispose={null} raycast={() => null}>
                        <primitive object={gltf.scene}
                        
                        
                        visible = {true}
                        >
                        </primitive>

                        
                        <primitive object={gltfScene2}/>
                    </group>
                </group>
                
            </PivotControls>
        </>
    )
}