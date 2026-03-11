import { useEffect, useRef } from "react"
import * as THREE from "three"

import { createRenderer } from "../three/renderer"
import { createScene } from "../three/scene"
import { createCamera } from "../three/camera"
import { createLights } from "../three/light"
import { createTestMesh, createInstancedCubes, createManyMeshes, createLOD } from "../three/modelLoader copy"
import React from "react"

export default function Viewer() {

  const containerRef = useRef<HTMLDivElement>(null)
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
    function animateLOD() {
      requestAnimationFrame(animateLOD)

      camera.position.z = (Math.sin(Date.now() * 0.001) + 1.1) * 40

      // meshLOD.update(camera)

      renderer.render(scene, camera)
    }
    camera.position.z = 19.9
    renderer.render(scene, camera)
    animateLOD()
  }, [])

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%" }}
    />
  )
}