import type { Ref } from 'react'
import { create } from 'zustand'
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { SBActor } from '../Actor/SBActor';
import * as THREE from 'three';
import { SBActorFactory } from '../Actor/SBActorFactory'
import { type OrbitControls as OrbitControlsImpl } from 'three-stdlib'

export const useSelectModelStore = create()(
    subscribeWithSelector((set) => ({
        selectedModel: null,
        setSelectedModel: (model: Ref<any>) => set({ selectedModel: model }),
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

    PopulateChildrenMap(actor: SBActor, instantiateChildrenIfNeeded = false, recursive = false)
    {
        if(!actor.object)
            return
        //fill in the children map
        actor.object.children.forEach((child)=>
        {
            const childUUID = child.uuid
            //if the child has been added to the this.actors map, then re-use that
            if(this.actors.has(childUUID))
            {
                const childActor = this.actors.get(childUUID)!
                actor.children.set(childUUID, childActor)
                childActor.parent = actor
            }
            else if(instantiateChildrenIfNeeded)
            {
                //instantiate it on the fly
                const childActor = this.InstantiateActor(child)
                if(childActor)
                {
                    //this.actors.set(childActor.uuid, childActor)

                    if(recursive)
                        this.PopulateChildrenMap(childActor, true, true)

                    actor.children.set(childActor.uuid, childActor)
                    childActor.parent = actor
                }
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

        this.threeScene = scene
        this.actors.clear()

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
                this.PopulateChildrenMap(actor, true, true)
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
}
