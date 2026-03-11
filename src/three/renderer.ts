import * as THREE from "three"

export function createRenderer(container: HTMLDivElement) {
  const renderer = new THREE.WebGLRenderer({ antialias: true })

  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.setPixelRatio(window.devicePixelRatio)

  container.appendChild(renderer.domElement)

  return renderer
}