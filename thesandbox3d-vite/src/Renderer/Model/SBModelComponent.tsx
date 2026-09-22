import { PivotControls } from '@react-three/drei'
import  { useFrame, type ThreeEvent } from '@react-three/fiber'
import { type OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { MeshoptSimplifier } from 'meshoptimizer'
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three'
import { easing } from 'maath'
import {useSelectModelStore} from '../../World/SBWorld'
import {v4 as uuidv4} from 'uuid';

/**
 * Clone a THREE.Mesh. Optionally includes its geometries and materials
 * to ensure that the original model remains unaltered if requested.
 * @param mesh - Target mesh
 * @param deepClone - Whether to perform a deep clone of the mesh (default: true).
 * @param cloneGeometriesAndMaterials - Whether to clone geometries and materials (default: false).
 * @returns The cloned 3D mesh
 */
export function CloneMesh(mesh: THREE.Mesh, 
    deepClone: boolean = true,
    cloneGeometriesAndMaterials: boolean = false): THREE.Mesh
{
    const clonedMesh = mesh.clone(deepClone)

    if(cloneGeometriesAndMaterials)
    {
        // Traverse and clone individual geometries/index buffers
        // Clone the geometry so vertex and index buffers are detached
        clonedMesh.geometry = mesh.geometry.clone()
        clonedMesh.matrixWorld = mesh.matrixWorld

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

/**
 * The properties of the SimplifiedMesh component.
 */
interface SimplifiedMeshProps extends React.ComponentPropsWithoutRef<'primitive'> 
{
  mesh: THREE.Mesh // The 3D mesh to simplify
  vertRetain: number // The percentage of vertices to retain (between 0 and 1)
}

/**
 * Simplifies a 3D model by reducing its vertex count and applying flat shading.
 * @param mesh - The 3D mesh to simplify.
 * @param vertRetain - The percentage of vertices to retain (between 0 and 1). 
 * @returns A DOM object ready for rendering in a React Three Fiber scene
 */
function SimplifiedMesh({ mesh, vertRetain, ...props }: 
    SimplifiedMeshProps) 
{
  const lowPolyMesh = useMemo(() => 
  {
    // Deep clone to avoid mutating the original
    const clonedMesh = CloneMesh(mesh, true, true) 

    const asyncFunc = async () =>
    {
        const geometry = clonedMesh.geometry;
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
        
        // For Debug only
        // Compute flat normals for classic low-poly faceted look
        /**clonedMesh.geometry.computeVertexNormals();
        if (clonedMesh.material) 
        {
          (clonedMesh.material as THREE.MeshStandardMaterial).flatShading = true;
          (clonedMesh.material as THREE.MeshStandardMaterial).needsUpdate = true;
        }**/
    }

    asyncFunc()

    return clonedMesh;

  }, 
  [mesh]);

  return <mesh uuid={lowPolyMesh.uuid} geometry={lowPolyMesh.geometry}
  material={lowPolyMesh.material} matrix={lowPolyMesh.matrixWorld} matrixAutoUpdate={false}
  {...props}/>;
}

// An instance of a simple custom shader to create an inverted shell outline
const InvertedHullMaterial = new THREE.ShaderMaterial({
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
});

/**
 * Constructs a 3D mesh object from a THREE.Mesh.
 * @param enablePivotCtrls - Whether to enable pivot controls for the mesh.
 * @param mesh - Target mesh.
 * @param camCtrlRef - A reference to the camera controls for interaction.
 * @param camRotatingFlag - A flag indicating whether the camera is currently rotating.
 */
export function SBModelComponent({enablePivotCtrls, mesh, camCtrlRef, camRotatingFlag}: 
    { enablePivotCtrls: boolean, 
    mesh: THREE.Mesh,
    camCtrlRef: React.RefObject<OrbitControlsImpl | null>, 
    camRotatingFlag: boolean })
{
    const [isHovered, setHovered] = useState(false)
    const uOutlineAlphaRef = useRef({ value: 0 }); // Initial alpha
    const selectedModel = useSelectModelStore((state:any) => state.selectedModel);
    const setSelectedModel = useSelectModelStore((model:any) => model.setSelectedModel);
    const mouseDownPos = useRef<{ x: number; y: number }>({x:-1, y:-1});
    
    const outlineMaterial = useMemo(() => 
        InvertedHullMaterial.clone(), [InvertedHullMaterial]);
    const outlineMesh = useMemo(() => CloneMesh(mesh), [mesh]);
    
    useEffect(() => 
        {
            if(Array.isArray(outlineMesh.material))
            {
                // Replace or modify the material
                outlineMesh.material.fill(outlineMaterial)
            }
            else if(outlineMesh.material)
            {
                // Replace or modify the material
                outlineMesh.material = outlineMaterial
            }
                    
        }, [outlineMesh])

    useFrame((state, delta) => 
    { 
        const targetAlpha = (isHovered || (selectedModel==mesh)) ? 1.0 : 0.0;

        easing.damp(
        uOutlineAlphaRef.current,
        'value',
        targetAlpha,
        0.03, // Faster growth speed
        delta
        );

        // Apply mutated uniform
        outlineMaterial
        .uniforms.uOutlineAlpha.value = uOutlineAlphaRef.current.value;
    });

    return(
        <>
            <PivotControls
            enabled={enablePivotCtrls && (selectedModel==mesh)}
            
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
                    <SimplifiedMesh mesh={mesh} vertRetain={0.1} 
                        onPointerOver = 
                        {(e: ThreeEvent<MouseEvent>) => 
                        {
                            e.stopPropagation()

                            if(!camRotatingFlag)
                            {
                                setHovered(true)
                            }
                            
                        }}
                        onPointerOut = 
                        {
                            (e: ThreeEvent<MouseEvent>) => setHovered(false)
                        }
                        onPointerDown =
                        {(e: ThreeEvent<PointerEvent>) =>
                            {
                                e.stopPropagation()
                                mouseDownPos.current = {x: e.clientX, y: e.clientY}
                            }
                        }
                        onClick = {(e: ThreeEvent<MouseEvent>) =>
                        {
                            e.stopPropagation()
                            // Calculate distance moved between pointer down and click release
                            const deltaX = e.clientX - mouseDownPos.current.x;
                            const deltaY = e.clientY - mouseDownPos.current.y;
                            const distance = Math.hypot(deltaX, deltaY);

                            // 5px threshold: If moved more than 5 pixels, 
                            // treat as an OrbitControls drag
                            if (distance > 3) 
                            {
                                return; // Ignore false click
                            }
                            else
                            {
                                if(selectedModel)
                                {
                                    //Deselect
                                    setSelectedModel(null)
                                }
                                else
                                {
                                    setSelectedModel(mesh)
                                }
                            }
                            
                        }}
                        visible = {false}
                    />
                    }
                    

                    {/* The original (complex) model for display */}
                    <group raycast={() => null}>

                        <mesh uuid={mesh.uuid}
                                geometry={mesh.geometry}
                                material={mesh.material}
                                matrix={mesh.matrixWorld}
                                matrixAutoUpdate={false}>
                        </mesh>

                        <mesh uuid={outlineMesh.uuid}
                                geometry={outlineMesh.geometry}
                                material={outlineMesh.material}
                                matrix={outlineMesh.matrixWorld}
                                matrixAutoUpdate={false}>
                        </mesh>
                    </group>
                </group>
                
            </PivotControls>
        </>
    );
}