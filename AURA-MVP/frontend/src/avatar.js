// src/avatar.js
import React, { useEffect, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { AnimationMixer } from "three";

function Avatar({ animation = 'idle' }) {
  const group = useRef();
  const mixer = useRef();
  const actions = useRef({});

  // Load all GLB animation files
  const idleGLB = useLoader(GLTFLoader, "/models/idle.glb");
  const armsGLB = useLoader(GLTFLoader, "/models/arms.glb");
  const situpsGLB = useLoader(GLTFLoader, "/models/situps.glb");
  const danceGLB = useLoader(GLTFLoader, "/models/dance.glb");
  const talk1GLB = useLoader(GLTFLoader, "/models/talk1.glb");
  const talk2GLB = useLoader(GLTFLoader, "/models/talk2.glb");

  // Initial setup
  useEffect(() => {
    if (!idleGLB || !idleGLB.scene) {
      console.error('No idle GLB loaded');
      return;
    }

    console.log('Setting up avatar with animations');

    // Set up the scene
    const model = idleGLB.scene;
    model.scale.set(1.75, 1.75, 1.75);
    
    // Enable shadows for all meshes
    model.traverse((object) => {
      if (object.isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;
        if (object.material) {
          object.material.needsUpdate = true;
        }
      }
    });
    
    group.current.add(model);

    // Create animation mixer
    mixer.current = new AnimationMixer(model);

    // Set up all animations
    actions.current = {
      idle: mixer.current.clipAction(idleGLB.animations[0]),
      arms: mixer.current.clipAction(armsGLB.animations[0]),
      situps: mixer.current.clipAction(situpsGLB.animations[0]),
      dance: mixer.current.clipAction(danceGLB.animations[0]),
      talk1: mixer.current.clipAction(talk1GLB.animations[0]),
      talk2: mixer.current.clipAction(talk2GLB.animations[0]),
    };

    // Play idle animation by default
    actions.current.idle.play();

    return () => {
      mixer.current?.stopAllAction();
    };
  }, [idleGLB, armsGLB, situpsGLB, danceGLB, talk1GLB, talk2GLB]);

  // Handle animation changes
  useEffect(() => {
    if (!mixer.current || !actions.current) {
      console.error('Mixer or actions not ready');
      return;
    }

    console.log('Changing animation to:', animation);

    // Stop all current animations
    Object.values(actions.current).forEach(action => action.stop());

    // Play the requested animation
    const nextAction = actions.current[animation];
    if (nextAction) {
      nextAction.reset().fadeIn(0.2).play();
      console.log('Playing animation:', animation);
    } else {
      console.error('Animation not found:', animation);
      // Fallback to idle if animation not found
      actions.current.idle.reset().fadeIn(0.2).play();
    }
  }, [animation]);

  // Update animations
  useFrame((_, delta) => {
    mixer.current?.update(delta);
  });

  return (
    <group 
      ref={group} 
      position={[0, 0, 0]}
      rotation={[0, 0, 0]}
      scale={[1.75, 1.75, 1.75]}
    />
  );
}

export default Avatar;
