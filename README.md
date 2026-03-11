# Three.js 3D Viewer

3D Rendering Pipeline 이해 및 스터디 목적으로 간단히 제작한
**3D 데이터 뷰어 프로젝트**입니다.

Three.js의 내부 구조와 WebGL 렌더링 과정을 학습 및
대규모 3D 데이터를 효율적으로 렌더링하기 위한 **성능 최적화 기법**을 실험

## 기술 스택

- **3D Rendering**: Three.js, WebGL, GLSL
- **Frontend**: TypeScript, React, Vite
- **3D Assets**: glTF

## 주요 기능

- Three.js 기반 3D 렌더링
- Scene / Camera / Light / Material 구조
- glTF 모델 로딩 및 관리
- 3D 데이터 시각화
- 인터랙션 구현

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
    scenes/      # Scene 관리
    cameras/     # Camera 관리
    lights/      # Light 관리
    materials/   # Material 관리
    loaders/     # GLTF 로더
  utils/         # 유틸리티 함수
```

## 학습 내용
# Rendering Pipeline

3D 렌더링은 다음과 같은 과정으로 이루어진다.

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


Three.js는 이 과정을 추상화하여 다음 API를 제공한다.

- Scene
- Camera
- Mesh
- Material
- Renderer

---

# Project Structure

src
├ components
│ └ Viewer.tsx
│
├ three
│ ├ scene
│ ├ camera
│ ├ lights
│ ├ loaders
│ └ renderer
│
└ utils


설계 목표

- Three.js 로직 모듈화
- React와 렌더링 시스템 분리
- 유지보수성 향상

---

# Core Concepts

## Scene

Scene은 3D 월드를 구성하는 **루트 컨테이너**이다.

Three.js는 Scene 내부 객체를 **Scene Graph 구조**로 관리한다.


Scene
├ Mesh
├ Mesh
└ Group
├ Mesh
└ Mesh


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

현실적인 조명 표현을 위해 **PBR 기반 Material**을 사용하였다.


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

Raycasting을 이용하여 **마우스 인터랙션 시스템**을 구현하였다.

기능

- Mesh hover
- Object selection
- 3D object interaction

동작 방식


Mouse Position
↓
Normalized Device Coordinates
↓
Raycaster
↓
Object Intersection


사용 API


THREE.Raycaster


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


Bounding Volume Hierarchy

    Root
   /   \
Node   Node
/ \     / \

Triangle Triangle


효과

- Raycasting 성능 향상
- Triangle 검사 수 감소

---

# Instancing Optimization

대량의 동일한 Mesh가 존재할 경우  
각 Mesh를 개별적으로 렌더링하면 Draw Call이 증가한다.

이를 해결하기 위해


THREE.InstancedMesh


를 사용하였다.

Instancing 특징

- Geometry 공유
- Material 공유
- GPU에서 여러 객체를 한 번에 렌더링

효과


1000 Mesh → 1 Draw Call


---

# Level of Detail (LOD)

카메라와의 거리에 따라 모델의 디테일을 조절하였다.


THREE.LOD


구조


Camera Distance

0m → High Poly
20m → Medium Poly
50m → Low Poly


효과

- GPU 연산량 감소
- 프레임 유지

---

# What I Learned

이 프로젝트를 통해 다음 내용을 학습하였다.

- Three.js 내부 구조 이해
- WebGL Rendering Pipeline
- Scene Graph 구조
- GPU Draw Call 개념
- Raycasting 기반 인터랙션
- glTF 포맷 구조
- 3D 렌더링 최적화 기법

---

