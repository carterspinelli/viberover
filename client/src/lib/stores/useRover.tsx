import { create } from "zustand";
import * as THREE from "three";

interface RoverState {
  // Position and movement
  position: THREE.Vector3;
  rotation: THREE.Euler;
  velocity: number;
  maxVelocity: number;
  acceleration: number;
  deceleration: number;
  turnSpeed: number;
  
  // Movement smoothing
  targetVelocity: number;
  turnDirection: number; // -1 = left, 0 = none, 1 = right
  
  // Game state
  health: number;
  energy: number;
  isColliding: boolean;
  
  // Actions
  accelerate: (delta: number) => void;
  decelerate: (delta: number) => void;
  turnLeft: (delta: number) => void;
  turnRight: (delta: number) => void;
  stopTurning: () => void;
  updatePosition: (delta: number) => void;
  setColliding: (isColliding: boolean) => void;
  takeDamage: (amount: number) => void;
  useEnergy: (amount: number) => void;
  rechargeEnergy: (amount: number) => void;
}

export const useRover = create<RoverState>((set, get) => ({
  // Initial position and movement values
  position: new THREE.Vector3(0, 0, 0),
  rotation: new THREE.Euler(0, 0, 0),
  velocity: 0,
  maxVelocity: 5,
  acceleration: 2,
  deceleration: 3,
  turnSpeed: 1.5,
  
  // Movement smoothing
  targetVelocity: 0,
  turnDirection: 0,
  
  // Initial game state
  health: 100,
  energy: 100,
  isColliding: false,
  
  // Movement actions
  accelerate: (delta) => {
    const state = get();
    
    // Only accelerate if we have energy
    if (state.energy > 0) {
      // Set target velocity instead of directly changing velocity
      // This enables smoother acceleration
      set({ targetVelocity: state.maxVelocity });
      
      // Use energy when accelerating
      const energyUsed = delta * 4;
      state.useEnergy(energyUsed);
    }
  },
  
  decelerate: (delta) => {
    const state = get();
    
    // Only decelerate if we have energy
    if (state.energy > 0) {
      // Set target velocity to negative for reverse
      set({ targetVelocity: -state.maxVelocity / 1.5 });
      
      // Use energy when decelerating
      const energyUsed = delta * 4;
      state.useEnergy(energyUsed);
    }
  },
  
  turnLeft: (delta) => {
    // Set turn direction to left (-1)
    set({ turnDirection: -1 });
  },
  
  turnRight: (delta) => {
    // Set turn direction to right (1)
    set({ turnDirection: 1 });
  },
  
  stopTurning: () => {
    // Reset turn direction
    set({ turnDirection: 0 });
  },
  
  updatePosition: (delta) => {
    const state = get();
    
    // Don't move if colliding and trying to move forward
    if (state.isColliding && state.velocity > 0) {
      set({ velocity: 0, targetVelocity: 0 });
      return;
    }
    
    // Smoothly adjust velocity towards target
    let newVelocity = state.velocity;
    if (state.targetVelocity > state.velocity) {
      // Accelerating
      newVelocity = state.velocity + state.acceleration * delta;
      if (newVelocity > state.targetVelocity) {
        newVelocity = state.targetVelocity;
      }
    } else if (state.targetVelocity < state.velocity) {
      // Slowing down
      newVelocity = state.velocity - state.deceleration * delta;
      if (newVelocity < state.targetVelocity) {
        newVelocity = state.targetVelocity;
      }
    }
    
    // Apply turning based on turn direction
    let newRotation = state.rotation.clone();
    if (state.turnDirection !== 0 && Math.abs(state.velocity) > 0.1) {
      // Turn speed is proportional to velocity for more realistic turning
      const actualTurnSpeed = state.turnSpeed * Math.min(1, Math.abs(state.velocity) / 2);
      // Reverse the turn direction because the model is rotated 180 degrees
      newRotation.y -= state.turnDirection * actualTurnSpeed * delta;
      
      // Use energy when turning
      const energyUsed = delta * 0.5;
      state.useEnergy(energyUsed);
    }
    
    // Calculate new position based on velocity and rotation
    const newPosition = state.position.clone();
    
    // Move in the direction the rover is facing
    // Use negative values because the model is rotated 180 degrees
    newPosition.x -= Math.sin(state.rotation.y) * newVelocity * delta;
    newPosition.z -= Math.cos(state.rotation.y) * newVelocity * delta;
    
    // Automatic friction when no user input
    if (Math.abs(state.targetVelocity) < 0.1) {
      // Apply stronger friction to make it stop naturally
      if (Math.abs(newVelocity) > 0.1) {
        newVelocity *= 0.95; // Stronger friction when coasting
      } else {
        newVelocity = 0; // Stop completely at low speeds
      }
    }
    
    // Recharge energy when not moving rapidly
    if (Math.abs(newVelocity) < 1) {
      state.rechargeEnergy(delta * 3);
    }
    
    set({ 
      position: newPosition,
      rotation: newRotation,
      velocity: newVelocity
    });
  },
  
  // Game state actions
  setColliding: (isColliding) => {
    const state = get();
    
    // Take damage when a new collision occurs
    if (isColliding && !state.isColliding) {
      state.takeDamage(8 * Math.abs(state.velocity));
    }
    
    set({ isColliding });
  },
  
  takeDamage: (amount) => {
    set((state) => ({
      health: Math.max(0, state.health - amount)
    }));
  },
  
  useEnergy: (amount) => {
    set((state) => ({
      energy: Math.max(0, state.energy - amount)
    }));
  },
  
  rechargeEnergy: (amount) => {
    set((state) => ({
      energy: Math.min(100, state.energy + amount)
    }));
  }
}));
