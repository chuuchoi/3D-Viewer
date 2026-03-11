import * as THREE from "three"

export function createCamera(width: number, height: number) {
  const camera = new THREE.PerspectiveCamera(
    75,
    width / height,
    0.1,
    1000
  )

  camera.position.set(0, 2, 5)

  return camera
}