import { vec3, mat4 } from 'glm';
import { getGlobalModelMatrix } from 'engine/core/SceneUtils.js';
import { Transform } from 'engine/core.js';

export class Physics {

    constructor(scene) {
        this.scene = scene;
        this.movingPlatforms = ['Platform1', 'Platform2', 'Platform3'];
        this.platformData = new Map();
    }

    update(t, dt) {
        this.updateMovingPlatforms(t, dt);

        this.scene.traverse(node => {
            if (node.isDynamic) {
                this.scene.traverse(other => {
                    if (node !== other && other.isStatic) {
                        
                        this.resolveCollision(node, other);
                    }
                });
            }
        });
    }

    updateMovingPlatforms(time, dt) {
    const minX = -53;
    const maxX = 92;

    const center = (minX + maxX) / 2;
    const amplitude = (maxX - minX) / 2;

    this.scene.traverse(node => {
        if (!this.movingPlatforms.includes(node.name)) return;

        const transform = node.getComponentOfType(Transform);
        if (!transform) return;

        if (!this.platformData.has(node)) {
            this.platformData.set(node, {
                phase: Math.asin(
                    Math.max(-1, Math.min(1,
                        (transform.translation[0] - center) / amplitude
                    ))
                ),
                prevX: transform.translation[0]
            });
        }

        const data = this.platformData.get(node);

        const speed = 0.35;

        // shrani prej
        data.prevX = transform.translation[0];

        // premik
        transform.translation[0] =
            center + Math.sin(time * speed + data.phase) * amplitude;
    });


}


    intervalIntersection(min1, max1, min2, max2) {
        return !(min1 > max2 || min2 > max1);
    }

    aabbIntersection(aabb1, aabb2) {
        return this.intervalIntersection(aabb1.min[0], aabb1.max[0], aabb2.min[0], aabb2.max[0])
            && this.intervalIntersection(aabb1.min[1], aabb1.max[1], aabb2.min[1], aabb2.max[1])
            && this.intervalIntersection(aabb1.min[2], aabb1.max[2], aabb2.min[2], aabb2.max[2]);
    }

    getTransformedAABB(node) {
        // Transform all vertices of the AABB from local to global space.
        const matrix = getGlobalModelMatrix(node);
        const { min, max } = node.aabb;
        const vertices = [
            [min[0], min[1], min[2]],
            [min[0], min[1], max[2]],
            [min[0], max[1], min[2]],
            [min[0], max[1], max[2]],
            [max[0], min[1], min[2]],
            [max[0], min[1], max[2]],
            [max[0], max[1], min[2]],
            [max[0], max[1], max[2]],
        ].map(v => vec3.transformMat4(v, v, matrix));

        // Find new min and max by component.
        const xs = vertices.map(v => v[0]);
        const ys = vertices.map(v => v[1]);
        const zs = vertices.map(v => v[2]);
        const newmin = [Math.min(...xs), Math.min(...ys), Math.min(...zs)];
        const newmax = [Math.max(...xs), Math.max(...ys), Math.max(...zs)];
        return { min: newmin, max: newmax };
    }

    resolveCollision(a, b) {
        


        // Get global space AABBs.
        const aBox = this.getTransformedAABB(a);
        const bBox = this.getTransformedAABB(b);

        // Check if there is collision.
        const isColliding = this.aabbIntersection(aBox, bBox);
        if (!isColliding) {
            return;
        }

        if (b.name === "Goal") {
            console.log("Win!");
        }

        if(b.name === "Cube.068"){
            console.log("GGs");
        }


        //dodano da se zoga premika s plotformami
        const aTransform = a.getComponentOfType(Transform);
        const bTransform = b.getComponentOfType(Transform);
        if (!aTransform || !bTransform) return;


        if (this.movingPlatforms.includes(b.name)) {
            const data = this.platformData.get(b);

            if (data) {
                const deltaX = bTransform.translation[0] - data.prevX;

                // ali je player NA platformi (od zgoraj)
                const epsilon = 0.05;
                const onTop =
                    Math.abs(aBox.min[1] - bBox.max[1]) < epsilon;

                if (onTop) {
                    aTransform.translation[0] += deltaX;
                }
            }
        }


        // Move node A minimally to avoid collision.
        const diffa = vec3.sub(vec3.create(), bBox.max, aBox.min);
        const diffb = vec3.sub(vec3.create(), aBox.max, bBox.min);

        let minDiff = Infinity;
        let minDirection = [0, 0, 0];
        if (diffa[0] >= 0 && diffa[0] < minDiff) {
            minDiff = diffa[0];
            minDirection = [minDiff, 0, 0];
        }
        if (diffa[1] >= 0 && diffa[1] < minDiff) {
            minDiff = diffa[1];
            minDirection = [0, minDiff, 0];
        }
        if (diffa[2] >= 0 && diffa[2] < minDiff) {
            minDiff = diffa[2];
            minDirection = [0, 0, minDiff];
        }
        if (diffb[0] >= 0 && diffb[0] < minDiff) {
            minDiff = diffb[0];
            minDirection = [-minDiff, 0, 0];
        }
        if (diffb[1] >= 0 && diffb[1] < minDiff) {
            minDiff = diffb[1];
            minDirection = [0, -minDiff, 0];
        }
        if (diffb[2] >= 0 && diffb[2] < minDiff) {
            minDiff = diffb[2];
            minDirection = [0, 0, -minDiff];
        }

        const transform = a.getComponentOfType(Transform);
        if (!transform) {
            return;
        }

        vec3.add(transform.translation, transform.translation, minDirection);
    }

    xzIntersection(x, z, aabb) {
        return this.intervalIntersection(aabb.min[0], aabb.max[0], x, x)
            && this.intervalIntersection(aabb.min[2], aabb.max[2], z, z);
    }

    getGroundHeightAt(x, z) {
        let groundY = -Infinity;
        this.scene.traverse(node => {
            if (node.isStatic) {
                const nodeBox = this.getTransformedAABB(node);
                // Check on which Node is player standing
                if (this.xzIntersection(x, z, nodeBox)) {
                    // Return Floor hight
                    groundY = Math.max(groundY, nodeBox.max[1]);
                }
            }
        });
        return groundY === -Infinity ? null : groundY;
    }

}
