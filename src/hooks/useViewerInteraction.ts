// src/hooks/useViewerInteraction.ts
import { useState, useRef } from "react";
import * as THREE from "three";

export function useViewerInteraction() {
  const [hovered, setHovered] = useState<THREE.Mesh | null>(null);
  const [selected, setSelected] = useState<THREE.Mesh | null>(null);
  const hoveredRef = useRef<THREE.Mesh | null>(null);
  const selectedRef = useRef<THREE.Mesh | null>(null);

  const handleHover = (intersects: THREE.Intersection[]) => {
    const currentHit = intersects.length > 0 ? (intersects[0].object as THREE.Mesh) : null;
    if(!currentHit){
      if (hoveredRef.current){
        if(hoveredRef.current !== selectedRef.current){
          (hoveredRef.current.material as THREE.MeshStandardMaterial).emissive.set(0x000000);
          hoveredRef.current.material instanceof THREE.MeshStandardMaterial &&
          hoveredRef.current.material.color.set("hotpink");
        }else{
          (hoveredRef.current.material as THREE.MeshStandardMaterial).emissive.set(0x000000);
        }
        hoveredRef.current = null;
        setHovered(null);
      }
      return;
    }

    if (hoveredRef.current !== currentHit) {
      if (hoveredRef.current) {
        if(hoveredRef.current !== selectedRef.current){
          (hoveredRef.current.material as THREE.MeshStandardMaterial).emissive.set(0x000000);
          hoveredRef.current.material instanceof THREE.MeshStandardMaterial &&
          hoveredRef.current.material.color.set("hotpink");
        }else{
          (hoveredRef.current.material as THREE.MeshStandardMaterial).emissive.set(0x000000);
        }
      }
      if(currentHit !== selectedRef.current){
        (currentHit.material as THREE.MeshStandardMaterial).emissive.set(0xff0000);
        (currentHit.material as THREE.MeshStandardMaterial).color.set("hotpink");
      }else{
        (currentHit.material as THREE.MeshStandardMaterial).emissive.set("blue");
      }
      hoveredRef.current = currentHit;
      setHovered(currentHit);
    }
  };

  const handleSelect = (intersects: THREE.Intersection[]) => {
    const clickedMesh = intersects.length > 0 ? (intersects[0].object as THREE.Mesh) : null;
    if(!clickedMesh) return;

    if (selectedRef.current !== clickedMesh) {
      if (selectedRef.current) {
        (selectedRef.current.material as THREE.MeshStandardMaterial).emissive.set(0x000000);
        const col = (clickedMesh.material as THREE.MeshStandardMaterial).color;
        (selectedRef.current.material as THREE.MeshStandardMaterial).color.set(col);
      }
      clickedMesh.material instanceof THREE.MeshStandardMaterial && clickedMesh.material.emissive.set("blue");
      clickedMesh.material instanceof THREE.MeshStandardMaterial && clickedMesh.material.color.set("blue");
      setSelected(clickedMesh);
      
      selectedRef.current = clickedMesh;
    }
  };

  return { hovered, selected, handleHover, handleSelect };
}
