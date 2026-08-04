/* ============================================================
   RAKE — Three.js Integration (FBX + Bloom Effect)
   ============================================================ */

import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { DecalGeometry } from 'three/addons/geometries/DecalGeometry.js';

/* ─────────────────────────────────────────────────────────────
   CONFIGURATION
   ───────────────────────────────────────────────────────────── */

// Mapping parts of the FBX model to UI components
const COMPONENT_MAPPING = [
    { key: 'lidar', keywords: ['Lidar', 'LIDAR', 'lidar'] },
    { key: 'wheels', keywords: ['Wheel', 'Tekerlek', 'wheel', 'teker_montajı', 'teker'] },
    { key: 'caster', keywords: ['Caster', 'Sarhos', 'caster'] },
    { key: 'cameras', keywords: ['Camera', 'Kamera', 'camera'] },
    { key: 'ventilation', keywords: ['havalandırma', 'havalandirma', 'ızgara', 'izgara', 'vent', 'grille', 'gözceğiz', 'gözceğiz_12', 'gözceğiz_11'] },
    { key: 'laser', keywords: ['lazer', 'laser', 'silah', 'atış', 'weapon', 'gun'] },
    { key: 'gps', keywords: ['gps', 'anten', 'antenna'] },
    { key: 'propeller', keywords: ['pervane', 'propeller', 'rotor', 'aeronaut', 'blade', 'fan'] }
];

const CAMERA_PRESETS = {
    default: { position: new THREE.Vector3(0, 80, 200), target: new THREE.Vector3(0, 20, 0) },
    lidar: { position: new THREE.Vector3(0, 100, 80), target: new THREE.Vector3(0, 70, 0) },
    wheels: { position: new THREE.Vector3(-100, 30, 80), target: new THREE.Vector3(0, 10, 0) },
    caster: { position: new THREE.Vector3(80, 20, -100), target: new THREE.Vector3(0, 10, -50) },
    cameras: { position: new THREE.Vector3(50, 120, 100), target: new THREE.Vector3(0, 90, 0) },
    ventilation: { position: new THREE.Vector3(-60, 50, 100), target: new THREE.Vector3(0, 30, 0) },
    laser: { position: new THREE.Vector3(0, 120, 80), target: new THREE.Vector3(0, 80, 0) },
    gps: { position: new THREE.Vector3(0, 140, -50), target: new THREE.Vector3(0, 100, -20) },
    propeller: { position: new THREE.Vector3(0, 150, 50), target: new THREE.Vector3(0, 100, 0) }
};

const GLOW_INTENSITY_HOVER = 5.0;
const GLOW_INTENSITY_CLICK = 10.0;
const CAMERA_ANIM_DURATION = 1200;

/* ─────────────────────────────────────────────
   GLOBAL STATE
   ───────────────────────────────────────────── */

let currentMode = 'click';
let selectedComponent = null;

// Three.js instances
let scene, camera, renderer, composer, controls;
let robotModels = []; // Array of loaded models

// Nav Sphere instances
let navSphereRenderer, navSphereScene, navSphereCamera, navSphereMesh;
let isNavSphereDragging = false;
let navSphereStart = { x: 0, y: 0 };
let currentPivot = new THREE.Vector3(0, 20, 0); // Always points to the active component's center

// Nav Pan instances
let panVelocity = new THREE.Vector2(0, 0);
let isPanJoystickDragging = false;
let panJoystickStart = { x: 0, y: 0 };

// Raycaster & Interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const interactableMeshes = [];

let currentSlide = 0;
const totalSlides = 5;

document.addEventListener('DOMContentLoaded', () => {
    initUI();
    initThreeJS();
});

function initUI() {
    initComponentPanel();
    initNavLinks();
    initCarousel();
    init3DModeToggle();
    initEntranceAnimations();

    // Initial routing based on URL
    handleInitialRoute();

    const btnReset = document.getElementById('btn-reset-pos');
    if (btnReset) {
        btnReset.addEventListener('click', () => {
            deselectComponent();
        });
    }

    const btnScrollDetails = document.querySelectorAll('.btn-scroll-details');
    btnScrollDetails.forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('details-section').scrollIntoView({ behavior: 'smooth' });
        });
    });

    // Scroll efekti: Header arkaplanını siyaha döndür
    const header = document.getElementById('main-header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

/* ─────────────────────────────────────────────
   THREE.JS SETUP
   ───────────────────────────────────────────── */

function initThreeJS() {
    const canvas = document.getElementById('canvas3d');
    if (!canvas) return;

    // 1. Renderer
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 2. Scene
    scene = new THREE.Scene();
    // Sıcak gradient arkaplanla uyumlu, karanlık-sıcak bir sis
    scene.fog = new THREE.FogExp2(0x1a1816, 0.0015);

    // 3. Camera
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.copy(CAMERA_PRESETS.default.position);

    // 4. OrbitControls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enabled = false; // Disabled during carousel mode
    controls.target.copy(CAMERA_PRESETS.default.target);

    // Initialize the Navigation Sphere and Pan Joystick
    initNavSphere();
    initNavPanControl();

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(100, 200, 100);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 100;
    dirLight.shadow.camera.bottom = -100;
    dirLight.shadow.camera.left = -100;
    dirLight.shadow.camera.right = 100;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xffb86c, 0.6); // Warm sunset fill light
    fillLight.position.set(-100, 50, -100);
    scene.add(fillLight);

    // 6. Post-Processing (Outline/Border)
    const renderScene = new RenderPass(scene, camera);

    // OutlinePass'i tanımlıyoruz (Ekran boyutu, sahne, kamera)
    window.outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
    window.outlinePass.edgeStrength = 4.0; // Kenar kalınlığı/gücü
    window.outlinePass.edgeGlow = 1.0; // Dışa doğru parlama
    window.outlinePass.edgeThickness = 1.0; // Çizgi kalınlığı
    window.outlinePass.pulsePeriod = 0; // Nefes alma efekti istenirse > 0 yapılabilir
    // Modern sade tasarım için neon mavi yerine beyaz/gri tonlar kullanıyoruz
    window.outlinePass.visibleEdgeColor.set('#ffffff'); // Görünür kenar rengi (White)
    window.outlinePass.hiddenEdgeColor.set('#a1a1aa'); // Arkada kalan kenar rengi (Gray)

    const outputPass = new OutputPass();

    composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(window.outlinePass); // Bloom yerine Outline kullanılıyor
    composer.addPass(outputPass);

    // 7. Load Model
    loadModel();

    // 8. Event Listeners
    window.addEventListener('resize', onWindowResize);
    canvas.addEventListener('pointermove', onMouseMove);
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('click', onClick);

    // 9. Animation Loop
    animate();
}

function initNavSphere() {
    const container = document.getElementById('nav-sphere');
    if (!container) return;

    // 1. Renderer
    navSphereRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    navSphereRenderer.setSize(40, 40);
    container.appendChild(navSphereRenderer.domElement);

    // 2. Scene & Camera
    navSphereScene = new THREE.Scene();
    navSphereCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    navSphereCamera.position.z = 4;

    // 3. Sphere Mesh (Wireframe) - Adjusted segments to match the user's globe icon (8 width, 4 height)
    const geometry = new THREE.SphereGeometry(1.2, 8, 4);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.6 });
    navSphereMesh = new THREE.Mesh(geometry, material);
    navSphereScene.add(navSphereMesh);

    // 4. Custom Rotation Logic (Rotates around currentPivot instead of controls.target)
    container.addEventListener('pointerdown', (e) => {
        isNavSphereDragging = true;
        navSphereStart = { x: e.clientX, y: e.clientY };
        container.setPointerCapture(e.pointerId);
    });

    container.addEventListener('pointermove', (e) => {
        if (!isNavSphereDragging || !camera || !controls) return;

        const dx = e.clientX - navSphereStart.x;
        const dy = e.clientY - navSphereStart.y;
        navSphereStart = { x: e.clientX, y: e.clientY };

        const angleY = -dx * 0.01;
        const angleX = -dy * 0.01;

        // Rotate around world Y axis
        const qY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angleY);

        // Rotate around Camera's local Right axis
        const right = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 0);
        const qX = new THREE.Quaternion().setFromAxisAngle(right, angleX);

        const q = new THREE.Quaternion().multiplyQuaternions(qY, qX);

        // Apply rotation to camera position relative to currentPivot
        const camOffset = camera.position.clone().sub(currentPivot);
        camOffset.applyQuaternion(q);
        camera.position.copy(currentPivot).add(camOffset);

        // Apply SAME rotation to controls.target so pan offset is preserved and rotated
        const targetOffset = controls.target.clone().sub(currentPivot);
        targetOffset.applyQuaternion(q);
        controls.target.copy(currentPivot).add(targetOffset);

        camera.lookAt(controls.target);
    });

    container.addEventListener('pointerup', (e) => {
        isNavSphereDragging = false;
        container.releasePointerCapture(e.pointerId);
    });
}

function initNavPanControl() {
    const container = document.getElementById('nav-pan-control');
    const joystick = document.getElementById('pan-joystick');
    if (!container || !joystick) return;

    // 1. Arrow Button Logic
    const arrows = container.querySelectorAll('.pan-arrow');

    arrows.forEach(arrow => {
        arrow.addEventListener('pointerdown', (e) => {
            const dir = arrow.dataset.dir;
            const speed = 0.4; // Micro panning speed
            if (dir === 'up') panVelocity.y = speed;
            if (dir === 'down') panVelocity.y = -speed;
            if (dir === 'left') panVelocity.x = speed;
            if (dir === 'right') panVelocity.x = -speed;
        });

        const stopPan = () => {
            if (!isPanJoystickDragging) panVelocity.set(0, 0);
        };
        arrow.addEventListener('pointerup', stopPan);
        arrow.addEventListener('pointerleave', stopPan);
    });

    // 2. Joystick Logic
    const MAX_PAN_RADIUS = 8; // Tighter movement area

    joystick.addEventListener('pointerdown', (e) => {
        isPanJoystickDragging = true;
        panJoystickStart = { x: e.clientX, y: e.clientY };
        joystick.classList.add('is-dragging');
        joystick.setPointerCapture(e.pointerId);
    });

    joystick.addEventListener('pointermove', (e) => {
        if (!isPanJoystickDragging) return;

        let dx = e.clientX - panJoystickStart.x;
        let dy = e.clientY - panJoystickStart.y;

        const dist = Math.sqrt(dx * dx + dy * dy);

        // Elastic / Spring resistance formula:
        const effectiveDist = MAX_PAN_RADIUS * (1 - Math.exp(-dist / (MAX_PAN_RADIUS * 1.0)));

        if (dist > 0) {
            dx = (dx / dist) * effectiveDist;
            dy = (dy / dist) * effectiveDist;
        }

        // Apply visual transform to joystick
        joystick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

        // Map offset to pan velocity (Invert dx/dy for intuitive camera move vs object move)
        panVelocity.x = -dx * 0.06;
        panVelocity.y = dy * 0.06;
    });

    const resetJoystick = (e) => {
        if (!isPanJoystickDragging) return;
        isPanJoystickDragging = false;
        joystick.classList.remove('is-dragging');
        joystick.style.transform = `translate(-50%, -50%)`; // Relies on CSS transition for spring back
        panVelocity.set(0, 0);
        joystick.releasePointerCapture(e.pointerId);
    };

    joystick.addEventListener('pointerup', resetJoystick);
}

function loadModel() {
    const loader = new FBXLoader();

    const statusEl = document.getElementById('hud-status');
    if (statusEl) statusEl.textContent = "SYSTEM: INITIALIZING VEHICLES...";

    const modelsToLoad = [
        { file: 'public/models/AYAZ.fbx', scale: 0.15, isKayra: false, rotX: -92.0, rotY: -5.0, rotZ: 100.0 },
        { file: 'public/models/kayrav1.fbx', scale: 0.15, isKayra: true, rotX: -92.0, rotY: -5.0, rotZ: 100.0 },
        { file: 'public/models/kayrav2.fbx', scale: 0.15, isKayra: false, rotX: 2.0, rotY: 85.0, rotZ: 2.0 },
        { file: 'public/models/İOS İKA.fbx', scale: 0.15, isKayra: false, rotX: 2.0, rotY: 85.0, rotZ: 2.0 },
        { file: 'public/models/İHA.fbx', scale: 0.15, isKayra: false, rotX: 2.0, rotY: 85.0, rotZ: 2.0 }
    ];

    let loadedCount = 0;

    modelsToLoad.forEach((item, index) => {
        console.log(`Model yükleniyor: ${item.file}...`);

        loader.load(
            item.file,
            (fbx) => {
                const model = fbx;

                model.scale.set(item.scale, item.scale, item.scale);

                const rotX = item.rotX * Math.PI / 180;
                const rotY = item.rotY * Math.PI / 180;
                const rotZ = item.rotZ * Math.PI / 180;
                model.rotation.set(rotX, rotY, rotZ);
                model.updateMatrixWorld(true);

                model.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;

                        if (child.material) {
                            let mats = Array.isArray(child.material) ? child.material : [child.material];

                            let newMats = mats.map(mat => {
                                let newMat = new THREE.MeshStandardMaterial({
                                    name: mat.name,
                                    color: mat.color,
                                    metalness: 0.7,
                                    roughness: 0.25
                                });

                                let mName = mat.name ? mat.name.toLowerCase() : "";
                                let cName = child.name ? child.name.toLowerCase() : "";

                                if (cName.includes('gövde2') || cName.includes('govde2') || cName.includes('gövde 2') ||
                                    cName.includes('teker') || cName.includes('caster') || cName.includes('wheel') || cName.includes('cast') ||
                                    mName.includes('black') || mName.includes('siyah') || mName.includes('dark') || mName.includes('top')) {
                                    newMat.color.setHex(0x181818);
                                }
                                else if (mName.includes('yellow') || mName.includes('gold') || mName.includes('body') || mName.includes('sari') || mName.includes('gövde') || mName.includes('govde')) {
                                    newMat.color.setHex(0xb59a45);
                                }
                                else if (mat.color) {
                                    const hsl = {};
                                    mat.color.getHSL(hsl);

                                    if (hsl.h > 0.05 && hsl.h < 0.2 && hsl.s > 0.2) {
                                        newMat.color.setHex(0xb59a45);
                                    } else if (hsl.l < 0.2) {
                                        newMat.color.setHex(0x181818);
                                    }
                                }
                                return newMat;
                            });
                            child.material = Array.isArray(child.material) ? newMats : newMats[0];
                        }

                        const compKey = getComponentKeyFromMesh(child);
                        if (compKey) {
                            child.userData.component = compKey;
                            child.userData.modelIndex = index;
                            interactableMeshes.push(child);
                        }

                        if (index === 4) {
                            console.log("İHA Mesh Name:", child.name);
                        }
                    }
                });

                if (!item.isKayra) {
                    applyDecals(model);
                }

                let lidarMaterial = null;
                model.traverse((child) => {
                    if (child.isMesh && child.userData.component === 'lidar' && child.material && !lidarMaterial) {
                        lidarMaterial = Array.isArray(child.material) ? child.material[0] : child.material;
                    }
                });
                if (lidarMaterial) {
                    model.traverse((child) => {
                        if (child.isMesh && child.userData.component === 'caster') {
                            child.material = lidarMaterial;
                            child.material.needsUpdate = true;
                        }
                    });
                }

                const initialBox = new THREE.Box3().setFromObject(model);
                const initialCenter = initialBox.getCenter(new THREE.Vector3());
                model.position.sub(initialCenter);
                model.updateMatrixWorld(true);

                const box = new THREE.Box3().setFromObject(model);
                const size = box.getSize(new THREE.Vector3());
                const center = new THREE.Vector3(0, 0, 0);
                const maxDim = Math.max(size.x, size.y, size.z);

                if (index === 0) {
                    CAMERA_PRESETS.default.target.copy(center);
                    CAMERA_PRESETS.default.position.set(center.x + maxDim, center.y + maxDim * 0.5, center.z + maxDim);

                    const offset0 = new THREE.Vector3(maxDim * 1.3, maxDim * 0.3, maxDim * 1.3);
                    const slide0CamPos = center.clone().add(offset0);
                    const forward0 = center.clone().sub(slide0CamPos).normalize();
                    const right0 = forward0.clone().cross(new THREE.Vector3(0, 1, 0)).normalize();
                    const target0 = center.clone().sub(right0.multiplyScalar(maxDim * 0.45));
                    target0.y += maxDim * 0.01;
                    CAMERA_PRESETS.slide0 = { position: slide0CamPos, target: target0 };
                } else if (index === 1) {
                    const offset1 = new THREE.Vector3(maxDim * 1.3, maxDim * 0.3, maxDim * 1.3);
                    const slide1CamPos = center.clone().add(offset1);
                    const forward1 = center.clone().sub(slide1CamPos).normalize();
                    const right1 = forward1.clone().cross(new THREE.Vector3(0, 1, 0)).normalize();
                    const target1 = center.clone().sub(right1.multiplyScalar(maxDim * 0.45));
                    target1.y += maxDim * 0.01;
                    CAMERA_PRESETS.slide1 = { position: slide1CamPos, target: target1 };
                } else if (index === 2) {
                    const offset2 = new THREE.Vector3(maxDim * 1.3, maxDim * 0.3, maxDim * 1.3);
                    const slide2CamPos = center.clone().add(offset2);
                    const forward2 = center.clone().sub(slide2CamPos).normalize();
                    const right2 = forward2.clone().cross(new THREE.Vector3(0, 1, 0)).normalize();
                    const target2 = center.clone().sub(right2.multiplyScalar(maxDim * 0.45));
                    target2.y += maxDim * 0.01;
                    CAMERA_PRESETS.slide2 = { position: slide2CamPos, target: target2 };
                }

                model.visible = false;
                scene.add(model);
                robotModels[index] = model;

                loadedCount++;
                if (loadedCount === modelsToLoad.length) {
                    console.log('Tüm modeller yüklendi!');
                    const loadingOverlay = document.getElementById('loading-overlay');
                    if (loadingOverlay) loadingOverlay.classList.add('hidden');

                    // Başlangıç kamerasını slide0 ile aynı açıya ama çok daha uzağa koy (düz zoom efekti için)
                    if (CAMERA_PRESETS.slide0) {
                        const dir = CAMERA_PRESETS.slide0.position.clone().sub(CAMERA_PRESETS.slide0.target).normalize();
                        camera.position.copy(CAMERA_PRESETS.slide0.target.clone().add(dir.multiplyScalar(350)));
                        controls.target.copy(CAMERA_PRESETS.slide0.target);
                    } else {
                        controls.target.copy(new THREE.Vector3(0, 0, 0));
                    }
                    controls.update();
                    goToSlide(0);
                }
            },
            (xhr) => {
                if (statusEl && loadedCount === 0) {
                    statusEl.textContent = `SYSTEM: LOADING... %${Math.round(xhr.loaded / xhr.total * 100)}`;
                }
            },
            (error) => {
                console.error(`Model yükleme hatası (${item.file}):`, error);
                if (statusEl) statusEl.textContent = 'MODEL YÜKLEME HATASI';
            }
        );
    });
}


function applyDecals(model) {
    const textureLoader = new THREE.TextureLoader();
    const logoTexture = textureLoader.load('public/images/assets/itu-logo.png');
    logoTexture.colorSpace = THREE.SRGBColorSpace;

    const decalMaterial = new THREE.MeshStandardMaterial({
        map: logoTexture,
        transparent: true,
        depthTest: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -4,
        roughness: 0.5,
        metalness: 0.1
    });

    // Robotun ana gövde mesh'ini bul (genellikle en çok vertex'i olan veya en büyük olan)
    let bodyMesh = null;
    let maxVerts = 0;
    model.traverse((child) => {
        if (child.isMesh && child.geometry && child.geometry.attributes.position) {
            const count = child.geometry.attributes.position.count;
            if (count > maxVerts) {
                maxVerts = count;
                bodyMesh = child;
            }
        }
    });

    if (!bodyMesh) return;

    // Modelin dünya üzerindeki boyutlarını ve merkezini al
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    // Sağ yan taraf için Raycaster ile yüzey bul
    // Aracın Z ekseni uzunluğuna göre yanlardan merkeze ışın yolluyoruz
    const raycaster = new THREE.Raycaster();
    const maxDim = Math.max(size.x, size.y, size.z);

    // Aracın sağ tarafından (X ekseni) içeri doğru ışın at
    const originRight = new THREE.Vector3(center.x + maxDim, center.y + size.y * 0.1, center.z - size.z * 0.15);
    const directionLeft = new THREE.Vector3(-1, 0, 0); // Sola doğru
    raycaster.set(originRight, directionLeft);

    const intersectsRight = raycaster.intersectObject(bodyMesh, true);
    if (intersectsRight.length > 0) {
        const hit = intersectsRight[0];

        // Decal boyutunu modele göre ayarla
        const decalSize = new THREE.Vector3(maxDim * 0.25, maxDim * 0.25, maxDim * 0.25);

        // Yüzeyin normaline göre döndür
        const orientation = new THREE.Euler();
        const n = hit.face.normal.clone();
        n.transformDirection(hit.object.matrixWorld);

        const target = hit.point.clone().add(n);
        const dummy = new THREE.Object3D();
        dummy.position.copy(hit.point);
        dummy.lookAt(target);
        orientation.copy(dummy.rotation);

        // Y yönünü düzelt (bazen yan dönüyor)
        orientation.z = 0;

        const decalGeometry = new DecalGeometry(hit.object, hit.point, orientation, decalSize);
        const decalMesh = new THREE.Mesh(decalGeometry, decalMaterial);
        scene.add(decalMesh);
    }
}

function getComponentKeyFromMesh(mesh) {
    let current = mesh;
    while (current) {
        if (current.name) {
            for (const mapping of COMPONENT_MAPPING) {
                if (mapping.keywords.some(kw => current.name.toLowerCase().includes(kw.toLowerCase()))) {
                    return mapping.key;
                }
            }
        }
        current = current.parent;
    }
    return null;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;

    if (document.body.classList.contains('mode-3d-active')) {
        const panelRight = document.querySelector('#component-panel');
        if (panelRight && window.innerWidth > 768) {
            const offset = panelRight.offsetWidth / 2;
            camera.setViewOffset(window.innerWidth, window.innerHeight, offset, 0, window.innerWidth, window.innerHeight);
        } else if (camera.clearViewOffset) {
            camera.clearViewOffset();
        }
    } else if (camera.clearViewOffset) {
        camera.clearViewOffset();
    }

    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
}

/* ─────────────────────────────────────────────
   INTERACTION (Raycasting & Glow)
   ───────────────────────────────────────────── */

let hoveredComponent = null;
let isDragging = false;
let pointerDownPos = { x: 0, y: 0 };

function onPointerDown(event) {
    pointerDownPos.x = event.clientX;
    pointerDownPos.y = event.clientY;
    isDragging = false;
}

function onPointerUp(event) {
    const dist = Math.hypot(event.clientX - pointerDownPos.x, event.clientY - pointerDownPos.y);
    if (dist > 5) { // 5 piksellik bir sapma payı (hareket edildiyse drag kabul et)
        isDragging = true;
    }
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Only allow hover effects if in 3D interactive mode
    if (!document.body.classList.contains('mode-3d-active')) {
        if (hoveredComponent) {
            hoveredComponent = null;
            updateOutlineEffects();
            document.getElementById('canvas3d').style.cursor = 'default';
        }
        return;
    }

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(interactableMeshes, false);

    let foundComponent = null;
    const ayazComponents = ['lidar', 'wheels', 'caster', 'cameras', 'ventilation'];
    const kayraComponents = ['wheels', 'laser', 'gps'];
    const yanciComponents = ['wheels', 'lidar', 'cameras'];
    const iosComponents = ['wheels', 'cameras'];
    const ihaComponents = ['gps', 'propeller'];

    let activeComponents = [];
    if (currentSlide === 0) activeComponents = ayazComponents;
    else if (currentSlide === 1) activeComponents = kayraComponents;
    else if (currentSlide === 2) activeComponents = yanciComponents;
    else if (currentSlide === 3) activeComponents = iosComponents;
    else if (currentSlide === 4) activeComponents = ihaComponents;

    if (intersects.length > 0) {
        for (let i = 0; i < intersects.length; i++) {
            let obj = intersects[i].object;
            if (obj.userData.modelIndex === currentSlide && activeComponents.includes(obj.userData.component)) {
                foundComponent = obj.userData.component;
                break;
            }
        }
    }

    // Hover değişimi
    if (hoveredComponent !== foundComponent) {
        hoveredComponent = foundComponent;
        updateOutlineEffects();

        // İmleci güncelle
        document.getElementById('canvas3d').style.cursor = hoveredComponent ? 'pointer' : 'default';
    }
}

function onClick(event) {
    if (isDragging) return;

    // UI'a tıklanıp tıklanmadığını kontrol et
    if (event.target.id !== 'canvas3d') return;

    // Only allow component clicks if in 3D interactive mode
    if (!document.body.classList.contains('mode-3d-active')) return;

    // Hata ayıklama: Tıklanan objenin hiyerarşisini konsola yazdır (Tekerlek ismini bulmak için)
    raycaster.setFromCamera(mouse, camera);
    const allIntersects = raycaster.intersectObjects(scene.children, true);
    if (allIntersects.length > 0) {
        let current = allIntersects[0].object;
        let path = [];
        while (current) {
            if (current.name) path.push(current.name);
            current = current.parent;
        }
        console.log("🖱️ Tıklanan Obje Hiyerarşisi:", path.join(" -> "));
    }

    if (hoveredComponent) {
        if (selectedComponent === hoveredComponent) {
            deselectComponent();
        } else {
            selectComponent(hoveredComponent);
        }
    } else {
        // Boşluğa tıklandıysa
        deselectComponent();
    }
}

function updateOutlineEffects() {
    if (!window.outlinePass) return;

    const selectedObjects = [];
    interactableMeshes.forEach(mesh => {
        const comp = mesh.userData.component;
        if (comp === selectedComponent || comp === hoveredComponent) {
            selectedObjects.push(mesh);
        }
    });

    // Eğer tıklanan varsa rengi biraz daha parlak yapabiliriz (opsiyonel)
    if (selectedComponent) {
        window.outlinePass.visibleEdgeColor.set('#00e5ff');
        window.outlinePass.edgeStrength = 6.0;
    } else {
        window.outlinePass.visibleEdgeColor.set('#00aaff');
        window.outlinePass.edgeStrength = 4.0;
    }

    window.outlinePass.selectedObjects = selectedObjects;
}

function selectComponent(comp) {
    selectedComponent = comp;
    updateOutlineEffects();
    openComponentByTarget(comp);
    moveCameraToComponent(comp);
}

function deselectComponent(snapBack = true) {
    selectedComponent = null;
    updateOutlineEffects();
    closeAllComponents();
    if (snapBack) {
        moveCameraToComponent('default');
    }
}

/* ─────────────────────────────────────────────
   CAMERA ANIMATION
   ───────────────────────────────────────────── */

let cameraAnimId = null;

function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function computeComponentCameraTarget(compName) {
    if (compName === 'default' || !compName) {
        return CAMERA_PRESETS[`slide${currentSlide}`] || CAMERA_PRESETS.default;
    }

    const meshes = interactableMeshes.filter(m => m.userData.component === compName && m.userData.modelIndex === currentSlide);
    if (meshes.length === 0) {
        return CAMERA_PRESETS[`slide${currentSlide}`] || CAMERA_PRESETS.default;
    }

    const box = new THREE.Box3();
    meshes.forEach(m => box.expandByObject(m));
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    // O parçaya özel kamera açısı hesapla (biraz yukarıdan ve yandan)
    const offset = new THREE.Vector3(maxDim * 1.5, maxDim * 1.0, maxDim * 1.5);
    const position = center.clone().add(offset);

    return { position: position, target: center };
}

function moveCameraToComponent(compName) {
    const preset = computeComponentCameraTarget(compName);
    if (currentPivot) currentPivot.copy(preset.target); // Update pivot to new component center
    animateCamera(preset.position, preset.target, CAMERA_ANIM_DURATION);
}

function animateCamera(targetPos, targetLookAt, duration) {
    if (cameraAnimId) cancelAnimationFrame(cameraAnimId);

    const startPos = camera.position.clone();
    const startTarget = controls.target.clone();

    // Eğer hedef kamera konumları tamamen aynıysa animasyon yapma
    if (startPos.distanceTo(targetPos) < 0.1 && startTarget.distanceTo(targetLookAt) < 0.1) return;

    const startTime = performance.now();

    function update(now) {
        const elapsed = now - startTime;
        const rawT = Math.min(elapsed / duration, 1);
        const t = easeInOutCubic(rawT);

        camera.position.lerpVectors(startPos, targetPos, t);
        controls.target.lerpVectors(startTarget, targetLookAt, t);
        controls.update();

        if (rawT < 1) {
            cameraAnimId = requestAnimationFrame(update);
        } else {
            cameraAnimId = null;
        }
    }

    cameraAnimId = requestAnimationFrame(update);
}

let viewOffsetAnimId = null;

function animateViewOffset(targetOffset, duration) {
    if (viewOffsetAnimId) cancelAnimationFrame(viewOffsetAnimId);

    const startOffset = (camera.view && camera.view.offsetX) ? camera.view.offsetX : 0;

    if (Math.abs(startOffset - targetOffset) < 1) {
        if (targetOffset === 0 && camera.clearViewOffset) {
            camera.clearViewOffset();
        } else {
            camera.setViewOffset(window.innerWidth, window.innerHeight, targetOffset, 0, window.innerWidth, window.innerHeight);
        }
        camera.updateProjectionMatrix();
        return;
    }

    const startTime = performance.now();

    function update(now) {
        const elapsed = now - startTime;
        const rawT = Math.min(elapsed / duration, 1);
        const t = easeInOutCubic(rawT);

        const currentOffset = startOffset + (targetOffset - startOffset) * t;

        if (currentOffset === 0 && camera.clearViewOffset) {
            camera.clearViewOffset();
        } else {
            camera.setViewOffset(window.innerWidth, window.innerHeight, currentOffset, 0, window.innerWidth, window.innerHeight);
        }
        camera.updateProjectionMatrix();

        if (rawT < 1) {
            viewOffsetAnimId = requestAnimationFrame(update);
        } else {
            viewOffsetAnimId = null;
            if (targetOffset === 0 && camera.clearViewOffset) {
                camera.clearViewOffset();
                camera.updateProjectionMatrix();
            }
        }
    }

    viewOffsetAnimId = requestAnimationFrame(update);
}

/* ─────────────────────────────────────────────
   ANIMATION LOOP
   ───────────────────────────────────────────── */

function applyCameraPan(deltaX, deltaY) {
    if (!camera || !controls || document.body.classList.contains('mode-3d-active') === false) return;

    // Get the camera's local right vector
    const right = new THREE.Vector3();
    right.setFromMatrixColumn(camera.matrix, 0);

    // Get the camera's local up vector
    const up = new THREE.Vector3();
    up.setFromMatrixColumn(camera.matrix, 1);

    // Multiply vectors by delta
    right.multiplyScalar(deltaX);
    up.multiplyScalar(deltaY);

    // Add to camera and target
    const panVector = right.add(up);
    camera.position.add(panVector);
    controls.target.add(panVector);
}

function animate() {
    requestAnimationFrame(animate);

    // Yumuşak kamera takibi
    if (!cameraAnimId) {
        // Apply joystick/d-pad panning
        if (panVelocity.x !== 0 || panVelocity.y !== 0) {
            applyCameraPan(panVelocity.x, panVelocity.y);
        }

        controls.update();
    }

    // EffectComposer ile render et (Bloom/Outline için)
    composer.render();

    // Navigasyon küresini ana kamera açısına göre senkronize et ve renderla
    if (navSphereRenderer && document.body.classList.contains('mode-3d-active')) {
        // Ana kameranın hedefe olan yönünü bul
        const dir = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
        // Mini kamerayı bu yöne, ama küreye yakın bir mesafeye (çap 4) yerleştir
        navSphereCamera.position.copy(dir.multiplyScalar(3.5));
        navSphereCamera.lookAt(0, 0, 0);
        navSphereRenderer.render(navSphereScene, navSphereCamera);
    }
}

/* ─────────────────────────────────────────────
   UI LOGIC
   ───────────────────────────────────────────── */

function openComponentByTarget(target) {
    closeAllComponents();
    const item = document.querySelector(`.component-item[data-component="${target}"]`);
    if (item) {
        item.classList.add('active');
        const btn = item.querySelector('.component-btn');
        if (btn) btn.setAttribute('aria-expanded', 'true');
        item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function initComponentPanel() {
    document.querySelectorAll('.component-item').forEach(item => {
        const btn = item.querySelector('.component-btn');
        btn.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            if (!isActive) {
                selectComponent(item.dataset.component);
            } else {
                deselectComponent();
            }
        });
        btn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); }
        });
    });
}

function closeAllComponents() {
    document.querySelectorAll('.component-item').forEach(i => {
        i.classList.remove('active');
        const b = i.querySelector('.component-btn');
        if (b) b.setAttribute('aria-expanded', 'false');
    });
}
function initNavLinks() {
    const navLinks = document.querySelectorAll('[data-nav]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('data-nav');
            const targetEl = document.getElementById(targetId === 'araclar' ? 'carousel-section' : targetId + '-section');
            if (targetEl) {
                e.preventDefault();
                navigateToSection(targetId);
            } else {
                const targetPage = targetId === 'araclar' ? 'index.html' : `${targetId}.html`;
                window.location.href = targetPage;
            }
        });
    });

    if (typeof initTeamScrollReveal === 'function') {
        initTeamScrollReveal();
    }
}

function navigateToSection(sectionId) {
    const targetEl = document.getElementById(sectionId === 'araclar' ? 'carousel-section' : sectionId + '-section');
    if (!targetEl) return;

    // Hide all main sections
    const sections = ['araclar', 'takimimiz', 'ekipler', 'sponsorlarimiz', 'basvuru'];
    sections.forEach(id => {
        const el = document.getElementById(id === 'araclar' ? 'carousel-section' : id + '-section');
        if (el) el.style.display = 'none';
    });

    // Show target section
    targetEl.style.display = 'block';

    // Details section logic
    const detailsSection = document.getElementById('details-section');
    if (sectionId === 'araclar') {
        if(detailsSection) detailsSection.style.display = 'flex';
    } else {
        if(detailsSection) detailsSection.style.display = 'none';
    }

    // Manage component panel visibility
    const componentPanel = document.getElementById('component-panel');
    if (sectionId === 'araclar') {
        if(componentPanel) componentPanel.style.display = 'flex';
    } else {
        if(componentPanel) componentPanel.style.display = 'none';
    }

    // Dim the 3D background if not on araclar
    const splineBg = document.getElementById('spline-bg');
    if (sectionId === 'araclar') {
        if (splineBg) {
            splineBg.style.opacity = '1';
            splineBg.style.pointerEvents = 'auto';
        }
    } else {
        if (splineBg) {
            splineBg.style.opacity = '0.3';
            splineBg.style.pointerEvents = 'none';
        }
    }

    // Update active class on nav
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    document.querySelectorAll(`.nav-link[data-nav="${sectionId}"]`).forEach(link => link.classList.add('active'));
}

function handleInitialRoute() {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
        navigateToSection(hash);
    }
}

function initTeamScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.takimimiz-page .team-container').forEach(container => {
        observer.observe(container);
    });

    // Sponsor tier reveal
    document.querySelectorAll('.sponsor-tier').forEach(tier => {
        observer.observe(tier);
    });
}

function initCarousel() {
    const btnNext = document.getElementById('carousel-next');
    const btnPrev = document.getElementById('carousel-prev');
    const dots = document.querySelectorAll('.dot');

    if (btnNext) btnNext.addEventListener('click', () => goToSlide((currentSlide + 1) % totalSlides));
    if (btnPrev) btnPrev.addEventListener('click', () => goToSlide((currentSlide - 1 + totalSlides) % totalSlides));

    dots.forEach(dot => {
        dot.addEventListener('click', (e) => {
            goToSlide(parseInt(e.target.dataset.index));
        });
    });

    // Touch/Mouse swipe implementation
    const heroSection = document.getElementById('hero');
    let startX = 0;
    let isDragging = false;
    let dragThreshold = 50;

    if (heroSection) {
        heroSection.addEventListener('pointerdown', (e) => {
            if (document.body.classList.contains('mode-3d-active')) return;
            startX = e.clientX;
            isDragging = true;
            heroSection.style.cursor = 'grabbing';
        });

        heroSection.addEventListener('pointermove', (e) => {
            if (!isDragging || document.body.classList.contains('mode-3d-active')) return;
        });

        heroSection.addEventListener('pointerup', (e) => {
            if (!isDragging || document.body.classList.contains('mode-3d-active')) return;
            isDragging = false;
            heroSection.style.cursor = 'default';

            let endX = e.clientX;
            let diffX = startX - endX;

            if (diffX > dragThreshold) {
                // Swiped left, go to next slide
                goToSlide((currentSlide + 1) % totalSlides);
            } else if (diffX < -dragThreshold) {
                // Swiped right, go to previous slide
                goToSlide((currentSlide - 1 + totalSlides) % totalSlides);
            }
        });

        heroSection.addEventListener('pointerleave', (e) => {
            if (isDragging) {
                isDragging = false;
                heroSection.style.cursor = 'default';
            }
        });
    }
}

function goToSlide(index) {
    if (currentSlide !== index) {
        deselectComponent(false);
    }
    currentSlide = index;

    // UI Update
    document.querySelectorAll('.carousel-slide').forEach((slide, i) => {
        slide.classList.toggle('active', i === index);
    });
    document.querySelectorAll('.dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });

    // Toggle Model Visibility
    if (robotModels && robotModels.length > 0) {
        robotModels.forEach((model, i) => {
            if (model) model.visible = (i === index);
        });
    }

    // Toggle Component List UI
    const ayazComponents = ['lidar', 'wheels', 'caster', 'cameras', 'ventilation'];
    const kayraComponents = ['wheels', 'laser', 'gps'];
    const yanciComponents = ['wheels', 'lidar', 'cameras']; // Yancı için teker, lidar, kamera
    const iosComponents = ['wheels', 'cameras']; // İOS İKA için
    const ihaComponents = ['gps', 'propeller']; // İHA için

    let activeComponents;
    if (index === 0) activeComponents = ayazComponents;
    else if (index === 1) activeComponents = kayraComponents;
    else if (index === 2) activeComponents = yanciComponents;
    else if (index === 3) activeComponents = iosComponents;
    else activeComponents = ihaComponents;

    document.querySelectorAll('.component-item').forEach(item => {
        const compId = item.dataset.component;
        if (activeComponents.includes(compId)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });

    // Toggle Details Section
    const detailsAyaz = document.getElementById('details-ayaz');
    const detailsKayra = document.getElementById('details-kayra');
    const detailsYanci = document.getElementById('details-yanci');
    const detailsIos = document.getElementById('details-ios');
    const detailsIha = document.getElementById('details-iha');
    if (detailsAyaz) detailsAyaz.style.display = index === 0 ? 'block' : 'none';
    if (detailsKayra) detailsKayra.style.display = index === 1 ? 'block' : 'none';
    if (detailsYanci) detailsYanci.style.display = index === 2 ? 'block' : 'none';
    if (detailsIos) detailsIos.style.display = index === 3 ? 'block' : 'none';
    if (detailsIha) detailsIha.style.display = index === 4 ? 'block' : 'none';

    // Camera Update
    if (!document.body.classList.contains('mode-3d-active')) {
        const preset = CAMERA_PRESETS[`slide${index}`];
        if (preset) {
            animateCamera(preset.position, preset.target, 1200);
        }
    } else {
        // If they click dots while in 3D mode, just center the camera on the newly visible model
        moveCameraToComponent('default');
    }
}

function init3DModeToggle() {
    const btns = document.querySelectorAll('.btn-3d-view');
    const btnClose = document.getElementById('btn-close-3d');

    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Butona basıldığında sayfayı en üste kaydır
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Kısa bir gecikme ile 3D modunu aktif et ki scroll animasyonu izlenebilsin
            setTimeout(() => {
                document.body.classList.add('mode-3d-active');
                controls.enabled = true; // Enable OrbitControls

                // Center camera in the remaining visible space (offset by half of the right panel width)
                const panelRight = document.querySelector('#component-panel');
                if (panelRight && window.innerWidth > 768) {
                    const offset = panelRight.offsetWidth / 2;
                    animateViewOffset(offset, CAMERA_ANIM_DURATION);
                } else {
                    animateViewOffset(0, CAMERA_ANIM_DURATION);
                }

                // Move camera slightly to give a sense of transition to interactive mode
                moveCameraToComponent('default');
            }, 300); // 300ms gecikme (kaydırma süresi)
        });
    });

    if (btnClose) {
        btnClose.addEventListener('click', () => {
            document.body.classList.remove('mode-3d-active');
            controls.enabled = false;

            // Sıfırla offset
            animateViewOffset(0, CAMERA_ANIM_DURATION);

            deselectComponent(false); // Clear component selection
            goToSlide(currentSlide); // Snap camera back to current slide
        });
    }

    // ESC tuşu ile 3D moddan çıkış
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.body.classList.contains('mode-3d-active')) {
            if (btnClose) btnClose.click();
        }
    });
}

function initEntranceAnimations() {
    const items = document.querySelectorAll('.component-item');
    items.forEach((item, idx) => {
        item.style.opacity = '0';
        item.style.transform = 'translateX(30px)';
        item.style.transition = `all 0.5s ${0.7 + idx * 0.12}s cubic-bezier(0.4,0,0.2,1)`;
        requestAnimationFrame(() => requestAnimationFrame(() => {
            item.style.opacity = '1'; item.style.transform = 'translateX(0)';
        }));
    });
    setTimeout(() => {
        items.forEach(item => { item.style.transition = ''; item.style.opacity = ''; item.style.transform = ''; });
    }, 2000);
}

// Native Application Form Submission and Toggle Logic
document.addEventListener('DOMContentLoaded', () => {
    const applyForm = document.getElementById('native-apply-form');
    const formMessage = document.getElementById('form-message');
    const teamSelect = document.getElementById('team-select');
    const commonQuestions = document.getElementById('common-questions');
    const submitBtn = document.getElementById('btn-submit-form');
    const allTeamQuestions = document.querySelectorAll('.team-questions');

    if (teamSelect) {
        teamSelect.addEventListener('change', (e) => {
            const selectedTeam = e.target.value;

            // Show common questions
            if (commonQuestions) commonQuestions.style.display = 'block';

            // Show submit button
            if (submitBtn) submitBtn.style.display = 'block';

            // Hide all team specific questions first, and remove their required attributes
            allTeamQuestions.forEach(div => {
                div.style.display = 'none';
                const inputs = div.querySelectorAll('textarea, input, select');
                inputs.forEach(input => input.removeAttribute('required'));
            });

            // Show selected team questions and make them required
            if (selectedTeam) {
                const targetDiv = document.getElementById('questions-' + selectedTeam);
                if (targetDiv) {
                    targetDiv.style.display = 'block';
                    const inputs = targetDiv.querySelectorAll('textarea, input, select');
                    inputs.forEach(input => input.setAttribute('required', 'true'));

                    // Auto scroll is removed because it distracts the user
                }
            }
        });
    }

    if (applyForm) {
        applyForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Disable button
            if (submitBtn) {
                submitBtn.innerText = 'Gönderiliyor...';
                submitBtn.disabled = true;
            }

            const formData = new FormData(applyForm);
            const data = Object.fromEntries(formData.entries());

            try {
                const apiUrl = '/api/apply';

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    formMessage.innerText = 'Başvurunuz başarıyla alındı! En kısa sürede iletişime geçeceğiz.';
                    formMessage.style.backgroundColor = '#dcfce7';
                    formMessage.style.color = '#166534';
                    formMessage.style.display = 'block';
                    applyForm.reset();
                    // Reset visibility
                    if (commonQuestions) commonQuestions.style.display = 'none';
                    if (submitBtn) submitBtn.style.display = 'none';
                    allTeamQuestions.forEach(div => div.style.display = 'none');
                } else {
                    formMessage.innerText = 'Bir hata oluştu: ' + (result.error || 'Lütfen tekrar deneyin.');
                    formMessage.style.backgroundColor = '#fee2e2';
                    formMessage.style.color = '#991b1b';
                    formMessage.style.display = 'block';
                }
            } catch (error) {
                console.error('Submit error:', error);
                formMessage.innerText = 'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.';
                formMessage.style.backgroundColor = '#fee2e2';
                formMessage.style.color = '#991b1b';
                formMessage.style.display = 'block';
            } finally {
                if (submitBtn) {
                    submitBtn.innerText = 'Başvuruyu Gönder';
                    submitBtn.disabled = false;
                }
            }
        });
    }
});
