import * as THREE from "three"

export function createLights(scene: THREE.Scene) {

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
  directionalLight.position.set(5, 5, 5)

  scene.add(directionalLight)
}