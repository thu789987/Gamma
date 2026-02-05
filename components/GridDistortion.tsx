import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

interface GridDistortionProps {
  imageSrc?: string;
  grid?: number;
  mouse?: number;
  strength?: number;
  relaxation?: number;
  className?: string;
  enableEffect?: boolean; 
}

// ... Vertex/Fragment Shader giữ nguyên (đã rút gọn để dễ nhìn) ...
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
  className = '',
  enableEffect = true 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [aspectRatio, setAspectRatio] = useState<number>(16/9); 
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // 👇 STATE MỚI: Theo dõi chiều cao thực tế
  const [containerHeight, setContainerHeight] = useState(0);

  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationIdRef = useRef<number | null>(null);

  // 👇 LOGIC QUYẾT ĐỊNH: Chỉ bật khi User muốn BẬT và Chiều cao < 950px
  // (Hoặc containerHeight = 0 nghĩa là chưa đo xong thì cứ tạm bật)
  const shouldEnable = enableEffect && (containerHeight < 950 || containerHeight === 0);

  // 1. Observer đo chiều cao & Intersection
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // A. Đo chiều cao liên tục
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        // Cập nhật chiều cao thực tế vào State
        setContainerHeight(entry.contentRect.height);
      }
    });
    resizeObserver.observe(container);

    // B. Kiểm tra xem có cuộn tới chưa (Lazy Load)
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      const intersectionObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          intersectionObserver.disconnect();
        }
      }, { rootMargin: '200px' });
      intersectionObserver.observe(container);
      
      return () => {
        resizeObserver.disconnect();
        intersectionObserver.disconnect();
      };
    } else {
      setIsVisible(true);
      return () => resizeObserver.disconnect();
    }
  }, []);

  // 2. Main Logic Three.js (Phụ thuộc vào biến shouldEnable mới)
  useEffect(() => {
    // Nếu điều kiện không thỏa mãn -> Tắt ThreeJS, báo Loaded để hiện ảnh tĩnh
    if (!shouldEnable) {
      setIsLoaded(true);
      return; 
    }

    if (!isVisible) return;
    
    const container = containerRef.current;
    if (!container) return;

    // ... CLEANUP CŨ ...
    if (rendererRef.current) rendererRef.current.dispose();
    if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
    
    // ... SETUP THREE JS (Giữ nguyên như cũ) ...
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(0, 0, 0, 0, -1000, 1000);
    camera.position.z = 2;

    const renderer = new THREE.WebGLRenderer({
      antialias: true, alpha: true, powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    renderer.domElement.style.opacity = '0';
    renderer.domElement.style.transition = 'opacity 0.5s ease-in-out';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.position = 'absolute'; 
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';

    const uniforms = {
      time: { value: 0 },
      resolution: { value: new THREE.Vector4() },
      uTexture: { value: new THREE.Texture() },
      uDataTexture: { value: new THREE.DataTexture() }
    };

    const textureLoader = new THREE.TextureLoader();
    const currentImage = imageSrc || 'https://via.placeholder.com/800x600';
    
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

    // ... PHYSICS & MESH (Giữ nguyên đoạn tạo dataTexture, plane...) ...
    const size = grid;
    const data = new Float32Array(4 * size * size);
    for (let i = 0; i < size * size; i++) {
      data[i * 4] = Math.random() * 255 - 125;
      data[i * 4 + 1] = Math.random() * 255 - 125;
    }
    const dataTexture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.FloatType);
    dataTexture.needsUpdate = true;
    uniforms.uDataTexture.value = dataTexture;

    const material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide, uniforms, vertexShader, fragmentShader, transparent: true
    });
    const geometry = new THREE.PlaneGeometry(1, 1, size - 1, size - 1);
    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    const handleResize = () => {
      if (!container || !renderer) return;
      const rect = container.getBoundingClientRect();
      // Cập nhật lại height vào state ở đây nữa cho chắc chắn
      setContainerHeight(rect.height); 

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

    const mouseState = { x: 0, y: 0, prevX: 0, prevY: 0, vX: 0, vY: 0 };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1 - (e.clientY - rect.top) / rect.height;
      mouseState.vX = x - mouseState.prevX;
      mouseState.vY = y - mouseState.prevY;
      Object.assign(mouseState, { x, y, prevX: x, prevY: y });
    };

    container.addEventListener('mousemove', handleMouseMove);
    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);

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
          mouseState.vX *= 0.9;
          mouseState.vY *= 0.9;
          dataTexture.needsUpdate = true;
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      resizeObserver.disconnect();
      container.removeEventListener('mousemove', handleMouseMove);
      if (uniforms.uTexture.value) uniforms.uTexture.value.dispose();
      if (uniforms.uDataTexture.value) uniforms.uDataTexture.value.dispose();
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current.forceContextLoss();
        if (container.contains(rendererRef.current.domElement)) {
            container.removeChild(rendererRef.current.domElement);
        }
      }
    };
  }, [isVisible, imageSrc, grid, mouse, strength, relaxation, shouldEnable]); // 👈 Thay enableEffect bằng shouldEnable

  return (
    <div 
      ref={containerRef} 
      className={className}
      style={{
        width: '100%',
        aspectRatio: `${aspectRatio}`, 
        position: 'relative',
        overflow: 'hidden',
        // Logic màu nền dựa trên shouldEnable
        backgroundColor: (!shouldEnable || isLoaded) ? 'transparent' : '#f0f0f0',
        transition: 'background-color 0.5s ease'
      }}
    >
      {/* NẾU KHÔNG ĐƯỢC PHÉP CHẠY EFFECT -> HIỆN ẢNH TĨNH */}
      {!shouldEnable && (
        <img 
          src={imageSrc} 
          alt="project"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block'
          }}
          onLoad={(e) => {
            const img = e.currentTarget;
            setAspectRatio(img.naturalWidth / img.naturalHeight);
            setIsLoaded(true);
            // Cập nhật lại height khi ảnh load xong
            if (containerRef.current) {
                setContainerHeight(containerRef.current.offsetHeight);
            }
          }}
        />
      )}

      {shouldEnable && !isLoaded && isVisible && (
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