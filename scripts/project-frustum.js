const THREE = require('three');

// 1. Create camera matching NivoSceneHost
const camera = new THREE.PerspectiveCamera(45, 1920 / 1080, 0.1, 1000);
camera.position.set(0, 0, 10);
camera.updateMatrixWorld();

// 2. Define cluster centers from narrative-states.js
const cluster1 = new THREE.Vector3(-0.9, 0.4, -0.5);
const cluster2 = new THREE.Vector3(0.9, -0.4, -0.8);

// 3. Project to NDC (Normalized Device Coordinates)
const ndc1 = cluster1.clone().project(camera);
const ndc2 = cluster2.clone().project(camera);

console.log('=== CAMERA AND FRUSTUM AUDIT ===');
console.log('Cluster 1 Center [-0.9, 0.4, -0.5] NDC:');
console.log(`  X: ${ndc1.x.toFixed(4)}`);
console.log(`  Y: ${ndc1.y.toFixed(4)}`);
console.log(`  Z: ${ndc1.z.toFixed(4)}`);
console.log(`  Inside frustum: ${Math.abs(ndc1.x) <= 1 && Math.abs(ndc1.y) <= 1 && ndc1.z >= -1 && ndc1.z <= 1}`);

console.log('\nCluster 2 Center [0.9, -0.4, -0.8] NDC:');
console.log(`  X: ${ndc2.x.toFixed(4)}`);
console.log(`  Y: ${ndc2.y.toFixed(4)}`);
console.log(`  Z: ${ndc2.z.toFixed(4)}`);
console.log(`  Inside frustum: ${Math.abs(ndc2.x) <= 1 && Math.abs(ndc2.y) <= 1 && ndc2.z >= -1 && ndc2.z <= 1}`);

// 4. Calculate Projected Screen Positions for 1920x1080 Viewport
// Formula: screenX = (ndcX + 1) * width / 2; screenY = (1 - ndcY) * height / 2;
const width = 1920;
const height = 1080;

const screenX1 = (ndc1.x + 1) * width / 2;
const screenY1 = (1 - ndc1.y) * height / 2;

const screenX2 = (ndc2.x + 1) * width / 2;
const screenY2 = (1 - ndc2.y) * height / 2;

console.log('\nProjected Viewport Screen Coordinates (1920x1080):');
console.log(`  Cluster 1: (${screenX1.toFixed(1)}px, ${screenY1.toFixed(1)}px)`);
console.log(`  Cluster 2: (${screenX2.toFixed(1)}px, ${screenY2.toFixed(1)}px)`);
console.log('================================');
