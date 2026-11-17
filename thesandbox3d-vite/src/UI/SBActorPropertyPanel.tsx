import * as THREE from 'three'
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelectActorStore } from "../World/SBWorld";
import { inspectMaterialSchema, updateMaterialProperty } from '../Renderer/Material/SBMaterialProperties';
import { SBColorPicker } from './SBColorPicker';
import { SBSlider } from './SBSlider';
import './SBActorPropertyPanel.css'
import '../Core/SBCSSUtils'
import { GetSpacing } from '../Core/SBCSSUtils';

export default function SBActorPropertyPanel()
{
    const [isResizing, setIsResizing] = useState(false);
    const mouseDownPosition = useRef<THREE.Vector2>(new THREE.Vector2())
    const mouseDownDeltaPosition = useRef<THREE.Vector2>(new THREE.Vector2())
    const panelSizeInPx = { w: GetSpacing() * 90, h: 9/10 * window.innerHeight }
    const [statePosition, setStatePosition] = useState(
        {x:window.innerWidth, y:(window.innerHeight - panelSizeInPx.h)/2
        }
    )
    const panelTranslateShowDefault = GetSpacing() * 115
    const panelTranslateHideDefault = 0
    const [panelTranslateShow, setPanelTranslateShow] = useState(panelTranslateShowDefault)
    const [panelTranslateHide, setPanelTranslateHide] = useState(panelTranslateHideDefault)

    const selectedActor = useSelectActorStore((state) => state.selectedActor)

    // Mouse down handler
      const handleMouseDown = useCallback(
        (e: MouseEvent) => 
        {
            mouseDownPosition.current.set(e.clientX, e.clientY)
        },
        []
      );
    
      // Mouse move handler during drag
      const handleMouseMove = useCallback(
        (e: MouseEvent) => {
          if (!isResizing) return;
    
          // Calculate Delta
          mouseDownDeltaPosition.current.set(e.clientX - mouseDownPosition.current.x, 
            e.clientY - mouseDownPosition.current.y)

            
          // Apply
          setStatePosition({x: statePosition.x + mouseDownDeltaPosition.current.x,
                            y: statePosition.y + mouseDownDeltaPosition.current.y
            })

            if(selectedActor)
            {
                setPanelTranslateHide(panelTranslateHide - mouseDownDeltaPosition.current.x)
            }
            //

        },
        [isResizing]
      );
    
      // Mouse release handler
      const handleMouseUp = useCallback(() => {
        setIsResizing(false);
      }, []);
    
      // Global event listeners attached during dragging
      useEffect(() => {
        if (isResizing) {
          window.addEventListener('mousedown', handleMouseDown)
          window.addEventListener('mousemove', handleMouseMove);
          window.addEventListener('mouseup', handleMouseUp);
          
          // Prevent pointer interaction/hover artifacts on 3D canvas while resizing
          document.body.style.cursor = 'pointer';
          document.body.style.userSelect = 'none';
        } else {
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
        }
    
        return () => {
          window.removeEventListener('mousedown', handleMouseDown)
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
        };
      }, [isResizing, handleMouseDown, handleMouseMove, handleMouseUp]);


    const [isOpen, setIsOpen] = useState(false)
    

    const schema = useMemo(() => {
            return selectedActor && selectedActor.object
                ? inspectMaterialSchema((selectedActor.object as THREE.Mesh).material)
                : []
        }, [selectedActor])

    useMemo(()=>
    {
        if(!selectedActor)
        {
            
        }
    }, [selectedActor])

    return (
          
        <div 
        style={{
        position: `fixed`,    
        top: `${statePosition.y}px`, 
        left: `${statePosition.x}px`, 
        width: `${panelSizeInPx.w}px`, 
        height: `${panelSizeInPx.h}px`,
        '--translation-show': `${panelTranslateShow}px`,
        '--translation-hide': `${panelTranslateHide}px`,
        '--panel-width': `${panelSizeInPx.w}px`}}
        className={`absolute p-4 overflow-y-auto
        bg-[var(--color-default-black)] backdrop-blur-md opacity-90 border-4 
        border-[var(--color-default-grey)] flex flex-col justify-start
        border-opacity-100 rounded-xl transition-transform ease-in-out
        duration-100 ${selectedActor ? ' -translate-x-(--translation-show)' : 
        ' translate-x-(--translation-hide)'}`}>

            <div 
            onMouseDown={() => setIsResizing(true)}
            className={`-mt-4 -ml-4 -mr-4 flex-none h-5 bg-slate-800 opacity-80`} />

            <div className="pl-0">
                {/* Node Row */}
                <div
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between px-2 py-1 rounded text-xs cursor-pointer 
                    hover:bg-slate-800 text-slate-300
                }`}
                >
                <div className="flex items-center space-x-1.5 truncate">
                    <button
                        onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(!isOpen);
                        }}
                        className="w-3 text-slate-400 hover:text-white"
                    >
                        {isOpen ? '▼' : '▶'}
                    </button>
                    <span className="truncate">Materials</span>
                </div>
                </div>
            
                {/* Node Content */}
                {(isOpen && selectedActor && selectedActor.object) && (

                    <div key={selectedActor.uuid} className="">
                    {schema.map((field) => {
                        if (field.type === 'color') {
                        return <SBColorPicker
                        key={field.key}
                        defaultColor={field.value}
                        onChange={(newColor: string)=>
                        {
                            updateMaterialProperty(
                                (selectedActor.object as THREE.Mesh).material, field, newColor);
                        }}>
                                    {field.label}
                                </SBColorPicker>;
                        }

                        if (field.type === 'number') {
                        return (
                            <SBSlider
                            key={field.key}
                            defaultValue={field.value}
                            onChange={(newValue: number) => 
                            {
                                updateMaterialProperty(
                                    (selectedActor.object as THREE.Mesh).material, field, newValue);
                            }}
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            >
                                {field.label}
                            </SBSlider>
                        );
                        }

                        if (field.type === 'boolean') {
                        return (
                            <div key={field.key} className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-slate-300">{field.label}</span>
                                    <input
                                        type="checkbox"
                                        defaultChecked={Boolean(field.value)}
                                        onChange={(e) => {
                                        updateMaterialProperty(
                                            (selectedActor.object as THREE.Mesh).material, field, e.target.checked);
                                        }}
                                        className="w-4 h-4 accent-sky-500 cursor-pointer rounded-lg"
                                    />
                                </div>
                            </div>
                        );
                        }

                        if(field.type === 'select')
                        {
                            return (
                                <div key={field.key} className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-slate-300">{field.label}</span>
                                        <select
                                            defaultValue={field.value}
                                            onChange={(e) => {
                                                const option = field.options?.find(
                                                    ({ value }) => String(value) === e.target.value
                                                );
                                                if (option) {
                                                    updateMaterialProperty(
                                                        (selectedActor.object as THREE.Mesh).material, field, option.value);
                                                }
                                            }}
                                            className="bg-slate-800 rounded-lg text-slate-300 border border-slate-600 focus:ring-blue-500 focus:outline-none"
                                        >
                                            {field.options?.map((option) => (
                                                <option key={option.value} value={option.value}
                                                className="text-right text-xs">
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            );
                        }

                        return null;
                    })}
                    </div>
                )}
            </div>
        </div>
    )
}