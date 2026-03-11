# Three.js 3D Viewer

3D 데이터 뷰어 프로젝트입니다.

## 기술 스택

- **3D Rendering**: Three.js, WebGL, GLSL
- **Frontend**: TypeScript, React, Next.js
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
