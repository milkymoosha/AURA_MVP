// src/AvatarLoader.jsx
import React, { useEffect, useRef, useState } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { AnimationMixer } from "three";

const AvatarLoader = ({ animationState }) => {
  const group = useRef();
  const mixer = useRef();
  const actions = useRef({});
  const [model, setModel] = useState();

  // Load all GLB animation files
  const idleGLB = useLoader(GLTFLoader, "/models/idle.glb");
  const armsGLB = useLoader(GLTFLoader, "/models/arms.glb");
  const situpsGLB = useLoader(GLTFLoader, "/models/situps.glb");
  const danceGLB = useLoader(GLTFLoader, "/models/dance.glb");
  const talk1GLB = useLoader(GLTFLoader, "/models/talk1.glb");
  const talk2GLB = useLoader(GLTFLoader, "/models/talk2.glb");

  useEffect(() => {
    if (!idleGLB || !idleGLB.scene) return;

    // Set the model and scale
    setModel(idleGLB.scene);
    idleGLB.scene.scale.set(1.5, 1.5, 1.5);
    group.current.add(idleGLB.scene);

    // Create the animation mixer
    mixer.current = new AnimationMixer(idleGLB.scene);

    // Assign all available actions
    actions.current = {
      idle: mixer.current.clipAction(idleGLB.animations[0]),
      arms: mixer.current.clipAction(armsGLB.animations[0]),
      situps: mixer.current.clipAction(situpsGLB.animations[0]),
      dance: mixer.current.clipAction(danceGLB.animations[0]),
      talk1: mixer.current.clipAction(talk1GLB.animations[0]),
      talk2: mixer.current.clipAction(talk2GLB.animations[0]),
    };

    // Play idle animation initially
    actions.current["idle"].play();

    return () => {
      mixer.current.stopAllAction();
    };
  }, [idleGLB]);

  useEffect(() => {
    if (!mixer.current || !actions.current) return;

    // Stop all current actions
    Object.values(actions.current).forEach((action) => {
      action.stop();
    });

    // Play the selected animation
    const selectedAction = actions.current[animationState];
    if (selectedAction) {
      selectedAction.reset().fadeIn(0.2).play();
    }
  }, [animationState]);

  // Keep updating the animation
  useFrame((_, delta) => {
    mixer.current?.update(delta);
  });

  return <group ref={group} />;
};

export default AvatarLoader;
