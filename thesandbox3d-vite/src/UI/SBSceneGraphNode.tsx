import React, { useMemo, useRef, useState } from 'react';
import * as THREE from 'three'
import { GetTailwindColor } from './SBTailwindCSSReader';
import { Delete, Eye, EyeClosed, Save, Trash } from 'lucide-react';
import { EMessageBoxSeverity, SBMessageBox } from './SBMessageBox';
import { SBWorld, useSelectActorStore } from '../World/SBWorld';
import { SBActor } from '../Actor/SBActor';
import { invalidate } from '@react-three/fiber';
import { useWorldStore, type SBWorldStoreState } from "../World/SBWorldStore"

interface SBSceneGraphNodeProps
{
  actor: SBActor;
  onSelect: (object: SBActor | null) => void;
  onHover: (object: SBActor | null) => void;
}

export function SBSceneGraphNode({ actor, onSelect, onHover }: SBSceneGraphNodeProps) 
{
  if(!actor || !actor.object)
    return

  const actorObj3d = actor.object

  const [isOpen, setIsOpen] = useState(true);
  const selectedActor = useSelectActorStore((state) => state.selectedActor)
  const isSelected = selectedActor ? selectedActor == actor : false
  const hasChildren = actor.children && actor.children.size > 0;

  const [nodeNameEditable, setNodeNameEditable] = useState(false);
  const nodeNameSpanRef = useRef<HTMLSpanElement>(null);
  const [deletionMsgBoxShow, setDeletionMsgBoxShow] = useState(false)
  const actorHidden = actor.useHiddenStore((state:any)=>state.hidden)

  const gWorld = useWorldStore((state:SBWorldStoreState) => state.world)

  return (
    <div className="pl-3">

      {/* Deletion confirmation msg box */}
      <SBMessageBox
        isOpen={deletionMsgBoxShow}
        title={`Delete Actor`}
        msg={`Are you sure you want to delete ${actorObj3d.name}? 
        This action is permanent and cannot be undone.`}
        severity={EMessageBoxSeverity.Error}
        onClose={()=>
        {
          setDeletionMsgBoxShow(false)
        }}
        onConfirm={()=>
        {
          setDeletionMsgBoxShow(false)
          
          //deselect first
          onSelect(null)

          //free the resources
          gWorld.DeleteActor(actorObj3d.uuid)
        }}
      />

      {/* Node Row */}
      <div
        onClick={() => onSelect(actor)}
        onMouseEnter={() => onHover(actor)}
        onMouseLeave={() => onHover(null)}
        className={`flex items-center justify-between px-2 py-1 rounded text-xs cursor-pointer
          w-fit gap-4 ${
          isSelected ? 'bg-sky-600 text-white' : 'hover:bg-slate-800 text-slate-300'
        }`}
      >
        <div className="flex items-center space-x-1.5">
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(!isOpen);
              }}
              className="w-3 text-slate-400 hover:text-white"
            >
              {isOpen ? '▼' : '▶'}
            </button>
          )}
          <span ref={nodeNameSpanRef}
                className={`truncate whitespace-nowrap`}
                onClick={(e)=>
                {
                  //e.stopPropagation();
                  setNodeNameEditable(true)
                }}
                contentEditable={nodeNameEditable}
                aria-multiline={false}
                
                onBlur={(e)=>
                {
                  setNodeNameEditable(false)

                  //Update the actor's name
                  actorObj3d.name = e.currentTarget?.textContent
                }}
                >
                  {actorObj3d.name}
          </span>
        </div>
        <span className="pl-3 text-[10px] opacity-50 uppercase">
          {actor.type}
        </span>

        <div className='gap-3'>
          {/* Deletion button */}
          <button
            className={`opacity-30 inline-flex size-3 shrink-0 items-center justify-center rounded-xs text-white transition-colors 
              cursor-pointer
              hover:bg-sky-800 hover:opacity-80 focus-visible:outline-none 
              focus-visible:ring-2 focus-visible:ring-sky-300 
              disabled:cursor-not-allowed disabled:opacity-50`}
            onClick={(e)=>
            {
                e.stopPropagation();
                //Confirm deletion
                setDeletionMsgBoxShow(true)
            }}  
          >
            <Trash size={12} aria-hidden="true" 
            color={GetTailwindColor(`--color-default-white`)
            }/>
          </button>

          {/* Hide button */}
          <button
            className={`opacity-30 inline-flex size-3 shrink-0 items-center justify-center rounded-xs text-white transition-colors 
              cursor-pointer
              hover:bg-sky-800 hover:opacity-80 focus-visible:outline-none 
              focus-visible:ring-2 focus-visible:ring-sky-300 
              disabled:cursor-not-allowed disabled:opacity-50`}
            onClick={(e)=>
            {
                e.stopPropagation();
                actor.SetHidden(!actor.IsHidden())
            }}  
          >
            {actorHidden
            ? 
            <EyeClosed size={12} aria-hidden="true" 
            color={GetTailwindColor(`--color-default-white`)
            }/>
            : 
            <Eye size={12} aria-hidden="true" 
            color={GetTailwindColor(`--color-default-white`)
            }/>}
            
          </button>
        </div>
        
      </div>

      

      {/* Recursive Render of Nested Children */}
      {hasChildren && isOpen && (
        <div className="border-l border-slate-800 ml-2 space-y-0.5">
          {Array.from(actor.children!.values()).map((childNode) => (
            <SBSceneGraphNode
              key={childNode.uuid}
              actor={actor.children.get(childNode.uuid)!}
              onSelect={onSelect}
              onHover={onHover}
            />
          ))}
        </div>
      )}
    </div>
  );
}