import { Component, AfterViewInit, ElementRef, ViewChild, HostListener, ChangeDetectionStrategy } from '@angular/core';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

import * as THREE from 'three';

@Component({
  selector: 'app-logo',
  templateUrl: './logo.component.html',
  styleUrls: ['./logo.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoComponent implements AfterViewInit {
  @ViewChild('logoCanvas') private readonly canvasRef!: ElementRef<HTMLCanvasElement>;
  
  // Three.js objects
  private mesh: THREE.Mesh | null = null;
  private group: THREE.Group | null = null;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private lights: THREE.Light[] = [];
  
  // Rotation control
  private isDragging = false;
  private previousMousePosition = { x: 0, y: 0 };

  // Constants
  private readonly ROTATION_SPEED = 0.01;
  private readonly CAMERA_POSITION_Z = 8;
  
  // light configuration with subtle gradient highlights
  private readonly LIGHT_CONFIG = {
    ambient: { color: 0xffffff, intensity: 0.4 },
    spotLights: [
      { color: 0xf0f0ff, intensity: 8, position: [3, 2, 4] as [number, number, number] },
      { color: 0xfff0e8, intensity: 8, position: [-3, 2, 4] as [number, number, number] },
      { color: 0xffcca1, intensity: 6, position: [0, -2, 3] as [number, number, number] }
    ],
    directional: { color: 0xffffff, intensity: 1.5, position: [0, 0, 5] as [number, number, number] }
  };

  ngAfterViewInit(): void {
    this.initScene();
    this.initLights();
    this.loadText();
  }

  private initScene(): void {
    const canvas = this.canvasRef.nativeElement;
    const { clientWidth: width, clientHeight: height } = canvas;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.z = this.CAMERA_POSITION_Z;

    this.renderer = new THREE.WebGLRenderer({ 
      canvas, 
      alpha: true, 
      antialias: true 
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0x000000, 0);

    this.group = new THREE.Group();
    this.scene.add(this.group);
  }

  private initLights(): void {
    // Ambient light for base illumination
    const ambientLight = new THREE.AmbientLight(
      this.LIGHT_CONFIG.ambient.color,
      this.LIGHT_CONFIG.ambient.intensity
    );
    this.scene.add(ambientLight);
    this.lights.push(ambientLight);

    // Spot lights with enhanced settings for gradient effect
    this.LIGHT_CONFIG.spotLights.forEach(config => {
      const light = new THREE.SpotLight(config.color, config.intensity);
      const [x, y, z] = config.position;
      light.position.set(x, y, z);
      light.distance = 15;
      light.angle = Math.PI / 5;
      light.penumbra = 0.9;
      light.decay = 1.2;
      this.scene.add(light);
      this.lights.push(light);
    });

    // directional light for main illumination
    const frontLight = new THREE.DirectionalLight(
      this.LIGHT_CONFIG.directional.color,
      this.LIGHT_CONFIG.directional.intensity
    );
    const [x, y, z] = this.LIGHT_CONFIG.directional.position;
    frontLight.position.set(x, y, z);
    this.scene.add(frontLight);
    this.lights.push(frontLight);
  }

  private loadText(): void {
    const loader = new FontLoader();
    loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
      const geometry = new TextGeometry('Thunder', {
        font,
        size: 1.2,
        depth: 0.5,
        bevelEnabled: true,
        bevelThickness: 0.05,
        bevelSize: 0.04,
        bevelSegments: 6,
        curveSegments: 8
      });

      geometry.computeBoundingBox();
      const centerOffset = this.calculateCenterOffset(geometry);

      const material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.2,
        roughness: 0.3,
        emissive: 0xffffff,
        emissiveIntensity: 0.2
      });

      this.mesh = new THREE.Mesh(geometry, material);
      this.mesh.position.set(centerOffset.x, centerOffset.y, centerOffset.z);
      
      if (this.group) {
        this.group.add(this.mesh);
      }

      this.startAnimation();
    });
  }

  private calculateCenterOffset(geometry: TextGeometry): { x: number; y: number; z: number } {
    if (!geometry.boundingBox) return { x: 0, y: 0, z: 0 };
    
    return {
      x: -(geometry.boundingBox.max.x + geometry.boundingBox.min.x) / 2,
      y: -(geometry.boundingBox.max.y + geometry.boundingBox.min.y) / 2,
      z: -(geometry.boundingBox.max.z + geometry.boundingBox.min.z) / 2
    };
  }

  private startAnimation(): void {
    const animate = () => {
      requestAnimationFrame(animate);
      
      const time = Date.now() * 0.001;
      
      // Enhanced animation with subtle intensity changes
      for (let i = 1; i < 4; i++) {
        const light = this.lights[i] as THREE.SpotLight;
        const baseIntensity = i < 3 ? 8 : 6;
        const phase = (i - 1) * (Math.PI / 3);
        const pulseSpeed = 0.5;
        const pulseAmount = 0.8;
        light.intensity = baseIntensity + Math.sin(time * pulseSpeed + phase) * pulseAmount;
      }

      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    this.isDragging = true;
    this.previousMousePosition = {
      x: event.clientX,
      y: event.clientY
    };
  }

  @HostListener('window:mouseup')
  onMouseUp(): void {
    this.isDragging = false;
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging || !this.group) return;

    const deltaMove = {
      x: event.clientX - this.previousMousePosition.x,
      y: event.clientY - this.previousMousePosition.y
    };

    this.group.rotation.x += deltaMove.y * this.ROTATION_SPEED;
    this.group.rotation.y += deltaMove.x * this.ROTATION_SPEED;

    this.previousMousePosition = {
      x: event.clientX,
      y: event.clientY
    };
  }
}
