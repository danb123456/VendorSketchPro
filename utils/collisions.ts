
import { StandObject, Boundary } from '../types';

/**
 * Gets the axis-aligned bounding box (AABB) of an object, including rotation.
 * This provides a slightly larger box for safety but handles rotation simply.
 */
const getRotatedBounds = (obj: StandObject) => {
  const rad = (obj.rotation * Math.PI) / 180;
  const s = Math.abs(Math.sin(rad));
  const c = Math.abs(Math.cos(rad));
  
  // New width and height of the bounding box
  const width = obj.width * c + obj.length * s;
  const height = obj.width * s + obj.length * c;
  
  // Center of the object stays the same
  const centerX = obj.x + obj.width / 2;
  const centerY = obj.y + obj.length / 2;
  
  return {
    left: centerX - width / 2,
    right: centerX + width / 2,
    top: centerY - height / 2,
    bottom: centerY + height / 2,
    width,
    height
  };
};

/**
 * Checks if two axis-aligned bounding boxes overlap.
 */
export const checkCollision = (a: StandObject, b: StandObject): boolean => {
  const boundsA = getRotatedBounds(a);
  const boundsB = getRotatedBounds(b);

  return (
    boundsA.left < boundsB.right &&
    boundsA.right > boundsB.left &&
    boundsA.top < boundsB.bottom &&
    boundsA.bottom > boundsB.top
  );
};

/**
 * Checks if an object is outside the given boundary.
 */
export const isOutOfBounds = (obj: StandObject, boundary: Boundary): boolean => {
  const bounds = getRotatedBounds(obj);
  return (
    bounds.left < 0 ||
    bounds.top < 0 ||
    bounds.right > boundary.width ||
    bounds.bottom > boundary.length
  );
};
