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
  
  // Game state
  health: number;
  energy: number;
  isColliding: boolean;
  
  // Actions
  accelerate: (delta: number) => void;
  decelerate: (delta: number) => void;
  turnLeft: (delta: number) => void;
  turnRight: (delta: number) => void;
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
  
  // Initial game state
  health: 100,
  energy: 100,
  isColliding: false,
  
  // Movement actions
  accelerate: (delta) => {
    const state = get();
    
    // Only accelerate if we have energy
    if (state.energy > 0) {
      let newVelocity = state.velocity + state.acceleration * delta;
      
      // Cap velocity at max
      if (newVelocity > state.maxVelocity) {
        newVelocity = state.maxVelocity;
      }
      
      // Use energy when accelerating
      const energyUsed = delta * 5;
      if (newVelocity !== state.velocity) {
        state.useEnergy(energyUsed);
      }
      
      set({ velocity: newVelocity });
    }
  },
  
  decelerate: (delta) => {
    const state = get();
    
    // Only decelerate if we have energy
    if (state.energy > 0) {
      let newVelocity = state.velocity - state.deceleration * delta;
      
      // Cap reverse velocity
      if (newVelocity < -state.maxVelocity / 2) {
        newVelocity = -state.maxVelocity / 2;
      }
      
      // Use energy when decelerating
      const energyUsed = delta * 5;
      if (newVelocity !== state.velocity) {
        state.useEnergy(energyUsed);
      }
      
      set({ velocity: newVelocity });
    }
  },
  
  turnLeft: (delta) => {
    const state = get();
    const newRotation = state.rotation.clone();
    newRotation.y += state.turnSpeed * delta;
    
    // Use a small amount of energy when turning
    state.useEnergy(delta * 1);
    
    set({ rotation: newRotation });
  },
  
  turnRight: (delta) => {
    const state = get();
    const newRotation = state.rotation.clone();
    newRotation.y -= state.turnSpeed * delta;
    
    // Use a small amount of energy when turning
    state.useEnergy(delta * 1);
    
    set({ rotation: newRotation });
  },
  
  updatePosition: (delta) => {
    const state = get();
    const velocity = state.velocity;
    
    // Don't move if colliding and trying to move forward
    if (state.isColliding && velocity > 0) {
      set({ velocity: 0 });
      return;
    }
    
    // Calculate new position based on velocity and rotation
    const newPosition = state.position.clone();
    
    // Move in the direction the rover is facing
    newPosition.x += Math.sin(state.rotation.y) * velocity * delta;
    newPosition.z += Math.cos(state.rotation.y) * velocity * delta;
    
    // Slow down automatically if no input (simulate friction)
    let newVelocity = velocity;
    if (Math.abs(velocity) > 0.01) {
      newVelocity *= 0.98; // Friction factor
    } else {
      newVelocity = 0;
    }
    
    // Recharge energy when not moving rapidly
    if (Math.abs(velocity) < 1) {
      state.rechargeEnergy(delta * 2);
    }
    
    set({ 
      position: newPosition,
      velocity: newVelocity
    });
  },
  
  // Game state actions
  setColliding: (isColliding) => {
    const state = get();
    
    // Take damage when a new collision occurs
    if (isColliding && !state.isColliding) {
      state.takeDamage(10 * Math.abs(state.velocity));
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
