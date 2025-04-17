// src/AvatarLoader.jsx
import React, { useRef, useEffect } from "react";
import { useLoader, useFrame } from "@react-three/fiber";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { AnimationMixer } from "three";

const AvatarLoader = ({ animationState }) => {
  const avatarRef = useRef();
  const mixer = useRef(null);

  // Load animations (each file includes the avatar and animation)
  const idleAnim = useLoader(FBXLoader, "/animations/idle.fbx");
  const danceAnim = useLoader(FBXLoader, "/animations/dance.fbx");
  const armsAnim = useLoader(FBXLoader, "/animations/arms.fbx");
  const situpsAnim = useLoader(FBXLoader, "/animations/situps.fbx");

  useEffect(() => {
    if (idleAnim) {
      // Set up the avatar and scale it
      idleAnim.scale.set(1.5, 1.5, 1.5);
      avatarRef.current.add(idleAnim);
      mixer.current = new AnimationMixer(idleAnim);

      // Combine the animations with the avatar
      idleAnim.animations.forEach((clip) => {
        mixer.current.clipAction(clip).play();
      });
    }

    return () => {
      if (mixer.current) {
        mixer.current.stopAllAction();
      }
    };
  }, [idleAnim]);

  useEffect(() => {
    if (mixer.current) {
      let action;

      if (animationState === "talk") {
        action = mixer.current.clipAction("Talking"); // Replace with correct animation name
      } else if (animationState === "idle") {
        action = mixer.current.clipAction("Idle"); // Replace with correct animation name
      } else if (animationState === "dance") {
        action = mixer.current.clipAction("Dance"); // Replace with correct animation name
      } else if (animationState === "arms") {
        action = mixer.current.clipAction("Arm Stretch"); // Replace with correct animation name
      } else if (animationState === "situps") {
        action = mixer.current.clipAction("Situps"); // Replace with correct animation name
      }

      if (action) {
        action.play();
      }
    }
  }, [animationState]);

  useFrame(() => {
    if (mixer.current) {
      mixer.current.update(0.01); // Update the animation state
    }
  });

  return <primitive ref={avatarRef} object={idleAnim} />;
};

export default AvatarLoader;
