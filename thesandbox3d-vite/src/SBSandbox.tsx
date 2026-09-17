import React, { useRef, useState, Component, Suspense, type Dispatch, type SetStateAction } from 'react'

import * as THREE from 'three'
import { OrbitControls, Html, useProgress, Grid, PivotControls } from '@react-three/drei'
import { Canvas, useFrame, useThree, useLoader, type ThreeElements, type ThreeEvent
 } from '@react-three/fiber'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import './index.css'
import './SBSandbox.css'
import {SBModel} from './Renderer/Model/SBModel'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

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
        <SBModel withPivotCtrls = {false} 
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

export default function Sandbox() {

    const cameraTextRef = useRef<HTMLHeadingElement>(null)
    const [controlsRef, [rotatingFlag, setRotatingFlag]]
    : [controlsRef: React.RefObject<OrbitControlsImpl | null>, [rotatingFlag: boolean, setRotatingFlag: Dispatch<SetStateAction<boolean>>]]
    = [useRef<OrbitControlsImpl>(null), useState<boolean>(false)]

    return (
        <>
        <div className="canvas-container">
        <Canvas camera = {{ fov: 50, position: [2.14, 1.27, 1.78] }}>
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

            <Box position={[-1.2, 0, 0]} />
            <Box position={[1.2, 0, 0]} />

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

            <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, color: 'white' }}>
                <h1 ref={cameraTextRef}></h1>
            </div>
        </div>
        </>            
    )
}