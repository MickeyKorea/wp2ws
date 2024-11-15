let loadingScreen = document.querySelector(".loadingScreen");

const particlesData = [];
let positions, colors;
let particles;
let pointCloud;
let particlePositions;
let linesMesh;
let group = new THREE.Group();

const maxParticleCount = 1000;
let particleCount = 170;
const r = 2000;
const rHalf = r / 2;

const effectController = {
    showDots: true,
    showLines: true,
    minDistance: 250,
    limitConnections: false,
    maxConnections: 20,
    particleCount: 170
};

let lights = [];
let bg, light;

let moon;
let mercury, venus, earth, mars, jupiter, saturn, saturnRing, uranus, neptune;

let earthTexture1, earthTexture2;
let moonTexture1, moonTexture2;
let mercuryTexture, venusTexture, marsTexture,
    jupiterTexture, saturnTexture, saturnRingTexture,
    uranusTexture, neptuneTexture;

const ROTATION_SPEEDS = {
    //EARTH_BASE: 0.002

    // Other planets relative to Earth's rotation
    // (EARTH_BASE * 24 hours / planet's day length)
    MERCURY: 0.002 * (24 / (58.6 * 24)),      // 58.6 Earth days
    VENUS: -0.002 * (24 / (243 * 24)),        // 243 Earth days (negative for retrograde)
    MARS: 0.002 * (24 / 24.6),                // 24.6 hours
    JUPITER: 0.002 * (24 / 9.9),              // 9.9 hours
    SATURN: 0.002 * (24 / 10.7),              // 10.7 hours
    URANUS: 0.002 * (24 / 17.2),              // 17.2 hours
    NEPTUNE: 0.002 * (24 / 16.1)
};

class ConstellationBox {
    constructor() {
        this.stars = null;
        this.starGeo = new THREE.BufferGeometry();
        this.starVertices = [];
    }

    setup() {
        // Starry background setup
        for (let i = 0; i < 4000; i++) {
            let star = new THREE.Vector3(
                Math.random() * 3000 - 1000,
                Math.random() * 3000 - 1000,
                Math.random() * 3000 - 1000
            );

            // Random initial velocity between -0.01 and 0.01
            star.velocity = (Math.random() - 0.5) * 0.02;

            // Random acceleration up to 0.0004
            star.acceleration = Math.random() * 0.0004;

            // Randomly pick one of the two directions (up or down)
            star.direction = Math.random() > 0.5 ? 1 : -1;

            this.starVertices.push(star);
        }

        const starPositions = [];
        this.starVertices.forEach(star => {
            starPositions.push(star.x, star.y, star.z);
        });
        this.starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));


        const sprite = new THREE.TextureLoader().load('assets/star.png');
        const starMaterial = new THREE.PointsMaterial({
            color: 0xaaaaaa,
            size: 3.5,
            map: sprite
        });

        this.stars = new THREE.Points(this.starGeo, starMaterial);
        //scene.add(this.stars);
        group.add(this.stars);
    }

    update() {
        // Starry background update
        for (let i = 0; i < this.starVertices.length; i++) {
            const star = this.starVertices[i];
            star.velocity += star.acceleration * star.direction;
            star.y -= star.velocity;

            if (star.y < -1000 || star.y > 1000) {
                // Reset the star's position
                // star.y = Math.random() * 600 - 300;
                star.y = Math.random() * 2000 - 1000;
                // Reset the star's velocity
                star.velocity = (Math.random() - 0.5) * 0.02;
                // Reset the star's acceleration
                star.acceleration = Math.random() * 0.0004;
                // Optionally, you could also reassign a random direction
                star.direction = Math.random() > 0.5 ? 1 : -1;
            }

            const idx = i * 3;
            this.starGeo.attributes.position.array[idx] = star.x;
            this.starGeo.attributes.position.array[idx + 1] = star.y;
            this.starGeo.attributes.position.array[idx + 2] = star.z;
        }

        this.starGeo.attributes.position.needsUpdate = true;
        this.stars.rotation.y += 0.0002;
    }
}

// Using the ConstellationBox class for the starry background
const constellationBox = new ConstellationBox();

function setupThree() {
    // WebXR
    setupWebXR();

    constellationBox.setup();

    // crate group to control the particles and lines together

    scene.add(group);
    // group.position.z = -400;

    // point
    const pMaterial = new THREE.PointsMaterial({
        color: 0xFFFFFF,
        size: 1,
        blending: THREE.AdditiveBlending,
        transparent: true,
        sizeAttenuation: false
    });

    particles = new THREE.BufferGeometry();
    particlePositions = new Float32Array(maxParticleCount * 3);

    for (let i = 0; i < maxParticleCount; i++) {
        const x = Math.random() * r - r / 2;
        const y = Math.random() * r - r / 2;
        const z = Math.random() * r - r / 2;

        particlePositions[i * 3] = x;
        particlePositions[i * 3 + 1] = y;
        particlePositions[i * 3 + 2] = z;

        // add it to the geometry
        particlesData.push({
            velocity: new THREE.Vector3(- 1 + Math.random() * 2, - 1 + Math.random() * 2, - 1 + Math.random() * 2),
            numConnections: 0
        });
    }

    particles.setDrawRange(0, particleCount);
    particles.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3).setUsage(THREE.DynamicDrawUsage));

    // create the particle system
    pointCloud = new THREE.Points(particles, pMaterial);
    group.add(pointCloud);


    // lines
    const segments = maxParticleCount * maxParticleCount;

    const geometry = new THREE.BufferGeometry();
    positions = new Float32Array(segments * 3);
    colors = new Float32Array(segments * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage));

    geometry.computeBoundingSphere();

    geometry.setDrawRange(0, 0);

    const material = new THREE.LineBasicMaterial({
        //have to use vertexColors here instead of just color here to use the color attribute
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthTest: true,
        depthWrite: true,
        transparent: true
    });

    linesMesh = new THREE.LineSegments(geometry, material);
    group.add(linesMesh);

    // initGUI();
    // gui.close();

    //hdi background
    bg = getIcosahedron();

    //camera height gui
    // let cameraControls = gui.addFolder('Camera Position');
    // cameraControls.add(camera.position, 'z', 0, 1000).name('Height').listen().step(1);
    // cameraControls.open();

    // lights
    //ambient light
    const ambiLight = new THREE.AmbientLight(0xFFFFFF, 2.5);
    scene.add(ambiLight);

    //ambient light gui
    // let folderAmbiLight = gui.addFolder("AmbientLight");
    // folderAmbiLight.add(ambiLight, "visible");
    // folderAmbiLight.add(ambiLight, "intensity", 0.0, 5.0);
    // folderAmbiLight.add(ambiLight.color, "r", 0.0, 1.0);
    // folderAmbiLight.add(ambiLight.color, "g", 0.0, 1.0);
    // folderAmbiLight.add(ambiLight.color, "b", 0.0, 1.0);

    light = getLight();
    light.position.set(0, 5, 10);

    //Mercury
    mercuryTexture = new THREE.TextureLoader().load('assets/mercury.jpg');
    mercuryTexture.colorSpace = THREE.SRGBColorSpace;

    mercury = getMercury();
    mercury.scale.set(30, 30, 30);
    mercury.position.x = -60;
    mercury.position.y = 0;
    mercury.position.z = 1220;
    group.add(mercury);

    //Venus
    venusTexture = new THREE.TextureLoader().load('assets/venus.jpg');
    venusTexture.colorSpace = THREE.SRGBColorSpace;

    venus = getVenus();
    venus.scale.set(30, 30, 30);
    venus.position.x = -75;
    venus.position.y = 10;
    venus.position.z = 1100;
    group.add(venus);

    //Earth
    earthTexture1 = new THREE.TextureLoader().load('assets/earth_dis.png');
    earthTexture2 = new THREE.TextureLoader().load('assets/earth.jpg');
    earthTexture1.colorSpace = THREE.SRGBColorSpace;
    earthTexture2.colorSpace = THREE.SRGBColorSpace;

    earth = getEarth();
    earth.scale.set(30, 30, 30);
    earth.position.x = -30;
    earth.position.y = 33;
    earth.position.z = 1000;
    group.add(earth);

    //Moon
    moonTexture2 = new THREE.TextureLoader().load('assets/moon.jpg');
    moonTexture2.colorSpace = THREE.SRGBColorSpace;
    const moonGeometry = new THREE.SphereGeometry(0.3, 360, 360);

    const moonMaterial = new THREE.MeshStandardMaterial({
        side: THREE.DoubleSide,
        map: moonTexture2,
    });
    const moon = new THREE.Mesh(moonGeometry, moonMaterial);
    earth.add(moon);
    moon.position.x = 1.5;
    moon.rotation.x += 0.001;

    //Mars
    marsTexture = new THREE.TextureLoader().load('assets/mars.jpg');
    marsTexture.colorSpace = THREE.SRGBColorSpace;

    mars = getMars();
    mars.scale.set(30, 30, 30);
    mars.position.x = -20;
    mars.position.y = -50;
    mars.position.z = 900;
    group.add(mars);

    //Junpiter
    jupiterTexture = new THREE.TextureLoader().load('assets/jupiter.jpg');
    jupiterTexture.colorSpace = THREE.SRGBColorSpace;

    jupiter = getJupiter();
    jupiter.scale.set(30, 30, 30);
    jupiter.position.x = 350;
    jupiter.position.y = 30;
    jupiter.position.z = 600;
    group.add(jupiter);

    //Saturn
    saturnTexture = new THREE.TextureLoader().load('assets/saturn.jpg');
    saturnRingTexture = new THREE.TextureLoader().load('assets/saturn_ring.png');
    saturnTexture.colorSpace = THREE.SRGBColorSpace;
    saturnRingTexture.colorSpace = THREE.SRGBColorSpace;

    saturn = getSaturn();
    saturn.scale.set(30, 30, 30);
    saturn.position.x = 300;
    saturn.position.y = 20;
    saturn.position.z = 0;
    group.add(saturn);

    //Uranus
    uranusTexture = new THREE.TextureLoader().load('assets/uranus.jpg');
    uranusTexture.colorSpace = THREE.SRGBColorSpace;

    uranus = getUranus();
    uranus.scale.set(30, 30, 30);
    uranus.position.x = -200;
    uranus.position.y = -30;
    uranus.position.z = -100;
    group.add(uranus);

    //Neptune
    neptuneTexture = new THREE.TextureLoader().load('assets/neptune.jpg');
    neptuneTexture.colorSpace = THREE.SRGBColorSpace;

    neptune = getNeptune();
    neptune.scale.set(30, 30, 30);
    neptune.position.x = -500;
    neptune.position.y = -80;
    neptune.position.z = -230;
    group.add(neptune);
}

//hdr background mapping
let hdr;
function getIcosahedron() {
    hdr = new RGBELoader().load(
        // "./assets/space-xr.hdr",
        // "https://cdn.glitch.me/d1258780-da78-4d7e-9961-a8cb9ca13efc/space-xr.hdr?v=1731657916851",
        "https://cdn.glitch.me/d1258780-da78-4d7e-9961-a8cb9ca13efc/space.hdr?v=1729681032066",
        () => {
            hdr.mapping = THREE.EquirectangularReflectionMapping;
            loadingScreen.style.display = 'none';
        }
    );

    scene.background = hdr;
    return null;

    // let sphere = getSphere();

    // return mesh;
}

let movementSpeed = 1;

function updateThree() {
    constellationBox.update();

    //movement
    if (triggerPressed || keyIsPressed) {
        movementSpeed++;

    } else {
        movementSpeed = lerp(movementSpeed, 1, 0.01);
    }

    // Controller movement
    let speed = Math.abs(movementSpeed) ** 1.75;

    if (group && group.position.z <= 1900) {
        group.position.z += speed * 0.0001;
    } else {
        if (movementSpeed > 0) {
            movementSpeed *= -1;
        }
        group.position.z += speed * 0.0001;
    }

    if (group.position.z >= 1900) {
        movementSpeed *= -1;
        group.position.z = -600;
    }

    //wiggle effect
    group.rotation.z = sin(frame * 0.01) * 0.01;
    group.rotation.y = sin(frame * 0.015) * 0.01;

    for (let l of lights) {
        // l.move();
        l.update();
    }

    earth.rotation.x += 0.002;
    earth.rotation.z += 0.002;
    earth.rotateY(0.002);
    // moon.rotation.x += 0.001;

    updatePlanetRotations();

    let vertexpos = 0;
    let colorpos = 0;
    let numConnected = 0;

    //constellation line connection
    //https://editor.p5js.org/setapolo/full/sqbnCzAay + Prof. Moon
    for (let i = 0; i < particleCount; i++)
        particlesData[i].numConnections = 0;

    for (let i = 0; i < particleCount; i++) {

        // get the particle
        const particleData = particlesData[i];

        particlePositions[i * 3] += particleData.velocity.x;
        particlePositions[i * 3 + 1] += particleData.velocity.y;
        particlePositions[i * 3 + 2] += particleData.velocity.z;

        if (particlePositions[i * 3 + 1] < - rHalf || particlePositions[i * 3 + 1] > rHalf)
            particleData.velocity.y = - particleData.velocity.y;

        if (particlePositions[i * 3] < - rHalf || particlePositions[i * 3] > rHalf)
            particleData.velocity.x = - particleData.velocity.x;

        if (particlePositions[i * 3 + 2] < - rHalf || particlePositions[i * 3 + 2] > rHalf)
            particleData.velocity.z = - particleData.velocity.z;

        if (effectController.limitConnections && particleData.numConnections >= effectController.maxConnections)
            continue;

        // Check collision
        for (let j = i + 1; j < particleCount; j++) {

            const particleDataB = particlesData[j];
            if (effectController.limitConnections && particleDataB.numConnections >= effectController.maxConnections)
                continue;

            const dx = particlePositions[i * 3] - particlePositions[j * 3];
            const dy = particlePositions[i * 3 + 1] - particlePositions[j * 3 + 1];
            const dz = particlePositions[i * 3 + 2] - particlePositions[j * 3 + 2];
            //pythagoras theorem to find distance between two points
            //logic: if the distance between two points is less than the minimum distance, change the alpha value of the pre-connected lines to make them visible
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (dist < effectController.minDistance) {

                particleData.numConnections++;
                particleDataB.numConnections++;

                //alpha value is based on distance
                const alpha = 1.0 - dist / effectController.minDistance;

                positions[vertexpos++] = particlePositions[i * 3];
                positions[vertexpos++] = particlePositions[i * 3 + 1];
                positions[vertexpos++] = particlePositions[i * 3 + 2];

                positions[vertexpos++] = particlePositions[j * 3];
                positions[vertexpos++] = particlePositions[j * 3 + 1];
                positions[vertexpos++] = particlePositions[j * 3 + 2];

                colors[colorpos++] = alpha;
                colors[colorpos++] = alpha;
                colors[colorpos++] = alpha;

                colors[colorpos++] = alpha;
                colors[colorpos++] = alpha;
                colors[colorpos++] = alpha;

                numConnected++;
            }
        }
    }

    linesMesh.geometry.setDrawRange(0, numConnected * 2);
    linesMesh.geometry.attributes.position.needsUpdate = true;
    linesMesh.geometry.attributes.color.needsUpdate = true;

    pointCloud.geometry.attributes.position.needsUpdate = true;
}

//planet models
function getMercury() {
    const geometry = new THREE.SphereGeometry(0.2, 360, 360);
    const material = new THREE.MeshStandardMaterial({
        side: THREE.DoubleSide,
        map: mercuryTexture,
    });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
    return sphere;
}

function getVenus() {
    const geometry = new THREE.SphereGeometry(0.949, 360, 360);
    const material = new THREE.MeshStandardMaterial({
        side: THREE.DoubleSide,
        map: venusTexture,
    });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
    return sphere;

}

function getEarth() {
    const geometry = new THREE.SphereGeometry(1, 360, 360);
    //earth displacement mapping
    const material = new THREE.MeshStandardMaterial({
        side: THREE.DoubleSide,
        map: earthTexture2,
        displacementMap: earthTexture1,
        displacementScale: 0.02,
        // envMap: hdr
    });
    const sphere = new THREE.Mesh(geometry, material);
    return sphere;
}

function getMars() {
    const geometry = new THREE.SphereGeometry(0.6, 360, 360);

    //mars displacement mapping
    const material = new THREE.MeshStandardMaterial({
        side: THREE.DoubleSide,
        map: marsTexture,
    });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
    return sphere;
}

function getJupiter() {
    const geometry = new THREE.SphereGeometry(5, 360, 360);

    const material = new THREE.MeshStandardMaterial({
        side: THREE.DoubleSide,
        map: jupiterTexture,
    });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
    return sphere;
}

function getSaturn() {
    const geometry = new THREE.SphereGeometry(7, 360, 360);
    const material = new THREE.MeshStandardMaterial({
        side: THREE.DoubleSide,
        map: saturnTexture,
    });
    const sphere = new THREE.Mesh(geometry, material);

    saturnRingTexture.wrapS = THREE.RepeatWrapping;
    saturnRingTexture.wrapT = THREE.RepeatWrapping;
    saturnRingTexture.repeat.set(4, 1);

    // Add Saturn's rings
    const ringGeometry = new THREE.TorusGeometry(10, 1, 3, 128);
    const ringMaterial = new THREE.MeshStandardMaterial({
        side: THREE.DoubleSide,
        map: saturnRingTexture,
        color: 0xffffff,
        transparent: false,
        depthWrite: true,
        depthTest: true,
        blending: THREE.AdditiveBlending
    });
    saturnRing = new THREE.Mesh(ringGeometry, ringMaterial);
    sphere.add(saturnRing);
    saturnRing.rotation.x = Math.PI / 2.5;
    saturnRing.rotation.y = Math.PI / 1.2;
    saturnRing.position.z = 0.01;

    scene.add(sphere);
    return sphere;
}

function getUranus() {
    const geometry = new THREE.SphereGeometry(4.007, 360, 360);
    const material = new THREE.MeshStandardMaterial({
        side: THREE.DoubleSide,
        map: uranusTexture,
    });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
    return sphere;
}

function getNeptune() {
    const geometry = new THREE.SphereGeometry(3.883, 360, 360);
    const material = new THREE.MeshStandardMaterial({
        side: THREE.DoubleSide,
        map: neptuneTexture,
    });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
    return sphere;
}

function updatePlanetRotations() {
    mercury.rotateY(ROTATION_SPEEDS.MERCURY);
    venus.rotateY(ROTATION_SPEEDS.VENUS);
    mars.rotateY(ROTATION_SPEEDS.MARS);
    jupiter.rotateY(ROTATION_SPEEDS.JUPITER);
    saturn.rotateY(ROTATION_SPEEDS.SATURN);

    // Uranus (tilted rotation)
    uranus.rotation.x = Math.PI / 2;  // 98-degree tilt
    uranus.rotateY(ROTATION_SPEEDS.URANUS);

    neptune.rotateY(ROTATION_SPEEDS.NEPTUNE);
}

function getLight() {
    const light = new THREE.DirectionalLight(0xfff0dd, 1);
    scene.add(light);
    return light;
}

// function initGUI() {
//     let folderStars = gui.addFolder("Constellation");

//     folderStars.add(effectController, 'showDots').name('Show Stars').onChange(function (value) {
//         pointCloud.visible = value;
//     });
//     folderStars.add(effectController, 'showLines').name('Show Lines').onChange(function (value) {
//         linesMesh.visible = value;

//     });
//     folderStars.add(effectController, 'minDistance', 10, 300).name('Min Distance');
//     folderStars.add(effectController, 'limitConnections').name('Limit Connections');
//     folderStars.add(effectController, 'maxConnections', 0, 30, 1).name('Max Connections');
//     folderStars.add(effectController, 'particleCount', 0, maxParticleCount, 1).name('Particle Count').onChange(function (value) {
//         particleCount = value;
//         particles.setDrawRange(0, particleCount);
//     });
//     // folderStars.open();
// }


//WEB XR
let raycaster;

const intersected = [];
const tempMatrix = new THREE.Matrix4();

function getIntersections(controller) {

    controller.updateMatrixWorld();

    tempMatrix.identity().extractRotation(controller.matrixWorld);

    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, - 1).applyMatrix4(tempMatrix);

    return raycaster.intersectObjects(group.children, false);

}

function intersectObjects(controller) {

    // Do not highlight in mobile-ar

    if (controller.userData.targetRayMode === 'screen') return;

    // Do not highlight when already selected

    if (controller.userData.selected !== undefined) return;

    const line = controller.getObjectByName('line');
    const intersections = getIntersections(controller);

    if (intersections.length > 0) {
        const intersection = intersections[0];

        const object = intersection.object;
        object.material.emissive.r = 1;
        intersected.push(object);

        line.scale.z = intersection.distance;
    } else {
        line.scale.z = 5;
    }
}

function cleanIntersected() {
    while (intersected.length) {
        const object = intersected.pop();
        object.material.emissive.r = 0;
    }
}