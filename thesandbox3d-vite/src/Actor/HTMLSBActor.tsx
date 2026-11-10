
import { PivotControls } from '@react-three/drei'
import { type OrbitControls as OrbitControlsImpl } from 'three-stdlib'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three'
import type { SBActor } from './SBActor';
import { useSelectActorStore } from '../World/SBWorld';
import { useCameraCtrlStore } from '../World/SBCamera';
import { useCmdManagerStore } from '../Core/Command/SBCommandManagerStore';
import { SBTransformActorCommand } from '../Core/Command/Commands/SBTransformActorCommand';

/**
 * Constructs a 3D actor object from a THREE.Mesh.
 * @param enablePivotCtrls - Whether to enable pivot controls for the actor.
 * @param mesh - Target mesh.
 * @param camCtrlRef - A reference to the camera controls for interaction.
 * @param camRotatingFlag - A flag indicating whether the camera is currently rotating.
 */
export function HTMLSBActor({enablePivotCtrls, drawPrimitive=true, sbactor, children
}: 
    { enablePivotCtrls: boolean,
        drawPrimitive: boolean,
    sbactor: SBActor,
    children: React.ReactNode })
{
    const selectedActor = useSelectActorStore((state) => state.selectedActor);
    const camCtrl = useCameraCtrlStore((state) => state.orbitalCameraCtrl)

    if(!sbactor)
    {
        return
    }

    const actor = sbactor.object as THREE.Object3D
    if(!actor)
    {
        return
    }

    const pivotCtrlRef = useRef<THREE.Group>(null)
    const groupRef = useRef<THREE.Group>(null)
    
    // Refs are populated during commit, not during render/useMemo.
    const setPivotGroup = useCallback((group: THREE.Group | null) =>
    {
        pivotCtrlRef.current = group
        sbactor.childrenThreePivotGrp = group
    }, [sbactor])

    const setContentGroup = useCallback((group: THREE.Group | null) =>
    {
        groupRef.current = group
        sbactor.childrenThreeGrp = group
    }, [sbactor])

    // Every actor, including meshes, owns its imported local transform here.
    // Keep it independent of the data object used to build export snapshots.
    const actorTransform = useMemo(
        () => sbactor.object?.matrix.clone() ?? new THREE.Matrix4(),
        [sbactor],
    )
    const [initialPivotCtrlTransform, setInitialPivotCtrlTransform] = useState(actor.matrix.clone());

    const cmdManager = useCmdManagerStore((state) => state.commandManager)

    return(
        <group>
            <PivotControls
            ref={setPivotGroup}
            enabled={enablePivotCtrls && (selectedActor==sbactor)}
            autoTransform={true}
            onDragStart={() => 
            {
                if(camCtrl)
                {
                    camCtrl.enabled = false
                }

                if(pivotCtrlRef.current)
                    setInitialPivotCtrlTransform(pivotCtrlRef.current.matrix.clone())
            }}
            onDrag={(l: THREE.Matrix4, deltaL: THREE.Matrix4, w: THREE.Matrix4, deltaW: THREE.Matrix4)=>
            {
                
            }}
            onDragEnd={() => 
            {
                if(camCtrl)
                {
                    camCtrl.enabled = true
                }

                if(pivotCtrlRef.current)
                {
                    const transformCommand = new SBTransformActorCommand(pivotCtrlRef, initialPivotCtrlTransform, 
                        pivotCtrlRef.current.matrix);
                    cmdManager.Add(transformCommand)
                }
            }}>

                <group ref={setContentGroup} matrixAutoUpdate={false} matrix={actorTransform}>
                    {children}
                </group>
                
            </PivotControls>
        </group>
    );
}