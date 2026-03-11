import React, { useState } from "react"
import { useEffect, useRef } from "react"
import * as THREE from "three"

import { createRenderer } from "../three/renderer"
import { createScene } from "../three/scene"
import { createCamera } from "../three/camera"
import { createLights } from "../three/light"
import { createTestMesh, createInstancedCubes, createManyMeshes, createLOD } from "../three/modelLoader2"

export default function Viewer2() {
  const [currentLevel, setCurrentLevel] =useState<number | undefined>()
  const containerRef = useRef<HTMLDivElement>(null)
  const rafId = useRef<number>(null)
  let isForward = true


  useEffect(() => {

    if (!containerRef.current) return

    const container = containerRef.current

    const scene = createScene()

    const camera = createCamera(
      container.clientWidth,
      container.clientHeight
    )

    const renderer = createRenderer(container)

    createLights(scene)

    // const mesh = createInstancedCubes()
    // scene.add(mesh)

    // createManyMeshes(scene)
    const meshLOD = createLOD()
    scene.add(meshLOD)

    function animate() {
      requestAnimationFrame(animate)

      // mesh.rotation.x += 0.01
      // mesh.rotation.z += 0.01
      camera.rotation.z += 0.02
      
      // camera 앞 뒤로 왔다갔다
      if (isForward) {
        camera.position.z += 0.1
        if (camera.position.z >= 10) {
          isForward = false
        }
      } else {
        camera.position.z -= 0.1
        if (camera.position.z <= 1) {
          isForward = true
        }
      }


      renderer.render(scene, camera)
    }
    let lastUpdate = 0;
    function animateLOD() {
      rafId.current = requestAnimationFrame(animateLOD)

      camera.position.z = (Math.sin(Date.now() * 0.001) + 1.1) * 40

      const level = meshLOD.getCurrentLevel()
      const now = Date.now()
      // 200ms마다 setState
      if (now - lastUpdate > 200) {
        // 이전 값과 같으면 건너뜀
        if (level !== currentLevel) {
          setCurrentLevel(level);
          lastUpdate = now;
        }
      }

      // meshLOD.update(camera)
      renderer.render(scene, camera)
    }
    camera.position.z = 19.9
    renderer.render(scene, camera)
    animateLOD()
    return () => {
      cancelAnimationFrame(rafId.current!)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%" }}
    >
      <div style={{position:"absolute",top:'100px',left:"0px", display:'flex',justifyContent:"center",width:"100%", }}>
        <div style={{background:'linear-gradient(45deg, #7e1616, #171080bf)',borderRadius:'10px', width:'auto', height:'70px', padding:"10px 32px",
           display:'flex', flexDirection:"column", justifyContent:"center",alignItems:"center",
           boxShadow:"rgb(71 71 57 / 74%) 2px 2px 16px, rgba(117, 217, 106, 0.1) -9px 16px 20px"}}>
          <span style={{whiteSpace:"nowrap"}}>현재 LOD: {currentLevel}</span>
          {currentLevel===0 && <span style={{whiteSpace:"nowrap"}}>High-poly: 반지름 1, 면 수 64x64</span>}
          {currentLevel===1 && <span style={{whiteSpace:"nowrap"}}>Medium-poly: 반지름 1, 면 수 32x32</span>}
          {currentLevel===2 && <span style={{whiteSpace:"nowrap"}}>Low-poly: 반지름 1, 면 수 8x8</span>}
        </div>
      </div>

    </div>
  )
}