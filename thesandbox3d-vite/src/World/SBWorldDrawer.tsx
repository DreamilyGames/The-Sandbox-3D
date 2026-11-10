import { SBMesh } from "../Actor/Model/SBMesh"
import { HTMLSBMesh } from "../Actor/Model/HTMLSBMesh"
import { SBActor } from "../Actor/SBActor"
import { SBWorld } from "./SBWorld"
import {v4 as uuidv4} from 'uuid'
import { useWorldStore, type SBWorldStoreState } from "./SBWorldStore"
import { HTMLSBActor } from "../Actor/HTMLSBActor"

export default function HTMLSBWorldDrawer({_actors, enablePivotCtrls}
    :
    {
        _actors?: Map<string, SBActor>
        enablePivotCtrls: boolean,
    }
)
{
    const gWorld = useWorldStore((state:SBWorldStoreState)=>state.world)
    const actors = _actors ? _actors : gWorld.actors

    if(!actors || actors.size === 0)
    {
        return
    }

    return (
        <>
        {Array.from(actors.entries()).map( (child) => 
        {
            const actor = child[1]
            if(!actor.object)
                return
            
            if(actor.type === "actor")
            {
                return <HTMLSBActor sbactor={actor} enablePivotCtrls={enablePivotCtrls} key={child[0]} 
                drawPrimitive={true}>
                    {actor.children.size > 0 && <HTMLSBWorldDrawer _actors={actor.children}
                            enablePivotCtrls={enablePivotCtrls}
                            />}
                    </HTMLSBActor>
            }
            else if(actor.type === "mesh")
            {
                return <HTMLSBMesh enablePivotCtrls={enablePivotCtrls}
                        sbmesh={actor as SBMesh}
                        key={child[0]}>

                            {actor.children.size > 0 && <HTMLSBWorldDrawer _actors={actor.children}
                            enablePivotCtrls={enablePivotCtrls}
                            />}

                        </HTMLSBMesh>
            }
        })}
        </>
    )
}