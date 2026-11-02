import { SBMesh } from "../Actor/Model/SBMesh"
import { HTMLSBMesh } from "../Actor/Model/HTMLSBMesh"
import { SBActor } from "../Actor/SBActor"
import { SBWorld } from "./SBWorld"
import {v4 as uuidv4} from 'uuid'
import { useWorldStore, type WorldStoreState } from "./SBWorldStore"

export default function HTMLSBWorldDrawer({_actors, enablePivotCtrls}
    :
    {
        _actors?: Map<string, SBActor>
        enablePivotCtrls: boolean,
    }
)
{
    const gWorld = useWorldStore((state:WorldStoreState)=>state.world)
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
                return <primitive object={actor.object} key={child[0]}>
                            {actor.children.size > 0 && <HTMLSBWorldDrawer _actors={actor.children}
                            enablePivotCtrls={enablePivotCtrls}
                            key={uuidv4()}
                            />}
                        </primitive>
            }
            else if(actor.type === "mesh")
            {
                return <HTMLSBMesh enablePivotCtrls={enablePivotCtrls}
                        sbmesh={actor as SBMesh}
                        key={child[0]}>

                            {actor.children.size > 0 && <HTMLSBWorldDrawer _actors={actor.children}
                            enablePivotCtrls={enablePivotCtrls}
                            key={uuidv4()}
                            />}

                        </HTMLSBMesh>
            }
        })}
        </>
    )
}