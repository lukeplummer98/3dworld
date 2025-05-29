// CollisionManager.js - Handles collision detection and response
export class CollisionManager {
    constructor() {
        this.collisionObjects = [];
    }
    
    setCollisionObjects(objects) {
        this.collisionObjects = objects;
    }
    
    checkCollisions(newPosition, characterRadius = 0.6) {
        for (const obj of this.collisionObjects) {
            if (obj.type === 'box') {
                // Box collision (buildings, benches)
                if (newPosition.x + characterRadius > obj.minX && 
                    newPosition.x - characterRadius < obj.maxX &&
                    newPosition.z + characterRadius > obj.minZ && 
                    newPosition.z - characterRadius < obj.maxZ) {
                    return obj;
                }
            } else if (obj.type === 'cylinder') {
                // Cylinder collision (fountain, lamp posts, trees)
                const dx = newPosition.x - obj.x;
                const dz = newPosition.z - obj.z;
                const distance = Math.sqrt(dx * dx + dz * dz);
                if (distance < obj.radius + characterRadius) {
                    return obj;
                }
            } else if (obj.type === 'elevatedGround') {
                // Elevated ground collision (plaza floor)
                if (newPosition.x >= obj.minX && newPosition.x <= obj.maxX &&
                    newPosition.z >= obj.minZ && newPosition.z <= obj.maxZ) {
                    // Character is on elevated ground
                    return { ...obj, onElevatedGround: true };
                }
            }
        }
        return null;
    }
    
    resolveCollision(oldPosition, newPosition, collision, velocity) {
        if (collision.type === 'elevatedGround' && collision.onElevatedGround) {
            // On plaza - adjust ground level
            return {
                position: newPosition,
                velocity: velocity,
                groundLevel: collision.height + 1.1 // Plaza height + character offset
            };
        }
        
        if (collision.type === 'box') {
            // Push character away from box collision
            const centerX = (collision.minX + collision.maxX) / 2;
            const centerZ = (collision.minZ + collision.maxZ) / 2;
            
            const dx = newPosition.x - centerX;
            const dz = newPosition.z - centerZ;
            
            // Determine which side to push away from
            const absX = Math.abs(dx);
            const absZ = Math.abs(dz);
            
            if (absX > absZ) {
                // Push along X axis
                const pushX = dx > 0 ? collision.maxX + 0.6 : collision.minX - 0.6;
                return {
                    position: new BABYLON.Vector3(pushX, newPosition.y, oldPosition.z),
                    velocity: new BABYLON.Vector3(0, velocity.y, velocity.z),
                    groundLevel: 0.6
                };
            } else {
                // Push along Z axis
                const pushZ = dz > 0 ? collision.maxZ + 0.6 : collision.minZ - 0.6;
                return {
                    position: new BABYLON.Vector3(oldPosition.x, newPosition.y, pushZ),
                    velocity: new BABYLON.Vector3(velocity.x, velocity.y, 0),
                    groundLevel: 0.6
                };
            }
        } else if (collision.type === 'cylinder') {
            // Push character away from cylinder collision
            const dx = newPosition.x - collision.x;
            const dz = newPosition.z - collision.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance > 0) {
                const pushDistance = collision.radius + 0.6;
                const pushX = collision.x + (dx / distance) * pushDistance;
                const pushZ = collision.z + (dz / distance) * pushDistance;
                
                return {
                    position: new BABYLON.Vector3(pushX, newPosition.y, pushZ),
                    velocity: new BABYLON.Vector3(0, velocity.y, 0),
                    groundLevel: 0.6
                };
            }
        }
        
        // Default: stop movement
        return {
            position: oldPosition,
            velocity: new BABYLON.Vector3(0, velocity.y, 0),
            groundLevel: 0.6
        };
    }
}