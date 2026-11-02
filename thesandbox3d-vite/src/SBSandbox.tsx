import React, { useRef, useState, Component, type Dispatch, type SetStateAction, useEffect, type MouseEventHandler, useMemo, type ChangeEvent, Suspense } from 'react'
import * as THREE from 'three'
import { OrbitControls, Html, useProgress, Grid, useGLTF, Environment } from '@react-three/drei'
import { Canvas, useFrame, type ThreeElements, type ThreeEvent
 } from '@react-three/fiber'
import './index.css'
import './SBSandbox.css'
import { useSelectModelStore, type SBWorld } from './World/SBWorld'
import {SBActor} from './Actor/SBActor'
import { GLTFLoader, type OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import {v4 as uuidv4} from 'uuid';
import { SBSceneGraphNode } from './UI/SBSceneGraphNode'
import { SBThreeJSTexturePreview } from './UI/SBThreeJSTexturePreview'
import { SBColorPicker } from './UI/SBColorPicker'
import { suspend } from 'suspend-react'
import { SBDraggableOutliner } from './UI/SBDraggableContainer'
import { GetTailwindColor } from './UI/SBTailwindCSSReader'
import { SBSlider } from './UI/SBSlider'
import { inspectMaterialSchema, updateMaterialProperty } from './Renderer/Material/SBMaterialProperties'
import { SBSaveButton } from './UI/SBSaveButton'
import { SBLoadButton } from './UI/SBLoadButton'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'
import { useCameraCtrlStore } from './World/SBCamera'
import HTMLSBWorldDrawer from './World/SBWorldDrawer'
import { useWorldStore, type WorldStoreState } from "./World/SBWorldStore"

type SaveFilePickerWindow = Window & 
{
    showSaveFilePicker?: (options: {
        suggestedName: string;
        types: { description: string; accept: Record<string, string[]> }[];
    }) => Promise<{
        createWritable: () => Promise<{
            write: (data: Blob) => Promise<void>;
            close: () => Promise<void>;
        }>;
    }>;
}

function Loader() 
{
  const { progress } = useProgress()
  return (<Html center className="text-white font-mono">{progress.toFixed(0)}% loaded</Html>)
}

export default function Sandbox() 
{
    const setOrbitalCameraCtrl = useCameraCtrlStore((state:any) => state.setOrbitalCameraCtrl)
    const setOrbitalCameraRotatingFlag = useCameraCtrlStore((state:any) => state.setOrbitalCameraRotatingFlag)
    
    const selectedModel = useSelectModelStore((state:any) => state.selectedModel)
    const setSelectedModel = useSelectModelStore((state:any) => state.setSelectedModel)
    const [isOpen, setIsOpen] = useState(false)

    const orbitalCameraCtrlRefCallback = (instance: OrbitControlsImpl | null)=>
    {
        if (instance) 
        {
            setOrbitalCameraCtrl(instance);
        }
    }

    const tetmatString = () =>
    {
        let str = ""
        if(!selectedModel)
            return ""
        const mat = (selectedModel as THREE.Mesh).matrixWorld
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

    const de_trs = () =>
    {
        if(!selectedModel)
            return ""

        const mat = (selectedModel as THREE.Mesh).matrixWorld
        
        const t = new THREE.Vector3()
        const r = new THREE.Quaternion()
        const s = new THREE.Vector3()

        mat.decompose(t, r, s)

        return `Translation: (${t.x.toFixed(2)}, ${t.y.toFixed(2)}, ${t.z.toFixed(2)})\nRotation: (${r.x.toFixed(2)}, ${r.y.toFixed(2)}, ${r.z.toFixed(2)}, ${r.w.toFixed(2)})\nScale: (${s.x.toFixed(2)}, ${s.y.toFixed(2)}, ${s.z.toFixed(2)})`
    }

    const schema = useMemo(() => {
        return selectedModel
            ? inspectMaterialSchema(selectedModel.material)
            : []
    }, [selectedModel])

    //Use this if a subscription to the selected model is needed in the future. 
    // Currently, it is not used.
    /*useEffect(() => 
    {    
        const unsubscribe = useSelectModelStore.subscribe(
            (state:any) => state.selectedModel,
            (newModel:any) => 
            {
                
            }
        )
        return () => unsubscribe() // Cleanup subscription on unmount
    }, [])*/
    
    const defaultGLTF = useGLTF("/models/motorcycles/BMW/S1000 RR/new_bike.glb")
    const pivotTransformsRef = useRef(new Map<string, React.RefObject<THREE.Matrix4>>())
    const gWorld = useWorldStore((state:WorldStoreState) => state.world)

    useMemo(() => 
    {
        gWorld.SetScene(defaultGLTF.scene)
    }, [])

    const handleLoad = async (event: ChangeEvent<HTMLInputElement>) => 
    {
        const file = event.currentTarget.files?.[0];
        event.currentTarget.value = '';
        if (!file) return;
    
        if(file.name.endsWith('.gltf')) 
        {
          //gltf files are not supported yet because 
          // reading them requires fetching the external resources 
          // (textures, etc.) which is not implemented yet

          alert('GLTF files are not supported yet. Please use GLB files.');
          return;
        }
    
        try {
          const data = await file.arrayBuffer();
          new GLTFLoader().parse(
            data,
            '',
            (gltf) => {
              gWorld.SetScene(gltf.scene)
              pivotTransformsRef.current.clear()
              useSelectModelStore.setState({ selectedModel: null })
            },
            (loadError) => {
              
              console.error('Failed to load glTF file:', loadError);
            },
          );
        } catch (loadError) {
          console.error('Failed to read glTF file:', loadError);
        }
    };

    const handleSave = async () => {
        const pickerWindow = window as SaveFilePickerWindow

        try {
            const fileHandlePromise = pickerWindow.showSaveFilePicker?.({
                suggestedName: 'sandbox-scene.glb',
                types: [{
                    description: 'Binary glTF model',
                    accept: { 'model/gltf-binary': ['.glb'] },
                }],
            })

            if(!gWorld.threeScene)
            {
                alert('gWorld.threeScene is null')
                return
            }

            const exporter = new GLTFExporter()
            let result: ArrayBuffer
            try {
                result = await new Promise<ArrayBuffer>((resolve, reject) => {
                    exporter.parse(
                        gWorld.threeScene!,
                        (output) => {
                            if (output instanceof ArrayBuffer) {
                                resolve(output)
                            } else {
                                reject(new Error('GLTFExporter did not return binary output'))
                            }
                        },
                        reject,
                        { binary: true },
                    )
                })
            } catch (error) 
            {
                alert('Failed to export the GLB model')
                return
            }
            const blob = new Blob([result], { type: 'model/gltf-binary' })

            if (fileHandlePromise) {
                const fileHandle = await fileHandlePromise
                const writable = await fileHandle.createWritable()
                await writable.write(blob)
                await writable.close()
            } else {
                const url = URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = 'sandbox-scene.glb'
                link.click()
                window.setTimeout(() => URL.revokeObjectURL(url), 1000)
            }
        } catch (error) 
        {
            //if (error instanceof DOMException && error.name === 'AbortError')
                //alert('Failed to export the GLB model')
        }
    }

    return (
        <div className='flex h-screen w-screen overflow-hidden'>

            <SBDraggableOutliner initialWidth={500} minWidth={240} maxWidth={600}>
                {/* Scene Graph */}
                <h1 className={`justify-start pl-3 
                    text-base border-b border-[var(--color-default-grey)]`}>
                    Scene
                </h1>

                {gWorld.threeScene ? Array.from(gWorld.actors.entries()).map((child)=>
                (
                    <SBSceneGraphNode actor={child[1]} 
                    key={child[0]}
                    selectedID={selectedModel ? (selectedModel as THREE.Object3D).uuid : null} 
                    onSelect={(obj)=>
                    {
                        setSelectedModel(obj)
                    }} />
                )) : (<></>)}
            </SBDraggableOutliner>
            

            <main className="canvas-container relative bg-slate-900/40 flex-1">
                {/* Canvas component for the 3D world */}
                <Canvas camera = {{ fov: 50, position: [2.14, 1.27, 1.78] }}
                    onPointerMissed={(e) => 
                    {
                        if(e.type === 'click')
                        {
                            if(selectedModel)
                            {
                                // Deselect when clicking on the canvas background
                                useSelectModelStore.setState({ selectedModel: null })
                            }
                        }
                        
                    }}>

                        {/* 
                            Preset options: 'city', 'night', 'park', 'studio', 'sunset', 'dawn', 
                            'forest', 'apartment', 'warehouse'
                            - background: Renders the skybox in the 3D background
                        */}
                    <Environment preset="apartment" background/>
                    <ambientLight intensity= { Math.PI / 2 } />

                    <Grid
                        position={[0, -0.01, 0]}      // Slightly below origin to prevent z-fighting
                        args={[10.5, 10.5]}           // Plane dimensions
                        cellSize={0.4}                // Primary cell size
                        cellThickness={1}             // Primary line thickness
                        cellColor="#64748b"           // Color of main grid lines
                        sectionSize={4.0}             // Major section line spacing
                        sectionThickness={1.2}        // Major section line thickness
                        sectionColor={GetTailwindColor(`--color-default-white`)} // Color of major section lines
                        fadeDistance={50}             // How far the grid extends before fading out
                        fadeStrength={1}              // Fadeout dropoff strength
                        infiniteGrid                  // Extends grid endlessly
                    />

                    <Suspense fallback={<Loader/>}>
                        <HTMLSBWorldDrawer 
                        enablePivotCtrls={true}/>
                    </Suspense>

                    <OrbitControls ref={orbitalCameraCtrlRefCallback}
                    onStart= {() =>
                    {
                        setOrbitalCameraRotatingFlag(true)
                    }}
                    onEnd= {() =>
                    {
                        setOrbitalCameraRotatingFlag(false)
                    }}/>
                </Canvas>

                {/* UI components */}
                <div className="absolute top-4 left-4 flex items-center gap-2 text-white font-mono 
                text-xs bg-none p-2 rounded">
                    <SBLoadButton
                        className="bg-slate-800/60"
                        onClick={handleLoad}
                    />
                    <SBSaveButton 
                        className="bg-slate-800/60" 
                        onClick={() => { void handleSave() }} 
                    />

                    <p className="whitespace-pre-wrap">
                        {tetmatString()}
                    </p>

                    <p className="whitespace-pre-wrap">
                        {de_trs()}
                    </p>
                </div>
                    
                {/* Property Panel */}  
                <div className={`absolute inset-y-10 -right-100 w-90 h-9/10 p-4 overflow-y-auto
                bg-[var(--color-default-black)] backdrop-blur-md opacity-90 border-4 
                border-[var(--color-default-grey)] flex-1 justify-start
                border-opacity-100 rounded-xl transition-transform ease-in-out
                duration-100 ${selectedModel ? ' -translate-x-105' : ' translate-x-0'}`}>
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
                    {(isOpen && selectedModel) && (

                        <div key={selectedModel.uuid} className="">
                        {schema.map((field) => {
                            if (field.type === 'color') {
                            return <SBColorPicker
                            key={field.key}
                            defaultColor={field.value}
                            onChange={(newColor: string)=>
                            {
                                updateMaterialProperty(selectedModel.material, field, newColor);
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
                                    updateMaterialProperty(selectedModel.material, field, newValue);
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
                                            updateMaterialProperty(selectedModel.material, field, e.target.checked);
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
                                                        updateMaterialProperty(selectedModel.material, field, option.value);
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
                
                

            </main>

            
        </div>            
    )
}