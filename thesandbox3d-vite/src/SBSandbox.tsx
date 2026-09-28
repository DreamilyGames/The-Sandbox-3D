import React, { useRef, useState, Component, Suspense, type Dispatch, type SetStateAction, useEffect, type MouseEventHandler, useMemo } from 'react'
import * as THREE from 'three'
import { OrbitControls, Html, useProgress, Grid, useGLTF } from '@react-three/drei'
import { Canvas, useFrame, type ThreeElements, type ThreeEvent
 } from '@react-three/fiber'
import './index.css'
import './SBSandbox.css'
import { useSelectModelStore } from './World/SBWorld'
import {SBModel} from './Actor/Model/SBModel'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import {v4 as uuidv4} from 'uuid';
import { SBSceneGraphNode } from './UI/SBSceneGraphNode'
import { SBThreeJSTexturePreview } from './UI/SBThreeJSTexturePreview'
import { SBColorPicker } from './UI/SBColorPicker'

function Box(props: ThreeElements['mesh']) 
{
    const meshRef = useRef<THREE.Mesh>(null!)
    const [hovered, setHover] = useState(false)
    const [active, setActive] = useState(false)
    useFrame((state, delta) => (meshRef.current.rotation.x += delta))

    return (
        <mesh { ...props } ref = { meshRef } scale = { active? 1.5: 1 }
            onClick = 
            {(event) => 
                setActive(!active)
            }
            onPointerOver = 
            {
                (event) => setHover(true)
            }
            onPointerOut = 
            {
                (event) => setHover(false)
            }>

            <boxGeometry args={ [0.5, 0.5, 0.5] } />
            <meshStandardMaterial color = { hovered? 'hotpink': '#2f74c0' } />

        </mesh>
    )
}

function Bike({ camCtrlRef, camRotatingFlag }: 
    { camCtrlRef: React.RefObject<OrbitControlsImpl | null>, camRotatingFlag: boolean })
{
    return (
        <SBModel enablePivotCtrls = {true} 
        modelPath = {'/models/motorcycles/BMW/S1000 RR/scene.gltf'} 
        camCtrlRef = {camCtrlRef}
        camRotatingFlag = {camRotatingFlag}/>
    )
}

function Loader() {
  const { progress } = useProgress()
  return (<Html center className="text-white font-mono">{progress.toFixed(0)}% loaded</Html>)
}

function FastCameraLogger({ textRef }: { textRef: React.RefObject<HTMLHeadingElement|null> }) {
  useFrame(({ camera }) => {
    if(textRef)
    {
        if (textRef.current) {
        const { x, y, z } = camera.position;
        textRef.current.innerText = `X: ${x.toFixed(2)} | Y: ${y.toFixed(2)} | Z: ${z.toFixed(2)}`
        }
    }
    
  })

  return null
}

export default function Sandbox() 
{

    const cameraTextRef = useRef<HTMLHeadingElement>(null)
    const [controlsRef, [rotatingFlag, setRotatingFlag]]
    : [controlsRef: React.RefObject<OrbitControlsImpl | null>, [rotatingFlag: boolean, setRotatingFlag: Dispatch<SetStateAction<boolean>>]]
    = [useRef<OrbitControlsImpl>(null), useState<boolean>(false)]
    const selectedModel = useSelectModelStore((state:any) => state.selectedModel)
    const selectModel = useSelectModelStore((state:any) => state.setSelectedModel)
    const [isOpen, setIsOpen] = useState(false)

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

    const gltf = useGLTF("/models/motorcycles/BMW/S1000 RR/scene.gltf")
    return (
        <div className='flex h-screen w-screen overflow-hidden'>
            {/* Scene Graph */}
            <aside className="w-1/4 flex-shrink-0
            bg-slate-900/90 z-10 flex flex-col p-4 select-none text-left scroll-smooth
            overflow-y-auto min-h-0">
                <h1 className={`justify-start text-base`}>Scene</h1>

                {gltf.scene.children.map((child)=>
                (
                    <SBSceneGraphNode node={child} 
                    selectedID={selectedModel ? (selectedModel as THREE.Object3D).uuid : null} 
                    onSelect={(obj)=>
                    {
                        selectModel(obj)
                    }} />
                ))}
            </aside>


            <main className="w-3/4 canvas-container relative bg-slate-900/40 flex-1">
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
                    <ambientLight intensity= { Math.PI / 2 } />

                    <spotLight position = { [10, 10, 10] } angle = { 0.15} 
                    penumbra = { 1} decay = { 0} intensity = { Math.PI } />

                    <pointLight position={ [-10, -10, -10] } decay = { 0} 
                    intensity = { Math.PI } />

                    <Grid
                        position={[0, -0.01, 0]}      // Slightly below origin to prevent z-fighting
                        args={[10.5, 10.5]}           // Plane dimensions
                        cellSize={0.4}                // Primary cell size
                        cellThickness={1}             // Primary line thickness
                        cellColor="#64748b"           // Color of main grid lines
                        sectionSize={4.0}             // Major section line spacing
                        sectionThickness={1.2}        // Major section line thickness
                        sectionColor="#38bdf8"         // Color of major section lines
                        fadeDistance={50}             // How far the grid extends before fading out
                        fadeStrength={1}              // Fadeout dropoff strength
                        infiniteGrid                  // Extends grid endlessly
                    />

                    {/*<Box position={[-1.2, 0, 0]} />
                    <Box position={[1.2, 0, 0]} />*/}

                    <Suspense fallback={<Loader />}>
                        <Bike camCtrlRef={controlsRef} camRotatingFlag={rotatingFlag} />
                    </Suspense>

                    <OrbitControls ref={controlsRef}
                    onStart= {() =>
                    {
                        setRotatingFlag(true)
                    }}
                    onEnd= {() =>
                    {
                        setRotatingFlag(false)
                    }}/>

                    <FastCameraLogger textRef={cameraTextRef} />
                </Canvas>

                {/* UI components 
                    <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, color: 'white' }}>
                        <h1 ref={cameraTextRef}></h1>
                    </div>
                */}

                {/* Property Panel */}  
                <div className={`absolute inset-y-10 -right-100 w-90 h-9/10 p-4 
                bg-[var(--color-deep-purple)] backdrop-blur-md opacity-90 border-4 
                border-[var(--color-light-purple) flex-1 justify-start]
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
                        <div className="border-l border-slate-800 ml-2 space-y-0.5">
                            <SBThreeJSTexturePreview 
                            texture={selectedModel ? 
                                ((selectedModel as THREE.Mesh).material as THREE.MeshPhysicalMaterial).map :
                                null
                            }>
                            </SBThreeJSTexturePreview>
                            <SBColorPicker mesh={selectedModel}>
                                
                            </SBColorPicker>
                        </div>
                    )}
                    
                </div>
                </div>
                
                

            </main>

            
        </div>            
    )
}