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
    childrenThreeGrp: THREE.Group | null
    childrenThreePivotGrp: THREE.Group | null
    //DO NOT MODIFY the 'hidden' flag directly!
    useHiddenStore: any

    Dispose() : void
    SetHidden(flag: boolean) : void
    IsHidden() : boolean
    CopyTransformFromChildrenGrp() : void
}

export class SBActor implements ISBActor
{
    object : THREE.Object3D | null = null
    uuid: string = ""
    type: string = ""
    children: Map<string, ISBActor> = new Map<string, ISBActor>
    parent: ISBActor | null = null
    childrenThreeGrp: THREE.Group | null = null
    childrenThreePivotGrp: THREE.Group | null = null

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

    CopyTransformFromChildrenGrp()
    {
        if(this.object && this.childrenThreeGrp)
        {
            if(this.object.name === "wheel_lrchild_79")
            {
                const strr = (mat: THREE.Matrix4) =>
                {
                    let str = ""
                    const matarr = mat.toArray()

                    for(let i = 0; i < matarr.length; ++i)
                    {
                        str += matarr[i].toFixed(2) + ", "
                        if ((i > 0) && ((i+1) % 4) === 0) 
                        {
                            str += "\n"
                        }
                    }

                    return str
                }
                

                console.log(strr(this.object.matrix))
                console.log(strr(this.object.matrixWorld))
            }
            
            

            this.object.matrixAutoUpdate = false
            this.object.matrix.copy(this.object.matrix.multiply(this.childrenThreeGrp.matrix))
            this.object.updateMatrixWorld(true)
        }
    }
}