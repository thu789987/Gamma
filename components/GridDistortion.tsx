import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

// ... (Giữ nguyên phần Shaders và Interface không đổi) ...
// Để tiết kiệm dòng, mình không paste lại đoạn Shader ở đây vì nó vẫn đúng.

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
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Refs
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationIdRef = useRef<number | null>(null);

  // 1. Observer Effect
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '200px' });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // 2. ThreeJS Effect
  useEffect(() => {
    if (!isVisible) return;
    const container = containerRef.current;
    if (!container) return;

    // --- SETUP ---
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(0, 0, 0, 0, -1000, 1000);
    camera.position.z = 2;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement); // Append Canvas vào

    // Style Fade-in
    renderer.domElement.style.opacity = '0';
    renderer.domElement.style.transition = 'opacity 0.5s ease-in-out';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';

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
         setAspectRatio(texture.image.width / texture.image.height);
      }
      uniforms.uTexture.value = texture;
      setIsLoaded(true);
      if (renderer.domElement) renderer.domElement.style.opacity = '1';
      handleResize(); 
    });

    // --- PHYSICS DATA ---
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
    scene.add(plane);

    // --- RESIZE ---
    const handleResize = () => {
      if (!container || !renderer) return;
      const rect = container.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height);
      uniforms.resolution.value.set(rect.width, rect.height, 1, 1);
      const containerAspect = rect.width / rect.height;
      plane.scale.set(containerAspect, 1, 1); 
      
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

    // --- ANIMATION ---
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
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

    // 👇👇👇 KHU VỰC SỬA LỖI QUAN TRỌNG NHẤT 👇👇👇
    return () => {
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      resizeObserver.disconnect();
      container.removeEventListener('mousemove', handleMouseMove);
      
      // Dọn dẹp Textures
      if (uniforms.uTexture.value) uniforms.uTexture.value.dispose();
      if (uniforms.uDataTexture.value) uniforms.uDataTexture.value.dispose();

      if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss();
        
        // CÁCH SỬA: Kiểm tra kỹ xem Canvas có thực sự đang nằm trong Container không rồi mới xóa
        // Tuyệt đối KHÔNG dùng container.innerHTML = ''
        if (container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement);
        }
      }
    };
  }, [isVisible, imageSrc, grid, mouse, strength, relaxation]); 

  return (
    <div 
      ref={containerRef} 
      className={className}
      style={{
        width: '100%',
        aspectRatio: `${aspectRatio}`, 
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: isLoaded ? 'transparent' : '#f0f0f0',
        transition: 'background-color 0.5s ease'
      }}
    >
      {/* React quản lý phần tử này, nếu dùng innerHTML='' sẽ xóa mất nó -> gây lỗi */}
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