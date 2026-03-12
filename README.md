# Three.js 3D Viewer

3D Rendering Pipeline 이해 및 스터디 목적으로 제작한 **3D 데이터 뷰어 프로젝트**

Three.js의 내부 구조와 WebGL 렌더링 과정을 학습하고, 대규모 데이터를 효율적으로 처리하기 위한 **성능 최적화 기법**을 실험

## 🎯 Goal
- **성능 최적화**: 1,000개 이상의 3D 오브젝트를 60FPS로 렌더링
- **모듈화**: Three.js 로직을 클래스화하여 React 생명주기와 분리
- **메모리 관리**: SPA 환경에서 GPU 자원 누수(Memory Leak) 방지
- **유지보수성 향상**: React와 렌더링 시스템 분리, Three.js 로직 모듈화

---

## 문제(현상)-> 해결과정 -> 결과
1. 문제 상황 (Phenomenon)
리소스 중첩: 탭이나 버튼을 통해 서로 다른 3D 씬(Viewer 1~4)으로 전환할 때, 이전 씬의 애니메이션 루프와 데이터가 메모리에 그대로 남는 현상 발생.
성능 저하: 여러 번 씬을 교체할수록 프레임 드랍(60fps → 20fps 미만)이 심해지며 인터랙션이 불가능해짐.
브라우저 경고: "WARNING: Too many active WebGL contexts. Oldest context will be lost." 메시지와 함께 일부 렌더러가 비정상적으로 종료됨.
2. 해결 과정 (Step-by-Step)
애니메이션 루프의 명시적 중단:
컴포넌트가 언마운트(Unmount)된 후에도 requestAnimationFrame이 백그라운드에서 계속 실행되어 이미 사라진 객체를 참조하려는 시도를 발견. cancelAnimationFrame을 도입하여 즉시 중단하도록 처리.
WebGL 컨텍스트 및 리소스 수동 해제:
Three.js의 Scene과 Renderer는 자바스크립트의 가비지 컬렉터가 자동으로 관리하지 않는 영역이 많음. cleanup 함수 내에서 renderer.dispose(), geometry.dispose(), material.dispose()를 각각 호출하여 GPU 메모리 점유를 명시적으로 해제.
이벤트 리스너 및 DOM 정리:
mousemove 등 window/container에 걸린 리스너를 제거하고, renderer.domElement를 부모 노드에서 확실히 분리하여 메모리 누수 경로를 차단.
3. 결과 및 성과 (Result)
안정적인 FPS 유지: 씬 전환을 수십 번 반복해도 CPU/GPU 점유율이 일정하게 유지되며 60fps의 매끄러운 성능 확보.
메모리 효율성: WebGL 컨텍스트 경고 해결 및 브라우저 메모리 누수(Memory Leak) 제로화 성공.
컴포넌트 독립성 확보: 각 Viewer 컴포넌트가 생명주기에 따라 자원을 스스로 완벽히 관리하게 되어, 한 화면에 여러 개의 뷰어를 띄우는 멀티 뷰(Scene 4) 환경에서도 충돌 없이 구동 가능. 

---

## A/B Testing
[성능 비교 실험: 개별 Mesh vs InstancedMesh (with BVH)]
- **Scene 3 (Instanced)**: 1개의 InstancedMesh를 통해 1,000개의 인스턴스 렌더링.
- **Scene 3.1 (Non-Instanced)**: 1,000개의 개별 Mesh와 Material 생성.

분석 및 해결 (Insights)

초기 마운트 지연 시간: Scene 3.1에서는 1,000개의 고해상도 SphereGeometry를 생성하고 각각 scene.add()하는 과정에서 메인 스레드 점유가 길어져 화면이 잠시 멈추는 현상이 발생했습니다. 반면, InstancedMesh는 단일 지오메트리를 공유하므로 즉시 렌더링이 시작되었습니다.

동적 색상 제어: setColorAt과 instanceColor.needsUpdate 속성을 활용하여 단일 Draw Call 내에서도 특정 인스턴스(예: 0번 인스턴스)만 개별 색상을 부여할 수 있음을 확인했습니다.

---

## 🚀 Key Features & Optimization

### 1. 렌더링 효율화 (Instancing & LOD)
- **GPU Instancing**: 동일한 Geometry를 가진 1,000개의 오브젝트를 `InstancedMesh`를 통해 단일 Draw Call로 처리하여 CPU-GPU 병목 현상을 해결했습니다.
- **LOD (Level of Detail)**: 카메라와의 거리에 따라 폴리곤 밀도를 동적으로 조절하여 불필요한 연산을 줄였습니다.

Draw Call을 줄이는 방법 (최적화)
- **Instancing (InstancedMesh)**: "같은 모양" 1,000개를 한 번의 명령으로 그리기.
- **Merging (BatchedMesh, BufferGeometryUtils)**: 여러 개의 "다른 모양"을 아예 하나의 커다란 데이터 덩어리로 합쳐버리기.
- **Atlasing**: 여러 장의 이미지를 한 장의 큰 이미지에 합쳐서 텍스처 교체 횟수 줄이기.

### 2. 인터랙션 최적화 (BVH Raycasting)
- **Problem**: 기본 Raycasting은 모든 삼각형을 전수 조사하여 객체 증가 시 프리징 발생.
- **Solution**: `three-mesh-bvh`를 적용, 트리 구조의 가속 구조를 구축하여 탐색 복잡도를 $O(n)$에서 $O(\log n)$으로 개선했습니다.

### 3. 리소스 생명주기 관리
- React의 `useEffect` 클린업 함수를 활용해 컴포넌트 언마운트 시 아래 자원을 명시적으로 해제합니다.
  - **Geometry & Material**: `dispose()` 호출로 비디오 메모리 반환
  - **Renderer**: WebGL 컨텍스트 파괴 및 DOM 제거
  - **Animation**: `cancelAnimationFrame`을 통한 루프 정지

---
---

## 학습 내용
# Rendering Pipeline

3D 렌더링 과정
```
Scene Graph
↓
Camera Projection
↓
Geometry Processing
↓
Vertex Shader
↓
Rasterization
↓
Fragment Shader
↓
Framebuffer
```

Three.js는 이 과정을 추상화하여 다음 API를 제공

- Scene
- Camera
- Mesh
- Material
- Renderer

---

# Rendering Optimization

3D 데이터가 많아질 경우 렌더링 성능 문제가 발생한다.

이를 해결하기 위해 여러 최적화 기법을 적용하였다.

---

# BVH Raycasting Optimization

기본 Three.js Raycasting은 모든 Triangle을 검사한다.

복잡한 모델에서는 성능 문제가 발생할 수 있다.

이를 해결하기 위해


three-mesh-bvh


라이브러리를 사용하였다.

BVH 구조

```
Bounding Volume Hierarchy

    Root
   /   \
Node   Node
/ \     / \

Triangle Triangle
```

효과

- Raycasting 성능 향상
- Triangle 검사 수 감소

---

# Instancing Optimization

대량의 동일한 Mesh가 존재할 경우 각 Mesh를 개별적으로 렌더링하면 Draw Call이 증가한다.

이를 해결하기 위해 THREE.InstancedMesh를 사용

Instancing 특징

- Geometry 공유
- Material 공유
- GPU에서 여러 객체를 한 번에 렌더링

효과

1000 Mesh → 1 Draw Call

---

# Level of Detail (LOD)

카메라와의 거리에 따라 모델의 디테일을 조절

구조
Camera Distance
0m → High Poly
20m → Medium Poly
50m → Low Poly

효과
- GPU 연산량 감소
- 프레임 유지

---

# Core Concepts

## Scene

Scene은 3D 월드를 구성하는 **루트 컨테이너**

Three.js는 Scene 내부 객체를 **Scene Graph 구조**로 관리

```
Scene
├ Mesh
├ Mesh
└ Group
├ Mesh
└ Mesh
```

특징

- Object3D 기반 계층 구조
- 부모 transform 상속
- 렌더링 대상 관리

---

## Camera

Camera는 Scene을 어떤 시점에서 바라볼지 정의한다.

사용된 카메라


THREE.PerspectiveCamera


핵심 개념

- Field of View
- Projection Matrix
- View Matrix
- Frustum

---

## Mesh

Mesh는 실제로 화면에 렌더링되는 3D 객체이다.

구성

Mesh
├ Geometry
└ Material


Geometry

- Vertex
- Normal
- UV
- Index

Material

- 색상
- 반사
- 표면 특성

---

## Material (PBR)

현실적인 조명 표현을 위해 **PBR 기반 Material** 사용

THREE.MeshStandardMaterial

핵심 파라미터

- roughness
- metalness
- normalMap
- envMap

---

## Renderer

Renderer는 Scene과 Camera를 이용하여 실제 픽셀을 생성한다.


THREE.WebGLRenderer


렌더링 과정

1. Scene Graph traversal  
2. GPU buffer upload  
3. Shader execution  
4. Rasterization  
5. Framebuffer output

---

# Interaction System

Raycasting을 이용하여 **마우스 인터랙션 시스템** 구현

동작 방식

```
Mouse Position
↓
Normalized Device Coordinates
↓
Raycaster
↓
Object Intersection
```

사용 API

THREE.Raycaster

---

# What I Learned

이 프로젝트를 통해 다음 내용을 학습하였다.

- Three.js 내부 구조 이해
- WebGL Rendering Pipeline
- GPU Draw Call 개념
- Raycasting 기반 인터랙션
- glTF 포맷 구조
- 3D 렌더링 최적화 기법

---

# Futuer Work

GLSL, Post-Processing pipeline 구축을 통한 화면 전체 특수 효과(e.g. 비네팅 등)

- 화면 전체가 아닌 개별 물체: ShaderMaterial 사용
- RenderPass: 평소처럼 Scene과 Camera를 이용해 화면을 그립니다. (결과물은 메모리에 저장됨)
- ShaderPass: 위에서 그린 결과물(이미지)을 입력받아, 내가 만든 GLSL(비네팅 등) 필터를 입힙니다.
- EffectComposer: 이 모든 과정을 순서대로 실행하고 최종 결과를 화면에 출력합니다.

---

## 🛠 Tech Stack

- **3D Rendering**: Three.js, WebGL, GLSL
- **Frontend**: TypeScript, React, Vite
- **3D Assets**: glTF(AI generated 3d model)
- **Library**: three-mesh-bvh (Raycasting 최적화)

## 시작하기

```bash
npm install
npm run dev
```

## 프로젝트 구조

```
src/
  components/    # React 컴포넌트
  three/         # Three.js 관련 코드
    scene      # Scene 관리
    camera     # Camera 관리
    light      # Light 관리
  hooks/         # 커스텀 훅
```