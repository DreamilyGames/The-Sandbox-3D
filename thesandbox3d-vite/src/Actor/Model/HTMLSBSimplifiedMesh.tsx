import { useMemo } from "react"
import * as THREE from 'three'
import type { SBMesh } from "./SBMesh";
import { MeshoptSimplifier } from 'meshoptimizer'
/**
 * The properties of the SimplifiedMesh component.
 */
interface SimplifiedMeshProps extends React.ComponentPropsWithoutRef<'primitive'> 
{
    mesh: SBMesh // The 3D mesh to simplify
    vertRetain: number // The percentage of vertices to retain (between 0 and 1)
}

/**
 * Simplifies a 3D model by reducing its vertex count and applying flat shading.
 * @param mesh - The 3D mesh to simplify.
 * @param vertRetain - The percentage of vertices to retain (between 0 and 1). 
 * @returns A DOM object ready for rendering in a React Three Fiber scene
 */
export function HTMLSimplifiedMesh({ mesh, vertRetain, ...props }: 
    SimplifiedMeshProps) 
{
    const lowPolyMesh = useMemo(() => 
    {
    // Deep clone to avoid mutating the original
    const clonedMesh = mesh.CloneMesh(true, true) 

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

    try
    {
        asyncFunc()
    }
    catch(e)
    {

    }

    return clonedMesh;

    }, 
    [mesh]);

    //return <mesh uuid={lowPolyMesh.uuid} geometry={lowPolyMesh.geometry}
    //material={lowPolyMesh.material}
    //{...props}/>;
    return <primitive object={lowPolyMesh} {...props}/>;
}