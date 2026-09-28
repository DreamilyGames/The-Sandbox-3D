import React, { useState } from 'react';
import * as THREE from 'three'

interface TreeNodeProps 
{
  node: THREE.Object3D;
  selectedID: string | null;
  onSelect: (object: THREE.Object3D) => void;
}

export function SBSceneGraphNode({ node, selectedID, onSelect }: TreeNodeProps) 
{
  const [isOpen, setIsOpen] = useState(true);
  const isSelected = selectedID ? selectedID === node.uuid : false;
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="pl-3">
      {/* Node Row */}
      <div
        onClick={() => onSelect(node)}
        className={`flex items-center justify-between px-2 py-1 rounded text-xs cursor-pointer ${
          isSelected ? 'bg-sky-600 text-white' : 'hover:bg-slate-800 text-slate-300'
        }`}
      >
        <div className="flex items-center space-x-1.5 truncate">
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
          <span className="truncate">{node.name}</span>
        </div>
        <span className="text-[10px] opacity-50 uppercase">{node.type}</span>
      </div>

      {/* Recursive Render of Nested Children */}
      {hasChildren && isOpen && (
        <div className="border-l border-slate-800 ml-2 space-y-0.5">
          {node.children!.map((childNode) => (
            <SBSceneGraphNode
              key={childNode.id}
              node={childNode}
              selectedID={selectedID}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}