import * as THREE from "three"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
import {
  computeBoundsTree,
  disposeBoundsTree,
  acceleratedRaycast
} from "three-mesh-bvh"

export function createMeshesWithBVH(scene: THREE.Scene) {
const meshes: THREE.Mesh[] = []
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree
THREE.Mesh.prototype.raycast = acceleratedRaycast

  const loader = new GLTFLoader()
  loader.load(
    "./untitled.glb",
    (gltf) => {
      // scene.add(gltf.scene)
      // console.log(gltf.scene)

      gltf.scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (Array.isArray(child.material)) {
            child.material = child.material.map(m => m.clone())
          } else {
            child.material = child.material.clone()
          }
          child.geometry.computeBoundsTree()

          meshes.push(child)
        }
      })
      
      // console.log(meshes)
      meshes.forEach((mesh) => {
        scene.add(mesh)
      })
    },
    undefined,
    (error) => {
      console.error("Error loading model:", error)
    }
  )
return meshes
}
