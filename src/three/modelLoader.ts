import * as THREE from "three"
import {
  computeBoundsTree,
  disposeBoundsTree,
  acceleratedRaycast
} from "three-mesh-bvh"

// 전역 설정 (한 번만 실행)
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree
THREE.Mesh.prototype.raycast = acceleratedRaycast

export function createBoxesWithBVH(scene: THREE.Scene) {
const boxes: THREE.Mesh[] = []

for (let i = 0; i < 1000; i++) {

  const geometry = new THREE.SphereGeometry(1, 32, 32)

  geometry.computeBoundsTree()

  const material = new THREE.MeshStandardMaterial({
    color: "orange"
  })

  const mesh = new THREE.Mesh(geometry, material)

  mesh.position.set(
    Math.random()*50-50,
    Math.random()*50-50,
    Math.random()*50-50
  )

  scene.add(mesh)
  boxes.push(mesh)
}

return boxes
}

export function createBoxesWithInstancedBVH(scene: THREE.Scene, count: number = 1000) {
  const geometry = new THREE.SphereGeometry(1, 32, 32)
  // 1. Geometry에 BVH 계산 (모든 인스턴스가 이 하나의 BVH를 공유)
  geometry.computeBoundsTree()

  const material = new THREE.MeshStandardMaterial({ color: "orange" })
  // 2. InstancedMesh 생성
  const instancedMesh = new THREE.InstancedMesh(geometry, material, count)
  
  const dummy = new THREE.Object3D()

  for (let i = 0; i < count; i++) {
    if(i==0){
      dummy.position.set(0, 0, 0);
    }else{
      dummy.position.set(
        Math.random() * 50 - 50,
        Math.random() * 50 - 50,
        Math.random() * 50 - 50
      )
    }
    dummy.updateMatrix()
    
    // 개별 인스턴스 행렬 설정
    instancedMesh.setMatrixAt(i, dummy.matrix)
  }
// 루프 종료 후 행렬 업데이트 알림 (이게 없으면 레이캐스터가 위치를 모릅니다)
instancedMesh.instanceMatrix.needsUpdate = true;
// [필수] setColorAt을 한 번이라도 호출해야 instanceColor 버퍼가 생성됩니다.
const color = new THREE.Color(0x000000)
for(let i = 0; i < count; i++) {
  instancedMesh.setColorAt(i, color)
}
instancedMesh.setColorAt(0, new THREE.Color(0xff0000))
  scene.add(instancedMesh)
  return instancedMesh
}
