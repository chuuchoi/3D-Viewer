import * as THREE from "three";
import { useEffect, useRef, useState } from "react";
import useRafThrottle from "@/hooks/useRafThrottle";
import { SceneManager } from "@/three/SceneManager";
import { useViewerInteraction } from "@/hooks/useViewerInteraction";

export default function Viewer({ style }: { style?: React.CSSProperties }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef(new THREE.Vector2(-99, -99));
  const [mouseP, setMouseP] = useState({ cx: 0, cy: 0, x: 0, y: 0 });
  const [meshesS, setMeshesS] = useState<THREE.Mesh[]>()
  const updateMouse = useRafThrottle(setMouseP);

  const { hovered, selected, handleHover, handleSelect } = useViewerInteraction();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const scene = new SceneManager(container);
    setMeshesS(scene.meshes)

    scene.animate(() => {
      scene.raycaster.setFromCamera(mouseRef.current, scene.camera);
      const intersects = scene.raycaster.intersectObjects(scene.meshes, false);
      handleHover(intersects);
    });

    const onMouseMove = (e: MouseEvent) => {
      if(!container) return
      const rect = container.getBoundingClientRect()
      const cx = e.clientX - rect.left
      const cy = e.clientY - rect.top
      const x = (cx / rect.width) * 2 - 1;
      const y = -(cy / rect.height) * 2 + 1;
      mouseRef.current.set(x, y);
      updateMouse({ cx, cy, x, y });
    };

    const onClick = () => {
      scene.raycaster.setFromCamera(mouseRef.current, scene.camera);
      const intersects = scene.raycaster.intersectObjects(scene.meshes, false);
      handleSelect(intersects);
    };

    container.addEventListener("mousemove", onMouseMove);
    container.addEventListener("click", onClick);

    return () => {
      scene.cleanup();
      container?.removeEventListener("mousemove", onMouseMove);
      container?.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", height: "100%", ...style }}>
      {hovered && <Tooltip name={hovered.name} pos={mouseP} />}
      <StatusBar mouseP={mouseP} selected={selected} hovered={hovered} meshes={meshesS} />
    </div>
  );
}

const StatusBar = ({ mouseP, selected, hovered, meshes}:
  {
    mouseP: { cx: number; cy: number; x: number; y: number };
    selected: THREE.Mesh | null;
    hovered: THREE.Mesh | null;
    meshes: THREE.Mesh[] | undefined;
  }
) => {
  return (
      <div style={{position:"absolute", bottom:"0px", left:"0px", width:"100%", height:'100px', padding:"10px",
        overflow:"auto", scrollbarWidth:"thin",
         background:'rgb(29 30 48 / 88%)', boxShadow:"rgb(165 168 189 / 40%) -1px -1px 40px 1px",
         display:"grid", gridTemplateColumns:'1fr 1fr 1fr', gap:"10px"
      }}>
          <span style={{justifySelf:"end"}}>mouse position: {mouseP?.cx}px, {mouseP?.cy}px</span>
          <span style={{justifySelf:"center"}}><span style={{fontWeight:"600"}}>selected:</span> {selected?selected.name:'null'}</span>
          <span style={{justifySelf:"start"}}>meshes: ({meshes?.length}) [ {meshes?.map((m)=>m.name+', ')}]</span>
          <span style={{justifySelf:"end"}}>normalized position: {mouseP?.x.toFixed(5)}, {mouseP?.y.toFixed(5)}</span>
          <span style={{justifySelf:"center"}}><span style={{fontWeight:"600"}}>hovered:</span> {hovered?hovered.name:'null'}</span>
      </div>
  );
};



const Tooltip = ({ name, pos }: { name: string; pos: { cx: number; cy: number; x: number; y: number } }) => {
  const ref = useRef<HTMLDivElement>(null)
  const [positon, setPosition] = useState({ left: pos.cx +4, top: pos.cy + 1})
  useEffect(()=>{
    const el = ref.current
    if(!el) return

    const rect = el.getBoundingClientRect()
    let left = pos.cx + 4
    let top = pos.cy + 1
    if(left + rect.width > window.innerWidth){
      left = pos.cx - rect.width - 4
    }
    if(top + rect.height > window.innerHeight){
      top = pos.cy - rect.height - 1
    }
    setPosition({left, top})
  },[pos])
  return (
    <div ref={ref}
      style={{ pointerEvents: "none", position: "absolute", background: "rgba(0,0,0,0.8)", borderRadius: "4px", padding: "8px 12px",
        top: positon.top,
        left: positon.left,
      }}
    >
      {name}
    </div>
  );
};

