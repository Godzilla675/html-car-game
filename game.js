import * as THREE from 'three';

// Game state
let scene, camera, renderer, player, aiCars = [], track, walls = [];
let keys = {};
let playerSpeed = 0;
let maxSpeed = 200;
let acceleration = 0.5;
let deceleration = 0.3;
let turnSpeed = 0.04;
let currentLap = 1;
let maxLaps = 3;
let raceStarted = false;
let raceFinished = false;
let checkpoints = [];
let lastCheckpoint = -1;
let isMobile = false;

// Track configuration
const trackWidth = 40;
const trackLength = 200;
const wallHeight = 5;
const mobileBreakpoint = 768; // Viewport width threshold for mobile detection

// Mobile controls setup
function setupMobileControls() {
    const btnForward = document.getElementById('btn-forward');
    const btnBrake = document.getElementById('btn-brake');
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');

    // Forward button
    btnForward.addEventListener('touchstart', (e) => {
        e.preventDefault();
        keys['arrowup'] = true;
    });
    btnForward.addEventListener('touchend', (e) => {
        e.preventDefault();
        keys['arrowup'] = false;
    });
    btnForward.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        keys['arrowup'] = false;
    });

    // Brake button
    btnBrake.addEventListener('touchstart', (e) => {
        e.preventDefault();
        keys['arrowdown'] = true;
    });
    btnBrake.addEventListener('touchend', (e) => {
        e.preventDefault();
        keys['arrowdown'] = false;
    });
    btnBrake.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        keys['arrowdown'] = false;
    });

    // Left button
    btnLeft.addEventListener('touchstart', (e) => {
        e.preventDefault();
        keys['arrowleft'] = true;
    });
    btnLeft.addEventListener('touchend', (e) => {
        e.preventDefault();
        keys['arrowleft'] = false;
    });
    btnLeft.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        keys['arrowleft'] = false;
    });

    // Right button
    btnRight.addEventListener('touchstart', (e) => {
        e.preventDefault();
        keys['arrowright'] = true;
    });
    btnRight.addEventListener('touchend', (e) => {
        e.preventDefault();
        keys['arrowright'] = false;
    });
    btnRight.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        keys['arrowright'] = false;
    });
}

// Initialize the game
function init() {
    // Detect mobile device
    isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS|FxiOS/i.test(navigator.userAgent) 
                || (window.innerWidth <= mobileBreakpoint);
    
    // Show mobile controls if on mobile
    if (isMobile) {
        document.getElementById('mobile-controls').classList.add('show');
        setupMobileControls();
    }
    
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 100, 500);

    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 15, 30);

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -200;
    directionalLight.shadow.camera.right = 200;
    directionalLight.shadow.camera.top = 200;
    directionalLight.shadow.camera.bottom = -200;
    scene.add(directionalLight);

    // Create track
    createTrack();

    // Create player car
    createPlayerCar();

    // Create AI cars
    createAICars();

    // Create checkpoints
    createCheckpoints();

    // Event listeners
    window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
    window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);
    window.addEventListener('resize', onWindowResize);

    // Start countdown
    startCountdown();

    // Start animation loop
    animate();
}

function createTrack() {
    // Create ground (oval track)
    const groundGeometry = new THREE.PlaneGeometry(300, 300);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Create track surface (oval shape)
    const trackShape = new THREE.Shape();
    const innerRadius = 30;
    const outerRadius = 50;
    
    // Outer oval
    for (let i = 0; i <= 32; i++) {
        const angle = (i / 32) * Math.PI * 2;
        const x = Math.cos(angle) * outerRadius * (1 + Math.abs(Math.sin(angle)) * 0.5);
        const z = Math.sin(angle) * outerRadius;
        if (i === 0) trackShape.moveTo(x, z);
        else trackShape.lineTo(x, z);
    }

    // Inner oval (hole)
    const holePath = new THREE.Path();
    for (let i = 32; i >= 0; i--) {
        const angle = (i / 32) * Math.PI * 2;
        const x = Math.cos(angle) * innerRadius * (1 + Math.abs(Math.sin(angle)) * 0.5);
        const z = Math.sin(angle) * innerRadius;
        if (i === 32) holePath.moveTo(x, z);
        else holePath.lineTo(x, z);
    }
    trackShape.holes.push(holePath);

    const trackGeometry = new THREE.ShapeGeometry(trackShape);
    const trackMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const trackMesh = new THREE.Mesh(trackGeometry, trackMaterial);
    trackMesh.rotation.x = -Math.PI / 2;
    trackMesh.position.y = 0.1;
    trackMesh.receiveShadow = true;
    scene.add(trackMesh);

    track = trackMesh;

    // Create outer walls
    createWalls(outerRadius, true);
    // Create inner walls
    createWalls(innerRadius, false);
}

function createWalls(radius, isOuter) {
    const segments = 64;
    const wallColor = isOuter ? 0xff0000 : 0x0000ff;
    
    for (let i = 0; i < segments; i++) {
        const angle1 = (i / segments) * Math.PI * 2;
        const angle2 = ((i + 1) / segments) * Math.PI * 2;
        
        const x1 = Math.cos(angle1) * radius * (1 + Math.abs(Math.sin(angle1)) * 0.5);
        const z1 = Math.sin(angle1) * radius;
        const x2 = Math.cos(angle2) * radius * (1 + Math.abs(Math.sin(angle2)) * 0.5);
        const z2 = Math.sin(angle2) * radius;
        
        const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(z2 - z1, 2));
        
        const wallGeometry = new THREE.BoxGeometry(length, wallHeight, 1);
        const wallMaterial = new THREE.MeshLambertMaterial({ color: wallColor, transparent: true, opacity: 0.7 });
        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
        
        wall.position.set((x1 + x2) / 2, wallHeight / 2, (z1 + z2) / 2);
        wall.rotation.y = Math.atan2(z2 - z1, x2 - x1);
        wall.castShadow = true;
        
        scene.add(wall);
        walls.push({
            mesh: wall,
            radius: radius,
            angle: (angle1 + angle2) / 2
        });
    }
}

function createPlayerCar() {
    // Create car body
    const bodyGeometry = new THREE.BoxGeometry(3, 1.5, 5);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;

    // Create car top
    const topGeometry = new THREE.BoxGeometry(2.5, 1, 3);
    const topMaterial = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
    const top = new THREE.Mesh(topGeometry, topMaterial);
    top.position.y = 1.25;
    top.position.z = -0.5;
    top.castShadow = true;

    // Create wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 16);
    const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
    
    const wheels = [];
    const wheelPositions = [
        { x: -1.3, y: -0.5, z: 1.5 },
        { x: 1.3, y: -0.5, z: 1.5 },
        { x: -1.3, y: -0.5, z: -1.5 },
        { x: 1.3, y: -0.5, z: -1.5 }
    ];
    
    wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.position.set(pos.x, pos.y, pos.z);
        wheel.rotation.z = Math.PI / 2;
        wheel.castShadow = true;
        wheels.push(wheel);
    });

    // Create car group
    player = new THREE.Group();
    player.add(body);
    player.add(top);
    wheels.forEach(wheel => player.add(wheel));
    
    player.position.set(40, 1, 0);
    player.rotation.y = Math.PI;
    
    scene.add(player);
}

function createAICars() {
    const colors = [0x0000ff, 0x00ff00, 0xffff00, 0xff00ff];
    const startPositions = [
        { x: 35, z: 5 },
        { x: 35, z: -5 },
        { x: 30, z: 0 },
        { x: 30, z: 7 }
    ];

    for (let i = 0; i < 4; i++) {
        const car = createCar(colors[i]);
        car.position.set(startPositions[i].x, 1, startPositions[i].z);
        car.rotation.y = Math.PI;
        
        scene.add(car);
        aiCars.push({
            mesh: car,
            speed: 0,
            targetSpeed: 80 + Math.random() * 40,
            angle: 0,
            currentLap: 1,
            lastCheckpoint: -1
        });
    }
}

function createCar(color) {
    const bodyGeometry = new THREE.BoxGeometry(3, 1.5, 5);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: color });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;

    const topGeometry = new THREE.BoxGeometry(2.5, 1, 3);
    const topMaterial = new THREE.MeshLambertMaterial({ color: color });
    const top = new THREE.Mesh(topGeometry, topMaterial);
    top.position.y = 1.25;
    top.position.z = -0.5;
    top.castShadow = true;

    const wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 16);
    const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
    
    const wheelPositions = [
        { x: -1.3, y: -0.5, z: 1.5 },
        { x: 1.3, y: -0.5, z: 1.5 },
        { x: -1.3, y: -0.5, z: -1.5 },
        { x: 1.3, y: -0.5, z: -1.5 }
    ];
    
    const car = new THREE.Group();
    car.add(body);
    car.add(top);
    
    wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.position.set(pos.x, pos.y, pos.z);
        wheel.rotation.z = Math.PI / 2;
        wheel.castShadow = true;
        car.add(wheel);
    });

    return car;
}

function createCheckpoints() {
    const checkpointCount = 4;
    for (let i = 0; i < checkpointCount; i++) {
        const angle = (i / checkpointCount) * Math.PI * 2;
        checkpoints.push({ angle: angle, passed: false });
    }
}

function startCountdown() {
    const countdownElement = document.getElementById('countdown');
    let count = 3;
    
    countdownElement.textContent = count;
    countdownElement.classList.add('show');
    
    const countInterval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownElement.textContent = count;
            countdownElement.classList.remove('show');
            setTimeout(() => countdownElement.classList.add('show'), 10);
        } else if (count === 0) {
            countdownElement.textContent = 'GO!';
            countdownElement.classList.remove('show');
            setTimeout(() => countdownElement.classList.add('show'), 10);
            raceStarted = true;
        } else {
            countdownElement.classList.remove('show');
            clearInterval(countInterval);
        }
    }, 1000);
}

function updatePlayerCar() {
    if (!raceStarted || raceFinished) return;

    // Acceleration
    if (keys['arrowup'] || keys['w']) {
        playerSpeed = Math.min(playerSpeed + acceleration, maxSpeed);
    }
    
    // Deceleration
    if (keys['arrowdown'] || keys['s']) {
        playerSpeed = Math.max(playerSpeed - acceleration * 1.5, -maxSpeed / 2);
    }
    
    // Natural deceleration
    if (!keys['arrowup'] && !keys['w'] && !keys['arrowdown'] && !keys['s']) {
        if (playerSpeed > 0) {
            playerSpeed = Math.max(playerSpeed - deceleration, 0);
        } else if (playerSpeed < 0) {
            playerSpeed = Math.min(playerSpeed + deceleration, 0);
        }
    }

    // Turning
    if (keys['arrowleft'] || keys['a']) {
        player.rotation.y += turnSpeed * (playerSpeed / maxSpeed);
    }
    if (keys['arrowright'] || keys['d']) {
        player.rotation.y -= turnSpeed * (playerSpeed / maxSpeed);
    }

    // Move forward
    const moveSpeed = playerSpeed * 0.1;
    player.position.x += Math.sin(player.rotation.y) * moveSpeed;
    player.position.z += Math.cos(player.rotation.y) * moveSpeed;

    // Update UI
    document.getElementById('speed-value').textContent = Math.abs(Math.round(playerSpeed));

    // Check collision with walls
    checkWallCollision(player);

    // Check collision with AI cars
    checkCarCollisions();

    // Update camera to follow player
    const cameraDistance = 30;
    const cameraHeight = 15;
    camera.position.x = player.position.x - Math.sin(player.rotation.y) * cameraDistance;
    camera.position.y = player.position.y + cameraHeight;
    camera.position.z = player.position.z - Math.cos(player.rotation.y) * cameraDistance;
    camera.lookAt(player.position);

    // Check lap progress
    checkLapProgress();
}

function updateAICars() {
    if (!raceStarted || raceFinished) return;

    aiCars.forEach(aiCar => {
        // AI follows the track
        const targetRadius = 40; // Middle of the track
        const currentAngle = Math.atan2(aiCar.mesh.position.z, aiCar.mesh.position.x);
        
        // Accelerate to target speed
        if (aiCar.speed < aiCar.targetSpeed) {
            aiCar.speed += 0.3;
        }

        // Move along the oval track
        aiCar.angle += aiCar.speed * 0.0003;
        
        const x = Math.cos(aiCar.angle) * targetRadius * (1 + Math.abs(Math.sin(aiCar.angle)) * 0.5);
        const z = Math.sin(aiCar.angle) * targetRadius;
        
        aiCar.mesh.position.x = x;
        aiCar.mesh.position.z = z;
        
        // Face direction of movement
        const nextAngle = aiCar.angle + 0.1;
        const nextX = Math.cos(nextAngle) * targetRadius * (1 + Math.abs(Math.sin(nextAngle)) * 0.5);
        const nextZ = Math.sin(nextAngle) * targetRadius;
        aiCar.mesh.rotation.y = Math.atan2(nextX - x, nextZ - z) + Math.PI;

        // Check AI lap progress
        checkAILapProgress(aiCar);
    });
}

function checkWallCollision(car) {
    const carPos = car.position;
    const distanceFromCenter = Math.sqrt(carPos.x * carPos.x + carPos.z * carPos.z);
    const angle = Math.atan2(carPos.z, carPos.x);
    const radiusAtAngle = 1 + Math.abs(Math.sin(angle)) * 0.5;
    
    const innerLimit = 30 * radiusAtAngle;
    const outerLimit = 50 * radiusAtAngle;

    if (distanceFromCenter < innerLimit || distanceFromCenter > outerLimit) {
        // Collision! Push car back and reduce speed
        playerSpeed *= 0.5;
        
        if (distanceFromCenter < innerLimit) {
            const pushAngle = Math.atan2(carPos.z, carPos.x);
            car.position.x = Math.cos(pushAngle) * innerLimit;
            car.position.z = Math.sin(pushAngle) * innerLimit;
        } else {
            const pushAngle = Math.atan2(carPos.z, carPos.x);
            car.position.x = Math.cos(pushAngle) * outerLimit;
            car.position.z = Math.sin(pushAngle) * outerLimit;
        }
    }
}

function checkCarCollisions() {
    aiCars.forEach(aiCar => {
        const dx = player.position.x - aiCar.mesh.position.x;
        const dz = player.position.z - aiCar.mesh.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        if (distance < 4) {
            // Collision! Reduce speeds
            playerSpeed *= 0.7;
            aiCar.speed *= 0.7;
            
            // Push cars apart
            const pushAngle = Math.atan2(dz, dx);
            player.position.x += Math.cos(pushAngle) * 2;
            player.position.z += Math.sin(pushAngle) * 2;
        }
    });
}

function checkLapProgress() {
    const playerAngle = Math.atan2(player.position.z, player.position.x);
    const normalizedAngle = (playerAngle + Math.PI * 2) % (Math.PI * 2);
    
    checkpoints.forEach((checkpoint, index) => {
        const checkpointAngle = checkpoint.angle;
        const angleDiff = Math.abs(normalizedAngle - checkpointAngle);
        
        if (angleDiff < 0.3 && !checkpoint.passed && index === (lastCheckpoint + 1) % checkpoints.length) {
            checkpoint.passed = true;
            lastCheckpoint = index;
            
            // If we passed the last checkpoint, increment lap
            if (index === checkpoints.length - 1) {
                currentLap++;
                document.getElementById('lap-value').textContent = currentLap;
                
                // Reset checkpoints for next lap
                checkpoints.forEach(cp => cp.passed = false);
                lastCheckpoint = -1;
                
                // Check if race is finished
                if (currentLap > maxLaps) {
                    finishRace('You Win!');
                }
            }
        }
    });
}

function checkAILapProgress(aiCar) {
    const normalizedAngle = (aiCar.angle + Math.PI * 2) % (Math.PI * 2);
    
    // Simple lap detection for AI - when they complete a full circle
    if (aiCar.angle > (aiCar.currentLap * Math.PI * 2)) {
        aiCar.currentLap++;
        
        // Check if AI finished
        if (aiCar.currentLap > maxLaps && !raceFinished) {
            finishRace('AI Wins!');
        }
    }
}

function finishRace(result) {
    raceFinished = true;
    const resultElement = document.getElementById('race-result');
    resultElement.textContent = result;
    resultElement.classList.add('show');
}

function animate() {
    requestAnimationFrame(animate);
    
    updatePlayerCar();
    updateAICars();
    
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Start the game when the page loads
window.addEventListener('load', init);
