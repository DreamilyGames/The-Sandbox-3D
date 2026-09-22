import { useGLTF } from '@react-three/drei'
import { type OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useMemo, useRef } from 'react';
import * as THREE from 'three'
import { SBModelComponent } from './SBModelComponent'
import {v4 as uuidv4} from 'uuid';

/**
 * Constructs a 3D model from a GLTF file.
 * @param enablePivotCtrls - Whether to enable pivot controls for the model.
 * @param modelPath - The path to the GLTF model file.
 * @param camCtrlRef - A reference to the camera controls for interaction.
 * @param camRotatingFlag - A flag indicating whether the camera is currently rotating.
 * @returns A DOM object ready for rendering in a React Three Fiber scene
 */
export function SBModel({enablePivotCtrls, modelPath, camCtrlRef, camRotatingFlag}: 
    { enablePivotCtrls: boolean, 
    modelPath: string, 
    camCtrlRef: React.RefObject<OrbitControlsImpl | null>, 
    camRotatingFlag: boolean })
{
    const gltf = useGLTF(modelPath)

    const meshesInGLTF = useRef<{ref: THREE.Mesh, key: string}[]>([]);
    useMemo(()=>
    {
        let i = 0
        gltf.scene.updateMatrixWorld(true)
        gltf.scene.traverse((child)=>
        {
            const mesh = child as THREE.Mesh;
            if (mesh.isMesh) 
            {
                meshesInGLTF.current.push({ref: mesh, key: uuidv4()})
                ++i
            }
        })
    }, [gltf.scene])

    return(
        <>
            {meshesInGLTF.current.map( (child) => 
            (
                <SBModelComponent enablePivotCtrls={enablePivotCtrls}
                mesh={child.ref}
                camCtrlRef={camCtrlRef}
                camRotatingFlag={camRotatingFlag}
                key={child.key} />
            ))}
        </>
    )
}