import { useState, useEffect, useRef } from "react"
import { createRenderer } from "@/three/renderer"
import { createScene } from "@/three/scene"
import { createCamera } from "@/three/camera"
import { createLights } from "@/three/light"
import { createLOD } from "@/three/modelLoader2"

export default function Viewer2({style}:{style?:React.CSSProperties}) {
  const [currentLevel, setCurrentLevel] =useState<number | undefined>()
  const containerRef = useRef<HTMLDivElement>(null)
  const rafId = useRef<number>(null)

  useEffect(() => {

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

    // const mesh = createInstancedCubes()
    // scene.add(mesh)

    // createManyMeshes(scene)
    const meshLOD = createLOD()
    scene.add(meshLOD)

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
      if(rafId.current) cancelAnimationFrame(rafId.current)
      container.removeChild(renderer.domElement)

    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{position:"relative",top:"0px", left:"0px",
        width: "100%", height: "100%" ,
        ...style
      }}
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