
import { PivotControls } from '@react-three/drei'
import  { useFrame, type ThreeEvent } from '@react-three/fiber'
import { type OrbitControls as OrbitControlsImpl } from 'three-stdlib'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three'
import { easing } from 'maath'
import {useSelectActorStore} from '../../World/SBWorld'
import {v4 as uuidv4} from 'uuid';
import { SBActor } from '../SBActor';
import { useCameraCtrlStore } from '../../World/SBCamera';
import { SBMesh } from './SBMesh';
import { HTMLSimplifiedMesh } from './HTMLSBSimplifiedMesh';
import { HTMLSBActor } from '../HTMLSBActor';
import { useWorldStore, type SBWorldStoreState } from '../../World/SBWorldStore';

/**
 * Constructs a 3D mesh object from a THREE.Mesh.
 * @param enablePivotCtrls - Whether to enable pivot controls for the mesh.
 * @param mesh - Target mesh.
 * @param camCtrlRef - A reference to the camera controls for interaction.
 * @param camRotatingFlag - A flag indicating whether the camera is currently rotating.
 */
export function HTMLSBMesh({enablePivotCtrls, sbmesh, children
}: 
    { enablePivotCtrls: boolean, 
    sbmesh: SBMesh,
    children: React.ReactNode })
{
    const [isHovered, setHovered] = useState(false)
    const isHoveredNode = useSelectActorStore((state) => state.hoveredActor)
    const uOutlineAlphaRef = useRef({ value: 0 }); // Initial alpha
    const selectedActor = useSelectActorStore((state) => state.selectedActor);
    const setSelectedActor = useSelectActorStore((state) => state.setSelectedActor);
    const mouseDownPos = useRef<{ x: number; y: number }>({x:-1, y:-1});
    const actorVisibility = !sbmesh.useHiddenStore((state:any)=>state.hidden)

    const camRotatingFlag = useCameraCtrlStore((state:any) => state.orbitalCameraRotatingFlag)

    if(!sbmesh)
    {
        return
    }

    const mesh = sbmesh.object as THREE.Mesh
    if(!mesh)
    {
        return
    }
    

    
    const outlineMaterial = useMemo(() => 
        sbmesh.InvertedHullMaterial.clone(), [sbmesh.InvertedHullMaterial]);
    //const outlineMesh = useMemo(() => sbmesh.CloneMesh(false), [sbmesh]);

    // HTMLSBActor now carries the mesh's source transform. Render shallow,
    // identity-transform copies so the transform is not applied twice and R3F
    // does not reparent the original mesh out of the imported data hierarchy.
    // Geometry/material resources remain shared, so material editing still works.
    const [displayMesh, outlineMesh] = useMemo(() =>
    {
        const meshes = [sbmesh.CloneMesh(false), sbmesh.CloneMesh(false)]
        meshes.forEach((copy) =>
        {
            copy.matrixAutoUpdate = false
            copy.matrix.identity()
            copy.matrix.decompose(copy.position, copy.quaternion, copy.scale)
            copy.matrixWorldNeedsUpdate = true
        })
        return meshes
    }, [sbmesh]);

    const gWorld = useWorldStore((state:SBWorldStoreState) => state.world)
    
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
        const targetAlpha = ((isHovered) || (selectedActor==sbmesh) || (isHoveredNode == sbmesh)) ? 1.0 : 0.0;

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
            <HTMLSBActor sbactor={sbmesh} drawPrimitive={false} enablePivotCtrls={enablePivotCtrls}>
                <group>
                    {/* We will use this to create a low-poly hitbox for the model for cursor
                        detection in the future. */
                    <HTMLSimplifiedMesh mesh={sbmesh} vertRetain={0.1} 
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
                                if(selectedActor == sbmesh)
                                {
                                    //Deselect
                                    setSelectedActor(null)
                                }
                                else
                                {
                                    setSelectedActor(sbmesh)
                                }
                            }
                            
                        }}
                        visible = {false}
                    />
                    }
                    

                    {/* The original (complex) model for display */}
                    <group raycast={() => null}>
                        <primitive object={displayMesh} visible={actorVisibility} />

                        <primitive object={outlineMesh} visible={actorVisibility} />
                    </group>
                </group>

                {children}
                
            </HTMLSBActor>
        </>
    );
}