import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const canvas = document.querySelector('#app');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#111111');

const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.01, 1000);
camera.position.set(0, 0, 7);

scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2));
const key = new THREE.DirectionalLight(0xffffff, 3);
key.position.set(3, 5, 2);
scene.add(key);

const loader = new GLTFLoader();
const root = new THREE.Group();
scene.add(root);

// Keep the viewer self-contained while using the working GLB assets from the
// existing project. These URLs are relative to the GitHub Pages deployment.
const BASE = './assets/objects/hoon_dog/hoon_dog.glb';

let model = null;
let target = new THREE.Vector3();
let radius = 1;
let yaw = 0;
let pitch = 0;
let velocity = 0;
let dragging = false;
let lastX = 0;
let lastY = 0;
let lastTime = performance.now();

loader.load(BASE, gltf => {
  model = gltf.scene;
  root.add(model);
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  target.copy(sphere.center);
  radius = Math.max(sphere.radius, 0.1);
  frameModel();
}, undefined, err => {
  console.error('Unable to load base model:', err);
});

function frameModel() {
  const aspect = camera.aspect || 1;
  const fov = THREE.MathUtils.degToRad(camera.fov);
  const distance = (radius * 1.35) / Math.tan(fov / 2);
  camera.position.set(target.x, target.y, target.z + distance);
  camera.lookAt(target);
}

function pointerDown(x, y) {
  dragging = true;
  lastX = x;
  lastY = y;
  velocity = 0;
}
function pointerMove(x, y) {
  if (!dragging || !model) return;
  const dx = x - lastX;
  const dy = y - lastY;
  lastX = x;
  lastY = y;
  yaw += dx * 0.008;
  pitch = THREE.MathUtils.clamp(pitch + dy * 0.003, -0.9, 0.9);
  velocity = dx * 0.008;
}
function pointerUp() { dragging = false; }

canvas.addEventListener('pointerdown', e => {
  canvas.setPointerCapture?.(e.pointerId);
  pointerDown(e.clientX, e.clientY);
});
canvas.addEventListener('pointermove', e => pointerMove(e.clientX, e.clientY));
canvas.addEventListener('pointerup', pointerUp);
canvas.addEventListener('pointercancel', pointerUp);
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const direction = Math.sign(e.deltaY);
  camera.position.z = THREE.MathUtils.clamp(camera.position.z + direction * radius * 0.12, radius * 0.8, radius * 8);
}, { passive: false });

function animate(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  if (model) {
    if (!dragging) {
      yaw += velocity * dt;
      velocity *= Math.pow(0.4, dt);
      if (Math.abs(velocity) < 0.0001) velocity = 0;
    }
    root.rotation.y = yaw;
    root.rotation.x = pitch;
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  if (model) frameModel();
});
