// src/three/SceneManager.ts
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createRenderer } from "./renderer";
import { createScene } from "./scene";
import { createCamera } from "./camera";
import { createLights } from "./light";
import { createMeshesWithBVH } from "./model";

export class SceneManager {
  private raf: number = 0;
  public scene = createScene();
  public renderer: THREE.WebGLRenderer;
  public camera: THREE.PerspectiveCamera;
  public controls: OrbitControls;
  public meshes: THREE.Mesh[] = [];
  public raycaster = new THREE.Raycaster();
  public container: HTMLDivElement;

  constructor(container: HTMLDivElement) {
    this.container = container;
    this.camera = createCamera(container.clientWidth, container.clientHeight);
    this.renderer = createRenderer(container);
    if(!this.container.contains(this.renderer.domElement))
      container.appendChild(this.renderer.domElement);
    
    createLights(this.scene);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.mouseButtons = {
      RIGHT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.PAN,
    }
    this.meshes = createMeshesWithBVH(this.scene);
    this.raycaster.firstHitOnly = true;
  }

  public animate(callback: () => void) {
    const loop = () => {
      this.raf = requestAnimationFrame(loop);
      this.controls.update();
      callback();
      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }

  public cleanup() {
    cancelAnimationFrame(this.raf);
    this.controls.dispose();
    this.scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
        else child.material.dispose();
      }
    });
    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
    
  }
}
