import { SBMesh } from "./Model/SBMesh";
import { SBActor } from "./SBActor";
import * as THREE from 'three';

export namespace SBActorFactory
{
    /**
     * Instantiate an actor based on the THREE.Object3D type.
     * (Optimization?)
     * @param
     * @returns 
     */
    export function InstantiateActor(obj: THREE.Object3D) : SBActor | null
    {
        const type = obj.type
        const lowercaseType = type.toLowerCase()
        if(lowercaseType === "object3d")
        {
            return new SBActor(obj)
        }
        else if(lowercaseType === "mesh")
        {
            return new SBMesh(obj)
        }
        return null
    }
}