import * as THREE from 'three'
import { create, type Mutate, type StoreApi, type UseBoundStore } from 'zustand'
import { persist, subscribeWithSelector } from 'zustand/middleware'

export interface ISBActor
{
    object : THREE.Object3D | null
    uuid: string
    type: string
    children: Map<string, ISBActor>
    parent: ISBActor | null
    //DO NOT MODIFY the 'hidden' flag directly!
    useHiddenStore: any

    Dispose() : void
    SetHidden(flag: boolean) : void
    IsHidden() : boolean
}

export class SBActor implements ISBActor
{
    object : THREE.Object3D | null = null
    uuid: string = ""
    type: string = ""
    children: Map<string, ISBActor> = new Map<string, ISBActor>
    parent: ISBActor | null = null

    useHiddenStore = create<{hidden: boolean, setHidden: (flag:boolean)=>void}>()(
        persist(
        subscribeWithSelector((set) => ({
            hidden: false,
            setHidden: (flag: boolean) => set({hidden: flag}),
        }))
        , {name: "The-Sandbox-Zustand-storage"}
        )
    )

    SetHidden(flag: boolean) : void
    {
        const _hid = this.useHiddenStore.getState().hidden
        if(flag === _hid)
            return

        //you cannot unhide the actor if its parent is still hidden (unless with a 'force' flag?)
        if(!flag && this.parent)
        {
            const _parent_hid = this.parent.useHiddenStore.getState().hidden
            if(_parent_hid)
                return
        }

        if(this.object)
        {
            this.object.visible = !flag
        }

        this.useHiddenStore.getState().setHidden(flag)

        //propagate down to children ONLY if the user is trying to hide the actor
        if(flag)
        {
            this.children.forEach((c)=>
            {
                c.SetHidden(flag)
            })
        }
    }

    IsHidden() : boolean
    {
        const _hid = this.useHiddenStore.getState().hidden
        if(this.parent)
        {
            const _parent_hid = this.parent.useHiddenStore.getState().hidden
            return _parent_hid ? true : this.parent.IsHidden() ? true : _hid
        }
        
        return _hid
    }

    constructor(obj: THREE.Object3D | null)
    {
        this.object = obj;
        if(obj)
        {
            this.uuid = obj.uuid;
            this.type = obj.type.toLowerCase();
            if(this.type === "object3d")
                this.type = "actor"
            this.SetHidden(!obj.visible)
        }
    }

    Dispose()
    {
        // 3. Remove from parent scene graph
        if (this.object && this.object.parent) 
        {
           this.object.parent.remove(this.object);
        }
    }
}