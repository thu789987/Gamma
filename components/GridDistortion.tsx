import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

// 1. Định nghĩa kiểu dữ liệu cho Props (Để sửa lỗi "implicitly has an any type")
interface GridDistortionProps {
  imageSrc?: string;
  grid?: number;
  mouse?: number;
  strength?: number;
  relaxation?: number;
  className?: string;
}

// --- SHADERS ---
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
  // Định nghĩa Type cho useRef để tránh lỗi object is possibly null
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const planeRef = useRef<THREE.Mesh | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const imageAspectRef = useRef<number>(1);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Setup Three.js
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

    const camera = new THREE.OrthographicCamera(0, 0, 0, 0, -1000, 1000);
    camera.position.z = 2;
    cameraRef.current = camera;

    const uniforms = {
      time: { value: 0 },
      resolution: { value: new THREE.Vector4() },
      uTexture: { value: new THREE.Texture() }, // Khởi tạo texture rỗng để tránh lỗi null
      uDataTexture: { value: new THREE.DataTexture() }
    };

    // 2. Load Image
    const textureLoader = new THREE.TextureLoader();
    // Ảnh mặc định nếu không có imageSrc
    const currentImage = imageSrc || 'https://via.placeholder.com/800x600/cccccc/969696?text=No+Image';
    
    textureLoader.load(currentImage, (texture) => {
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      if (texture.image) {
          imageAspectRef.current = texture.image.width / texture.image.height;
      }
      uniforms.uTexture.value = texture;
      handleResize(); 
    });

    // 3. Grid Data (Physics)
    const size = grid;
    const data = new Float32Array(4 * size * size);
    for (let i = 0; i < size * size; i++) {
      data[i * 4] = Math.random() * 255 - 125;
      data[i * 4 + 1] = Math.random() * 255 - 125;
    }
    const dataTexture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.FloatType);
    dataTexture.needsUpdate = true;
    uniforms.uDataTexture.value = dataTexture;

    // 4. Mesh
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

    // 5. Handle Resize
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const rect = container.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      
      renderer.setSize(width, height);
      uniforms.resolution.value.set(width, height, 1, 1);

      const containerAspect = width / height;
      const imageAspect = imageAspectRef.current;

      if (plane) {
        // Logic mô phỏng 'background-size: cover'
        // Chúng ta scale plane sao cho nó luôn phủ kín container
        const scale = Math.max(containerAspect / imageAspect, 1);
        // Lưu ý: Logic này tương đối đơn giản cho Orthographic Camera
        // Để cover hoàn hảo không méo cần tính toán kỹ hơn về UV trong shader
        // Ở đây ta chấp nhận scale plane theo tỷ lệ khung hình
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

    // 6. Mouse Events
    const mouseState = { x: 0, y: 0, prevX: 0, prevY: 0, vX: 0, vY: 0 };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1 - (e.clientY - rect.top) / rect.height;
      
      mouseState.vX = x - mouseState.prevX;
      mouseState.vY = y - mouseState.prevY;
      mouseState.x = x;
      mouseState.y = y;
      mouseState.prevX = x;
      mouseState.prevY = y;
    };

    container.addEventListener('mousemove', handleMouseMove);
    
    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);

    // 7. Animation Loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      if (!renderer || !scene || !camera) return;

      uniforms.time.value += 0.05;

      // Update Physics
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
                // TypeScript có thể vẫn báo lỗi ở đây nếu không biết data là mảng số
                // Ép kiểu nhẹ để chắc chắn
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
          // Xóa canvas khỏi DOM để tránh duplicate khi re-render
          if (container.contains(renderer.domElement)) {
              container.removeChild(renderer.domElement);
          }
      }
      // Cleanup texture (quan trọng để tránh tràn bộ nhớ)
      if (uniforms.uTexture.value) uniforms.uTexture.value.dispose();
      if (uniforms.uDataTexture.value) uniforms.uDataTexture.value.dispose();
    };
  }, [imageSrc, grid, mouse, strength, relaxation]);

  return (
    <div 
      ref={containerRef} 
      className={className}
      style={{ 
        width: '100%', 
        height: '100%', 
        overflow: 'hidden',
        pointerEvents: 'auto' 
      }}
    />
  );
};

export default GridDistortion;