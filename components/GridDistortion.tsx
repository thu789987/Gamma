import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

interface GridDistortionProps {
  imageSrc?: string;
  grid?: number;
  mouse?: number;
  strength?: number;
  relaxation?: number;
  className?: string;
  // 👇 THÊM PROP NÀY
  enableEffect?: boolean; 
}

// ... (Giữ nguyên đoạn Vertex Shader và Fragment Shader để code gọn) ...
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
  enableEffect = true // 👇 Mặc định là BẬT
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [aspectRatio, setAspectRatio] = useState<number>(16/9); 
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationIdRef = useRef<number | null>(null);

  // 1. Observer (Giữ nguyên)
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

  // 2. Logic chính (Đã sửa để hỗ trợ Tắt Effect)
  useEffect(() => {
    // 👇 NẾU TẮT EFFECT: Thì không chạy Three.js nữa, chỉ set Loaded để hiện ảnh tĩnh
    if (!enableEffect) {
      setIsLoaded(true);
      return; 
    }

    if (!isVisible) return;
    
    const container = containerRef.current;
    if (!container) return;

    // CLEANUP CŨ
    if (rendererRef.current) rendererRef.current.dispose();
    if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
    
    // --- SETUP THREE.JS ---
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

    // Style cho Canvas
    renderer.domElement.style.opacity = '0';
    renderer.domElement.style.transition = 'opacity 0.5s ease-in-out';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    // 👇 Quan trọng: Canvas phải nằm tuyệt đối đè lên để khớp vị trí
    renderer.domElement.style.position = 'absolute'; 
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';

    const uniforms = {
      time: { value: 0 },
      resolution: { value: new THREE.Vector4() },
      uTexture: { value: new THREE.Texture() },
      uDataTexture: { value: new THREE.DataTexture() }
    };

    // --- LOAD IMAGE ---
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

    // ... (Đoạn tạo Data Texture và Mesh giữ nguyên như cũ để tiết kiệm dòng) ...
    // ... Copy đoạn logic Physics từ bài trước vào đây ...

    // Fake đoạn logic Physics để code chạy được (bạn copy đoạn full cũ vào nhé)
    const size = grid;
    const data = new Float32Array(4 * size * size);
    const dataTexture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.FloatType);
    dataTexture.needsUpdate = true;
    uniforms.uDataTexture.value = dataTexture;
    const material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide, uniforms, vertexShader, fragmentShader, transparent: true
    });
    const geometry = new THREE.PlaneGeometry(1, 1, size - 1, size - 1);
    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);
    // ... Hết đoạn Fake ...

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

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      uniforms.time.value += 0.05;
      // ... Logic Physics update (Copy từ bài cũ) ...
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
  }, [isVisible, imageSrc, grid, mouse, strength, relaxation, enableEffect]); // 👈 Thêm enableEffect vào dependency

  return (
    <div 
      ref={containerRef} 
      className={className}
      style={{
        width: '100%',
        aspectRatio: `${aspectRatio}`, 
        position: 'relative',
        overflow: 'hidden',
        // Nếu tắt effect thì nền trong suốt luôn, ngược lại thì loading xám
        backgroundColor: (!enableEffect || isLoaded) ? 'transparent' : '#f0f0f0',
        transition: 'background-color 0.5s ease'
      }}
    >
      {/* TRƯỜNG HỢP 1: NẾU TẮT EFFECT -> HIỆN ẢNH TĨNH */}
      {!enableEffect && (
        <img 
          src={imageSrc} 
          alt="project"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover', // Đảm bảo ảnh lấp đầy khung như canvas
            display: 'block'
          }}
          // Cập nhật tỷ lệ khung hình khi ảnh thật load xong
          onLoad={(e) => {
            const img = e.currentTarget;
            setAspectRatio(img.naturalWidth / img.naturalHeight);
            setIsLoaded(true);
          }}
        />
      )}

      {/* TRƯỜNG HỢP 2: LOADING SPINNER (Chỉ hiện khi đang bật effect mà chưa load xong) */}
      {enableEffect && !isLoaded && isVisible && (
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