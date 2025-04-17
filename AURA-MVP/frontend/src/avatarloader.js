// src/AvatarLoader.js
import React, { useRef, useEffect } from "react";
import { useLoader, useFrame } from "@react-three/fiber";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { AnimationMixer } from "three";

const AvatarLoader = ({ animationState }) => {
  const avatarRef = useRef();
  const mixer = useRef(null);
  const avatar = useLoader(FBXLoader, "/path/to/your/combined/animated_avatar.fbx"); // Update the path to your FBX file

  useEffect(() => {
    if (avatar) {
      avatar.scale.set(1.5, 1.5, 1.5); // Scale your avatar as needed
      avatarRef.current.add(avatar);
      mixer.current = new AnimationMixer(avatar);

      // Log animation names for debugging
      avatar.animations.forEach((clip) => {
        console.log("Animation name: ", clip.name);
        mixer.current.clipAction(clip).play();
      });
    }

    return () => {
      if (mixer.current) {
        mixer.current.stopAllAction();
      }
    };
  }, [avatar]);

  useEffect(() => {
    if (mixer.current) {
      let action;
      if (animationState === "talk") {
        action = mixer.current.clipAction("Talking"); // Replace with correct animation name
      } else if (animationState === "idle") {
        action = mixer.current.clipAction("Idle"); // Replace with correct animation name
      } else if (animationState === "dance") {
        action = mixer.current.clipAction("Dance"); // Replace with correct animation name
      }

      if (action) {
        action.play();
      }
    }
  }, [animationState]);

  useFrame(() => {
    if (mixer.current)