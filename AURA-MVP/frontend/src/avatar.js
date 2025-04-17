// src/Avatar.js
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

function Avatar() {
  const mountRef = useRef(null); // Ref to attach the 3D scene

  useEffect(() => {
    // Set up scene, camera, renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    // Add a simple cube for now (you can replace this with your 3D avatar model later)
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    camera.position.z = 5; // Set camera position

    // Animation loop
    const animate = function () {
      requestAnimationFrame(animate);
      cube.rotation.x += 0.01; // Rotate the cube
      cube.rotation.y += 0.01;
      renderer.render(scene, camera);
    };
    animate();

    // Clean up on unmount
    return () => {
      mountRef.current.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} />;
}

export default Avatar;
