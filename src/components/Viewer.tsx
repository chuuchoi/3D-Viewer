import { useEffect, useRef } from "react"
import * as THREE from "three"

import { createRenderer } from "../three/renderer"
import { createScene } from "../three/scene"
import { createCamera } from "../three/camera"
import { createLights } from "../three/light"
import { createBoxesWithBVH } from "../three/modelLoader"
import React from "react"

export default function Viewer() {

  const containerRef = useRef<HTMLDivElement>(null)
  let hovered: THREE.Mesh | null = null
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


    const boxes = createBoxesWithBVH(scene)


function animate() {

  requestAnimationFrame(animate)

  raycaster.setFromCamera(mouse, camera)

  const intersects = raycaster.intersectObjects(boxes)

  if (hovered) {
    (hovered.material as THREE.MeshStandardMaterial).color.set("orange")
    hovered = null
  }

  if (intersects.length > 0) {

    hovered = intersects[0].object as THREE.Mesh

    ;(hovered.material as THREE.MeshStandardMaterial).color.set("hotpink")
  }

  renderer.render(scene, camera)
}
 animate()

 window.addEventListener("mousemove", (event) => {

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

})
  }, [])

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%" }}
    />
  )
}