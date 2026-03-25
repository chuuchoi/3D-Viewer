import { useEffect, useRef } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { createRenderer } from "@/three/renderer"
import { createScene } from "@/three/scene"
import { createCamera } from "@/three/camera"
import { createLights } from "@/three/light"
import { createBoxesWithBVH } from "@/three/modelLoader"

export default function Viewer3({style}:{style?:React.CSSProperties}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const hoveredRef = useRef<THREE.Mesh | null>(null)
  let hovered = hoveredRef.current
  const raycasterRef = useRef(new THREE.Raycaster())
  const raycaster = raycasterRef.current
  const mouseRef = useRef(new THREE.Vector2(-99,-99))
  const mouse = mouseRef.current


  useEffect(() => {
    console.log('Viewer 3 mount')
    if (!containerRef.current) return
    let rafId:number

    const container = containerRef.current

    const scene = createScene()

    const camera = createCamera(
      container.clientWidth,
      container.clientHeight
    )

    const renderer = createRenderer(container)
    if(!container.contains(renderer.domElement))
      container.appendChild(renderer.domElement)

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
      rafId = requestAnimationFrame(animate)
      controls.update()

      raycaster.setFromCamera(mouse, camera)
      raycaster.firstHitOnly = true
      const intersects = raycaster.intersectObjects(boxes)

      if (hovered) {
        (hovered.material as THREE.MeshStandardMaterial).color.set("blue")
        hovered = null
      }

      if (intersects.length > 0) {

        hovered = intersects[0].object as THREE.Mesh

        ;(hovered.material as THREE.MeshStandardMaterial).color.set("hotpink")
      }

      renderer.render(scene, camera)
    }
    animate()

    const onMouseMove = (event: MouseEvent) => {
      mouse.x = (event.offsetX / container.clientWidth) * 2 - 1
      mouse.y = -(event.offsetY / container.clientHeight) * 2 + 1
    }
    container.addEventListener("mousemove", onMouseMove)

    return () => {
      if(rafId) cancelAnimationFrame(rafId)
      container.removeEventListener("mousemove", onMouseMove)
      if(container.contains(renderer.domElement))
        container.removeChild(renderer.domElement)

      // 3. Three.js 자원 명시적 해제
      controls.dispose() // 컨트롤 해제
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose()
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose())
          } else {
            child.material.dispose()
          }
        }
      })
      renderer.dispose() // ★ WebGL 컨텍스트 해제
      console.log('Resources cleaned up')
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%", height: "100%" ,
        ...style
      }}
    />
  )
}