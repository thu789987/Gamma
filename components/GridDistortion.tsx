import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

interface GridDistortionProps {
  imageSrc?: string;
  grid?: number;
  mouse?: number;
  strength?: number;
  relaxation?: number;
  className?: string;
}

const vertexShader = `
uniform float time;
varying vec2 vUv;
varying vec3 vPosition;
void main() {
  vUv = uv;
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const fragmentShader = `
uniform sampler2D uDataTexture;
uniform sampler2D uTexture;
uniform vec4 resolution;
varying vec2 vUv;
void main() {
  vec2 uv = vUv;
  vec4 offset = texture2D(uDataTexture, vUv);
  gl_FragColor = texture2D(uTexture, uv - 0.02 * offset.rg);
}`;

const GridDistortion: React.FC<GridDistortionProps> = ({
  imageSrc,
  grid = 15,
  mouse = 0.1,
  strength = 0.15,
  relaxation = 0.9,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [aspectRatio, setAspectRatio] = useState<number>(16/9); 
  
  // 1. Thêm State để kiểm soát Lazy Load
  const [isVisible, setIsVisible] = useState(false); // Đã cuộn tới chưa?
  const [isLoaded, setIsLoaded] = useState(false);   // Ảnh đã tải xong chưa?

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const planeRef = useRef<THREE.Mesh | null>(null);
  const animationIdRef = useRef<number | null>(null);

  // 2. Effect dùng IntersectionObserver để phát hiện khi nào cần load
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setIsVisible(true); // Kích hoạt Three.js
        observer.disconnect(); // Ngắt theo dõi để không chạy lại
      }
    }, {
      rootMargin: '200px' // Load trước khi scroll tới 200px cho mượt
    });

    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  // 3. Effect chính (Chỉ chạy khi isVisible = true)
  useEffect(() => {
    if (!isVisible) return; // Nếu chưa nhìn thấy thì không làm gì cả

    const container = containerRef.current;
    if (!container) return;

    // --- SETUP THREE.JS ---
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Thêm style để fade-in canvas khi ảnh load xong
    renderer.domElement.style.opacity = '0';
    renderer.domElement.style.transition = 'opacity 0.5s ease-in-out';

    const camera = new THREE.OrthographicCamera(0, 0, 0, 0, -1000, 1000);
    camera.position.z = 2;
    cameraRef.current = camera;

    const uniforms = {
      time: { value: 0 },
      resolution: { value: new THREE.Vector4() },
      uTexture: { value: new THREE.Texture() },
      uDataTexture: { value: new THREE.DataTexture() }
    };

    // --- LOAD IMAGE ---
    const textureLoader = new THREE.TextureLoader();
    const currentImage = imageSrc || 'https://via.placeholder.com/800x600/cccccc/969696?text=No+Image';
    
    textureLoader.load(currentImage, (texture) => {
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      
      if (texture.image) {
         const ratio = texture.image.width / texture.image.height;
         setAspectRatio(ratio);
      }

      uniforms.uTexture.value = texture;
      
      // Báo hiệu đã load xong để hiện Canvas
      setIsLoaded(true);
      if (renderer.domElement) {
        renderer.domElement.style.opacity = '1';
      }

      handleResize(); 
    });

    // --- SETUP DATA TEXTURE (PHYSICS) ---
    const size = grid;
    const data = new Float32Array(4 * size * size);
    for (let i = 0; i < size * size; i++) {
      data[i * 4] = Math.random() * 255 - 125;
      data[i * 4 + 1] = Math.random() * 255 - 125;
    }
    const dataTexture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.FloatType);
    dataTexture.needsUpdate = true;
    uniforms.uDataTexture.value = dataTexture;

    // --- MESH ---
    const material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true
    });
    const geometry = new THREE.PlaneGeometry(1, 1, size - 1, size - 1);
    const plane = new THREE.Mesh(geometry, material);
    planeRef.current = plane;
    scene.add(plane);

    // --- HANDLE RESIZE ---
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const rect = container.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      
      renderer.setSize(width, height);
      uniforms.resolution.value.set(width, height, 1, 1);

      const containerAspect = width / height;

      if (plane) {
        plane.scale.set(containerAspect, 1, 1); 
      }
      
      const frustumHeight = 1;
      const frustumWidth = frustumHeight * containerAspect;
      camera.left = -frustumWidth / 2;
      camera.right = frustumWidth / 2;
      camera.top = frustumHeight / 2;
      camera.bottom = -frustumHeight / 2;
      camera.updateProjectionMatrix();
    };

    // --- EVENTS ---
    const mouseState = { x: 0, y: 0, prevX: 0, prevY: 0, vX: 0, vY: 0 };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1 - (e.clientY - rect.top) / rect.height;
      Object.assign(mouseState, { x, y, prevX: x, prevY: y });
    };

    container.addEventListener('mousemove', handleMouseMove);
    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);

    // --- ANIMATION LOOP ---
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      if (!renderer || !scene || !camera) return;
      uniforms.time.value += 0.05;

      if (dataTexture && dataTexture.image && dataTexture.image.data) {
          const data = dataTexture.image.data;
          for (let i = 0; i < size * size; i++) {
            data[i * 4] *= relaxation;
            data[i * 4 + 1] *= relaxation;
          }
          const gridMouseX = size * mouseState.x;
          const gridMouseY = size * mouseState.y;
          const maxDist = size * mouse;

          for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
              const distSq = Math.pow(gridMouseX - i, 2) + Math.pow(gridMouseY - j, 2);
              if (distSq < maxDist * maxDist) {
                const index = 4 * (i + size * j);
                const power = Math.min(maxDist / Math.sqrt(distSq), 10);
                data[index] += strength * 100 * mouseState.vX * power;
                data[index + 1] -= strength * 100 * mouseState.vY * power;
              }
            }
          }
          dataTexture.needsUpdate = true;
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      resizeObserver.disconnect();
      container.removeEventListener('mousemove', handleMouseMove);
      if (renderer) {
        renderer.dispose();
        // Kiểm tra an toàn trước khi remove child
        if (container && renderer.domElement && container.contains(renderer.domElement)) {
           container.removeChild(renderer.domElement);
        }
      }
      if (uniforms.uTexture.value) uniforms.uTexture.value.dispose();
      if (uniforms.uDataTexture.value) uniforms.uDataTexture.value.dispose();
    };
  }, [imageSrc, grid, mouse, strength, relaxation, isVisible]); // Thêm isVisible vào dependencies

  return (
    <div 
      ref={containerRef} 
      className={className}
      style={{
        width: '100%',
        aspectRatio: `${aspectRatio}`, 
        position: 'relative',
        overflow: 'hidden',
        // Thêm màu nền xám nhẹ để giữ chỗ khi ảnh chưa load
        backgroundColor: isLoaded ? 'transparent' : '#f0f0f0',
        transition: 'background-color 0.5s ease'
      }}
    >
      {/* (Optional) Có thể thêm Loading Spinner ở đây nếu muốn */}
      {!isLoaded && isVisible && (
         <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#999'
         }}>
            Loading...
         </div>
      )}
    </div>
  );
};

export default GridDistortion;