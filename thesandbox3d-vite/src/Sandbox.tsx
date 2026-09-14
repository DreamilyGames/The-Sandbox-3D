import React, { useRef, useState, Component } from 'react'

import * as THREE from 'three'
import { OrbitControls } from '@react-three/drei';
import { Canvas, useFrame, useThree, useLoader, type ThreeElements } from '@react-three/fiber'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import './index.css'
import './Sandbox.css'

function Box(props: ThreeElements['mesh']) {
    const meshRef = useRef<THREE.Mesh>(null!)
    const [hovered, setHover] = useState(false)
    const [active, setActive] = useState(false)
    useFrame((state, delta) => (meshRef.current.rotation.x += delta))
    return (
        <mesh
    { ...props }
    ref = { meshRef }
    scale = { active? 1.5: 1 }
    onClick = {(event) => setActive(!active)
}
onPointerOver = {(event) => setHover(true)}
onPointerOut = {(event) => setHover(false)}>
    <boxGeometry args={ [1, 1, 1] } />
        < meshStandardMaterial color = { hovered? 'hotpink': '#2f74c0' } />
            </mesh>
)
}

function Bike()
{
    const gltf = useLoader(GLTFLoader, 
        '/res/models/motorcycles/BMW/S1000 RR/scene.gltf')
    return <primitive object={gltf.scene} scale = {4} />
}

function PrintCameraStats()
{
    const { camera } = useThree()
    return (<></>
    )
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

    return (
        <>
        <div className="canvas-container">
        <Canvas>
            <ambientLight intensity= { Math.PI / 2 } />

            <spotLight position = { [10, 10, 10] } angle = { 0.15} 
            penumbra = { 1} decay = { 0} intensity = { Math.PI } />

            <pointLight position={ [-10, -10, -10] } decay = { 0} 
            intensity = { Math.PI } />

            <Box position={[-1.2, 0, 0]} />
            <Box position={[1.2, 0, 0]} />
            <Bike />

            <OrbitControls/>

            <FastCameraLogger textRef={cameraTextRef} />
        </Canvas>

            <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, color: 'white' }}>
                <h1 ref={cameraTextRef}></h1>
            </div>
        </div>
        </>            
    )
}