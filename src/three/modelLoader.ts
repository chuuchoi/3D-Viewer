import * as THREE from "three"
import {
  computeBoundsTree,
  disposeBoundsTree,
  acceleratedRaycast
} from "three-mesh-bvh"

export function createBoxesWithBVH(scene: THREE.Scene) {
const boxes: THREE.Mesh[] = []
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree
THREE.Mesh.prototype.raycast = acceleratedRaycast

for (let i = 0; i < 200; i++) {

  const geometry = new THREE.BoxGeometry(1,1,1)

  geometry.computeBoundsTree()

  const material = new THREE.MeshStandardMaterial({
    color: "orange"
  })

  const mesh = new THREE.Mesh(geometry, material)

  mesh.position.set(
    Math.random()*20-10,
    Math.random()*20-10,
    Math.random()*20-10
  )

  scene.add(mesh)
  boxes.push(mesh)
}

return boxes
}
