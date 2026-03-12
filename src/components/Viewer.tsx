import React, { useState } from "react"
import { useEffect, useRef } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { createRenderer } from "../three/renderer"
import { createScene } from "../three/scene"
import { createCamera } from "../three/camera"
import { createLights } from "../three/light"
import { createMeshesWithBVH } from "../three/model"
import useRafThrottle from "../hooks/useRafThrottle"

export default function Viewer({style}:{style?:React.CSSProperties}) {
  const [mouseP, setMouseP] = useState<{cx:number, cy:number, x:number, y:number}>()
  const [meshesS, setMeshesS] = useState<THREE.Mesh[]>()
  const [hovered, setHovered] = useState<THREE.Mesh | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hoveredRef = useRef<THREE.Mesh | null>(null)
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster())
  const raycaster = raycasterRef.current
  const mouseRef = useRef(new THREE.Vector2(-99, -99)) // 화면 바깥으로 초기화
  const mouse = mouseRef.current
  const updateMouse = useRafThrottle(setMouseP)
  const updateHovered = useRafThrottle(setHovered)

  useEffect(() => {
    console.log('Viewer mount')
    if (!containerRef.current) return

    const container = containerRef.current

    const scene = createScene()

    const camera = createCamera(
      container.clientWidth,
      container.clientHeight
    )

    const renderer = createRenderer(container)
    container.appendChild(renderer.domElement)

    createLights(scene)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.PAN,
      RIGHT: THREE.MOUSE.DOLLY
    }
    controls.enableDamping = true

    const meshes =  createMeshesWithBVH(scene)
    setMeshesS(meshes)

    let raf = 0
    function animate() {
      raf = requestAnimationFrame(animate)
      controls.update()

      raycaster.setFromCamera(mouse, camera)

      raycaster.firstHitOnly = true
      const intersects = raycaster.intersectObjects(
        meshes,
        false
      )
      if (intersects.length > 0) {
        const currentHit = intersects[0].object as THREE.Mesh;
        if (hoveredRef.current !== currentHit) {
          // 이전 객체 초기화
          if (hoveredRef.current) {
            (hoveredRef.current.material as THREE.MeshStandardMaterial).emissive.set(0x000000);
            (hoveredRef.current.material as THREE.MeshStandardMaterial).color.set("hotpink");
          }
          // 새 객체 설정
          hoveredRef.current = currentHit;
          const mat = currentHit.material as THREE.MeshStandardMaterial;
          mat.emissive.set(0xff0000);
          setHovered(currentHit); 
        }
      } else if (hoveredRef.current) {
        (hoveredRef.current.material as THREE.MeshStandardMaterial).emissive.set(0x000000);
        hoveredRef.current = null;
        setHovered(null);
      }

      renderer.render(scene, camera)
    }
    animate()

    const onMouseMove = (event: MouseEvent) => {
      mouse.x = (event.offsetX / container.clientWidth) * 2 - 1
      mouse.y = -(event.offsetY / container.clientHeight) * 2 + 1
      // if(!raf){
      //   raf = requestAnimationFrame(()=>{
      //     setMouseP({cx:event.offsetX, cy:event.offsetY, x:mouse.x, y:mouse.y})
      //     raf = 0
      //   })
      // } 
      updateMouse({cx:event.offsetX, cy:event.offsetY, x:mouse.x, y:mouse.y})
    }
    container.addEventListener("mousemove", onMouseMove)

    return () => {
      if(raf) cancelAnimationFrame(raf)
      container.removeEventListener("mousemove", onMouseMove)
      if(container.contains(renderer.domElement))
        container.removeChild(renderer.domElement)
      // Three.js 자원 명시적 해제
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


  useEffect(()=>{
    console.log('mouse', mouse)
  },[mouse])

  return (
    <div
      ref={containerRef}
      style={{position:"relative",top:"0px", left:"0px",
        width: "100%", height: "100%" ,
        ...style
      }}
    >
      {hovered && mouseP &&
      <div style={{pointerEvents:"none",position:'absolute', 
        top:`${mouseP.cy+1}px`, left:`${mouseP.cx+4}px`, 
        background:"rgba(0,0,0,0.8)", borderRadius:"4px", padding:"8px 12px"}}>
        {hovered.name}
      </div>
      }
      <div style={{position:"absolute", bottom:"0px", left:"0px", width:"100%", height:'100px', padding:"10px",
         background:'rgba(222,222,222,0.5)',
         display:"grid", gridTemplateColumns:'1fr 1fr 1fr', gap:"10px"
      }}>
          <span style={{justifySelf:"end"}}>mouse position: {mouseP?.cx}px, {mouseP?.cy}px</span>
          <span style={{justifySelf:"center"}}>selected: {}</span>
          <span style={{justifySelf:"start"}}>hovered: {hovered?hovered.name:'null'}</span>
          <span style={{justifySelf:"end"}}>normalized mouse position: {mouseP?.x.toFixed(6)}, {mouseP?.y.toFixed(6)}</span>
          <span style={{justifySelf:"center"}}>meshes: ({meshesS?.length}) [ {meshesS?.map((m)=>m.name+', ')}]</span>
      </div>
    </div>
  )
}
