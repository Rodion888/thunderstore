import { Component, AfterViewInit, ElementRef, ViewChild, HostListener, ChangeDetectionStrategy, OnDestroy, inject } from '@angular/core';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { Router } from '@angular/router';

import * as THREE from 'three';

@Component({
  selector: 'app-logo',
  templateUrl: './logo.component.html',
  styleUrls: ['./logo.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoComponent implements AfterViewInit, OnDestroy {
  @ViewChild('logoCanvas') private readonly canvasRef!: ElementRef<HTMLCanvasElement>;

  private readonly router = inject(Router);

  // Three.js objects
  private mesh: THREE.Mesh | null = null;
  private group: THREE.Group | null = null;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private lights: THREE.Light[] = [];
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  
  // Animation
  private animationId: number | null = null;
  
  // Rotation control
  private isDragging = false;
  private previousMousePosition = { x: 0, y: 0 };
  private dragStartTime = 0;
  private mouseMoved = false;

  // Constants
  private readonly ROTATION_SPEED = 0.02;
  private readonly CAMERA_POSITION_Z = 8;
  private readonly CLICK_THRESHOLD = 200; // ms
  private readonly MOVE_THRESHOLD = 5; // pixels
  
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
  
  ngOnDestroy(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    
    if (this.renderer) {
      this.renderer.dispose();
    }
    
    if (this.mesh) {
      this.mesh.geometry.dispose();
      (this.mesh.material as THREE.Material).dispose();
    }
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
    this.group.rotation.x = 0.2;
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
      const geometry = new TextGeometry('thunder', {
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
      this.animationId = requestAnimationFrame(animate);
      
      const time = Date.now() * 0.001;
      
      // Light animation
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

  private checkTextIntersection(event: MouseEvent | Touch): boolean {
    if (!this.mesh || !this.group) return false;
    
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    this.mouse.set(x, y);
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const intersects = this.raycaster.intersectObject(this.mesh, true);
    
    return intersects.length > 0;
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    const clickDuration = Date.now() - this.dragStartTime;
    if (!this.mouseMoved && clickDuration < this.CLICK_THRESHOLD) {
      if (this.checkTextIntersection(event)) {
        this.router.navigate(['/']);
      }
    }
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    this.isDragging = true;
    this.dragStartTime = Date.now();
    this.mouseMoved = false;
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

    if (Math.abs(deltaMove.x) > this.MOVE_THRESHOLD || Math.abs(deltaMove.y) > this.MOVE_THRESHOLD) {
      this.mouseMoved = true;
    }

    this.group.rotation.x += deltaMove.y * this.ROTATION_SPEED;
    this.group.rotation.y += deltaMove.x * this.ROTATION_SPEED;

    this.previousMousePosition = {
      x: event.clientX,
      y: event.clientY
    };
  }
  
  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    if (event.touches.length !== 1) return;
    
    event.preventDefault();
    const touch = event.touches[0];
    
    this.isDragging = true;
    this.dragStartTime = Date.now();
    this.mouseMoved = false;
    this.previousMousePosition = {
      x: touch.clientX,
      y: touch.clientY
    };
  }
  
  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent): void {
    if (!this.isDragging || !this.group || event.touches.length !== 1) return;
    
    event.preventDefault();
    const touch = event.touches[0];
    
    const deltaMove = {
      x: touch.clientX - this.previousMousePosition.x,
      y: touch.clientY - this.previousMousePosition.y
    };
    
    if (Math.abs(deltaMove.x) > this.MOVE_THRESHOLD || Math.abs(deltaMove.y) > this.MOVE_THRESHOLD) {
      this.mouseMoved = true;
    }
    
    this.group.rotation.x += deltaMove.y * this.ROTATION_SPEED;
    this.group.rotation.y += deltaMove.x * this.ROTATION_SPEED;
    
    this.previousMousePosition = {
      x: touch.clientX,
      y: touch.clientY
    };
  }
  
  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent): void {
    if (!this.isDragging) return;
    
    event.preventDefault();
    this.isDragging = false;
    
    const touchDuration = Date.now() - this.dragStartTime;
    if (!this.mouseMoved && touchDuration < this.CLICK_THRESHOLD && event.changedTouches.length > 0) {
      if (this.checkTextIntersection(event.changedTouches[0])) {
        this.router.navigate(['/']);
      }
    }
  }
}
