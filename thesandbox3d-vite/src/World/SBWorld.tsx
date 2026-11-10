import type { Ref } from 'react'
import { create } from 'zustand'
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { SBActor } from '../Actor/SBActor';
import * as THREE from 'three';
import { SBActorFactory } from '../Actor/SBActorFactory'
import { type OrbitControls as OrbitControlsImpl } from 'three-stdlib'

export const useSelectActorStore = create<
{
    selectedActor: SBActor | null, 
    setSelectedActor: (actor: SBActor | null) => void

    hoveredActor: SBActor | null,
    setHoveredActor: (actor: SBActor | null) => void
}>()(
    subscribeWithSelector((set) => ({
        selectedActor: null,
        setSelectedActor: (actor: SBActor | null) => set({ selectedActor: actor }),

        hoveredActor: null,
        setHoveredActor: (actor: SBActor | null) => set({ hoveredActor: actor }),
    }))
)

export interface ISBWorld
{
    actors : Map<string, SBActor>;
    threeScene : (THREE.Group) | null;
}

export class SBWorld implements ISBWorld
{
    actors : Map<string, SBActor> = new Map<string, SBActor>;
    threeScene : (THREE.Group) | null = null;
    clonedThreeScene : (THREE.Group) | null = null;
    constructor(){}

    InstantiateActor(obj: THREE.Object3D) : SBActor | null
    {
        const actor = SBActorFactory.InstantiateActor(obj)
        if(actor && actor.object)
        {
            actor.object.matrixAutoUpdate = false
            return actor
        }
        return null
    }

    PopulateChildrenMap(actor: SBActor, recursive = false)
    {
        if(!actor.object)
            return

        //fill in the children map
        actor.object.children.forEach((child)=>
        {
            //instantiate it on the fly
            const childActor = this.InstantiateActor(child)
            if(childActor)
            {
                actor.children.set(childActor.uuid, childActor)
                childActor.parent = actor

                if(recursive)
                    this.PopulateChildrenMap(childActor, true)
            }
        })
    }

    /**
     * Sets the THREE scene of the current world. Actors' resources will not be freed/managed here.
     * @param scene 
     * @returns 
     */
    SetScene(scene: THREE.Group | null)
    {
        if(scene == this.threeScene)
            return

        if(!scene)
        {
            //discard scene
            this.threeScene = null
            this.actors.clear()
            return
        }

        this.actors.clear()
        this.threeScene = scene

        //populate actor list
        this.threeScene!.children.map((obj)=>
        {
            if(this.actors.has(obj.uuid))
            {
                return
            }

            const actor = this.InstantiateActor(obj)
            if(actor)
            {
                this.PopulateChildrenMap(actor, true)
                this.actors.set(actor.uuid, actor)
            }
        })
    }

    /**
     * Delete an actor and free its resources from memory (including its children).
     * @param
     * @returns 
     */
    DeleteActor(uuid: string)
    {
        const actor = this.actors.get(uuid)
        if(actor)
        {
            actor.Dispose()
            if(actor.object)
                this.threeScene?.remove(actor.object)
            this.actors.delete(uuid)
        }
    }

    /**
     * Build a detached export snapshot. Never bake transforms into live objects:
     * the renderer still applies the pivot, so doing so would apply it twice.
     */
    UpdateScene() : THREE.Group | null
    {
        if(!this.threeScene)
            return null

        const identityMatrix = new THREE.Matrix4()
        const cloneChildren = (
            source: THREE.Object3D,
            target: THREE.Object3D,
            actors: ReadonlyMap<string, SBActor>,
        ) =>
        {
            // Rebuild represented children from the actor map. Do not deep clone
            // their possibly stale source transforms or the R3F helper tree.
            actors.forEach((actor) =>
            {
                if(!actor.object)
                    return

                const cloned = actor.object.clone(false)
                const contentGroup = actor.childrenThreeGrp
                const pivotGroup = actor.childrenThreePivotGrp

                if(contentGroup?.matrixAutoUpdate)
                    contentGroup.updateMatrix()
                if(pivotGroup?.matrixAutoUpdate)
                    pivotGroup.updateMatrix()

                // In the viewport: parent -> pivot P -> source/content L.
                // Use LOCAL matrices. matrixWorld would bake ancestors twice.
                const localMatrix = contentGroup?.matrix ?? actor.object.matrix
                cloned.matrixAutoUpdate = false
                cloned.matrix.copy(localMatrix)
                cloned.matrix.decompose(cloned.position, cloned.quaternion, cloned.scale)
                cloned.matrixWorldNeedsUpdate = true
                
                if(pivotGroup && !pivotGroup.matrix.equals(identityMatrix))
                {
                    // Keep P and L on separate nodes. P * L can contain shear
                    // even when both factors are valid TRS matrices; collapsing
                    // them can change the result when a glTF loader decomposes it.
                    const pivotSnapshot = new THREE.Group()
                    pivotSnapshot.name = `${actor.object.name || actor.uuid}__pivot`
                    pivotSnapshot.matrixAutoUpdate = false
                    pivotSnapshot.matrix.copy(pivotGroup.matrix)
                    pivotSnapshot.matrix.decompose(
                        pivotSnapshot.position,
                        pivotSnapshot.quaternion,
                        pivotSnapshot.scale,
                    )
                    pivotSnapshot.matrixWorldNeedsUpdate = true
                    target.add(pivotSnapshot)
                    pivotSnapshot.add(cloned)
                }
                else
                    target.add(cloned)

                cloneChildren(actor.object, cloned, actor.children)
            })

            // Preserve source nodes not represented by the current factory
            // (for example an unsupported camera or a group).
            source.children.forEach((child) =>
            {
                if(!actors.has(child.uuid))
                    target.add(child.clone(true))
            })
        }

        const snapshot = this.threeScene.clone(false)
        cloneChildren(this.threeScene, snapshot, this.actors)
        snapshot.updateMatrixWorld(true)
        return snapshot
    }
}
