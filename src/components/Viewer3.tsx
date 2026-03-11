import React from "react"
import { useEffect, useRef } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { createRenderer } from "../three/renderer"
import { createScene } from "../three/scene"
import { createCamera } from "../three/camera"
import { createLights } from "../three/light"
import { createBoxesWithBVH } from "../three/modelLoader"

export default function Viewer3() {

  const containerRef = useRef<HTMLDivElement>(null)
  const hoveredRef = useRef<THREE.Mesh | null>(null)
  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()


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

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.PAN,
      RIGHT: THREE.MOUSE.DOLLY
    }
    controls.enableDamping = true


    const boxes = createBoxesWithBVH(scene)


    function animate() {
      requestAnimationFrame(animate)
      controls.update()

      raycaster.setFromCamera(mouse, camera)

      const intersects = raycaster.intersectObjects(boxes)

      if (hoveredRef.current) {
        (hoveredRef.current.material as THREE.MeshStandardMaterial).color.set("blue")
        hoveredRef.current = null
      }

      if (intersects.length > 0) {

        hoveredRef.current = intersects[0].object as THREE.Mesh

        ;(hoveredRef.current.material as THREE.MeshStandardMaterial).color.set("hotpink")
      }

      renderer.render(scene, camera)
    }
    animate()

    const onMouseMove = (event: MouseEvent) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener("mousemove", onMouseMove)

    return () => {
      window.removeEventListener("mousemove", onMouseMove)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%" }}
    />
  )
}