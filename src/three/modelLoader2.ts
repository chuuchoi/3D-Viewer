import * as THREE from "three"
// import { mergeBufferGeometries } from "three/examples/jsm/utils/BufferGeometryUtils"

export function createTestMesh() {

  const geometry = new THREE.ConeGeometry()
  const material = new THREE.MeshStandardMaterial({
    color: 0xff00ff
  })

  const mesh = new THREE.Mesh(geometry, material)

  return mesh
}
// Instancing (draw call 최적화)
// 문제
// 1000 meshes
// → draw call 1000
// → FPS drop
export function createManyMeshes(scene: THREE.Scene) {

  const geometry = new THREE.BoxGeometry()

  for (let i = 0; i < 10000; i++) {

    const material = new THREE.MeshStandardMaterial({
      color: 0x44aa88
    })

    const mesh = new THREE.Mesh(geometry, material)

    mesh.position.set(
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 20
    )

    scene.add(mesh)
  }
}
// 해결
// InstancedMesh
// → draw call 1
// Three.js 제공
// THREE.InstancedMesh
export function createInstancedCubes() {

  const count = 10000

  const geometry = new THREE.BoxGeometry()
  const material = new THREE.MeshStandardMaterial({
    color: 0x44aa88
  })

  const mesh = new THREE.InstancedMesh(
    geometry,
    material,
    count
  )

  const dummy = new THREE.Object3D()

  for (let i = 0; i < count; i++) {

    dummy.position.set(
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 20
    )

    dummy.updateMatrix()
    mesh.setMatrixAt(i, dummy.matrix)
  }

  return mesh
}
// Three.js의 InstancedMesh 조건
// 같은 Geometry
// 같은 Material
// geometry와 material이 모두 서로 다른 1000개의 mesh라면 상황이 달라집니다.
// 실무 해결 방법
// 이 상황에서 사용하는 방법은 4가지입니다.
// 방법 1️⃣ Geometry Merge
// 가장 많이 사용하는 방법입니다.
export function createGeometryMergeCubes(
  // scene: THREE.Scene
) {
  const geometries = []

for (let i = 0; i < 1000; i++) {

  const geo = new THREE.BoxGeometry()

  geo.translate(
    Math.random() * 20,
    Math.random() * 20,
    Math.random() * 20
  )

  geometries.push(geo)
}

// const merged = mergeBufferGeometries(geometries)

// const mesh = new THREE.Mesh(
//   merged,
//   new THREE.MeshStandardMaterial({ color: "red" })
// )

// scene.add(mesh)
}



export function createLOD() {

  const lod = new THREE.LOD()

  // High poly
  const highGeometry = new THREE.SphereGeometry(1, 64, 64)
  const highMaterial = new THREE.MeshStandardMaterial({ color: "red" })
  const highMesh = new THREE.Mesh(highGeometry, highMaterial)

  // Medium poly
  const midGeometry = new THREE.SphereGeometry(1, 32, 32)
  const midMaterial = new THREE.MeshStandardMaterial({ color: "green" })
  const midMesh = new THREE.Mesh(midGeometry, midMaterial)

  // Low poly
  const lowGeometry = new THREE.SphereGeometry(1, 8, 8)
  const lowMaterial = new THREE.MeshStandardMaterial({ color: "blue" })
  const lowMesh = new THREE.Mesh(lowGeometry, lowMaterial)

  // distance 기준
  lod.addLevel(highMesh, 0)
  lod.addLevel(midMesh, 20)
  lod.addLevel(lowMesh, 50)

  return lod
}