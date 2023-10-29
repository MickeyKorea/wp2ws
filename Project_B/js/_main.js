const particlesData = [];
let positions, colors;
let particles;
let pointCloud;
let particlePositions;
let linesMesh;

const maxParticleCount = 1000;
let particleCount = 50;
const r = 650;
const rHalf = r / 2;

const effectController = {
    showDots: true,
    showLines: true,
    minDistance: 130,
    limitConnections: false,
    maxConnections: 20,
    particleCount: 100
};

let lights = [];
//texture for Earth and its displacement(to make it look more 3d)
let bg, light;
let earth;
let texture1, texture2;

class ConstellationBox {
    constructor() {
        this.stars = null;
        this.starGeo = new THREE.BufferGeometry();
        this.starVertices = [];
    }

    setup() {
        // Starry background setup
        //https://redstapler.co/space-warp-background-effect-three-js/
        for (let i = 0; i < 4000; i++) {
            let star = new THREE.Vector3(
                Math.random() * 600 - 300,
                Math.random() * 600 - 300,
                Math.random() * 600 - 300
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
            size: 1,
            map: sprite
        });

        this.stars = new THREE.Points(this.starGeo, starMaterial);
        scene.add(this.stars);
    }

    update() {
        // Starry background update
        for (let i = 0; i < this.starVertices.length; i++) {
            const star = this.starVertices[i];
            star.velocity += star.acceleration * star.direction;
            star.y -= star.velocity;

            if (star.y < -500 || star.y > 500) {
                // Reset the star's position
                star.y = Math.random() * 600 - 300;
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
    constellationBox.setup();

    // crate group to control the particles and lines together
    group = new THREE.Group();
    scene.add(group);

    // point
    const pMaterial = new THREE.PointsMaterial({
        color: 0xFFFFFF,
        size: 2,
        blending: THREE.AdditiveBlending,
        transparent: true,
        sizeAttenuation: false
    });

    particles = new THREE.BufferGeometry();
    particlePositions = new Float32Array(maxParticleCount * 3);

    for (let i = 0; i < maxParticleCount; i++) {

        const x = Math.random() * r - r / 2.5;
        const y = Math.random() * r - r / 2.5;
        const z = Math.random() * r - r / 2.5;

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
        transparent: true
    });

    linesMesh = new THREE.LineSegments(geometry, material);
    group.add(linesMesh);

    initGUI();


    //hdi background
    bg = getIcosahedron();

    //camera height gui
    let cameraControls = gui.addFolder('Camera Position');
    cameraControls.add(camera.position, 'z', 70, 1000).name('Height').listen().step(1);
    cameraControls.open();

    // lights
    //ambient light
    const ambiLight = new THREE.AmbientLight(0xFFFFFF, 2.5);
    scene.add(ambiLight);

    //ambient light gui
    let folderAmbiLight = gui.addFolder("AmbientLight");
    folderAmbiLight.add(ambiLight, "visible");
    folderAmbiLight.add(ambiLight, "intensity", 0.0, 5.0);
    folderAmbiLight.add(ambiLight.color, "r", 0.0, 1.0);
    folderAmbiLight.add(ambiLight.color, "g", 0.0, 1.0);
    folderAmbiLight.add(ambiLight.color, "b", 0.0, 1.0);

    light = getLight();
    light.position.set(0, 5, 10);

    //Earth
    texture1 = new THREE.TextureLoader().load('assets/earth_dis.png');
    texture2 = new THREE.TextureLoader().load('assets/earth.jpg');
    texture1.colorSpace = THREE.SRGBColorSpace;
    texture2.colorSpace = THREE.SRGBColorSpace;

    earth = getSphere();
    earth.scale.set(30, 30, 30);
}

//hdr background mappin
let hdr;
function getIcosahedron() {
    hdr = new RGBELoader().load(
        "assets/space.hdr",
        () => {
            hdr.mapping = THREE.EquirectangularReflectionMapping;
        }
    );

    const geometry = new THREE.IcosahedronGeometry(1, 0);
    const material = new THREE.MeshPhysicalMaterial({
        envMap: hdr
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    scene.background = hdr;

    // let sphere = getSphere();

    return mesh;
}

function updateThree() {
    constellationBox.update();

    for (let l of lights) {
        // l.move();
        l.update();
    }

    earth.rotation.x += 0.001;
    earth.rotation.z += 0.001;

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

function getSphere() {
    const geometry = new THREE.SphereGeometry(1, 360, 360);

    //refelction mapping for hdr background
    // const material = new THREE.MeshBasicMaterial({
    //     color: 0xffffff,
    //     envMap: hdr
    // });

    //earth displacement mapping
    const material = new THREE.MeshStandardMaterial({
        side: THREE.DoubleSide,
        map: texture2,
        displacementMap: texture1,
        displacementScale: 0.02,
        // envMap: hdr
    });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
    return sphere;
}

function getLight() {
    const light = new THREE.DirectionalLight(0xfff0dd, 1);
    scene.add(light);
    return light;
}

function initGUI() {
    let folderStars = gui.addFolder("Constellation");

    gui.add(effectController, 'showDots').onChange(function (value) {
        pointCloud.visible = value;
    });
    gui.add(effectController, 'showLines').onChange(function (value) {
        linesMesh.visible = value;

    });
    gui.add(effectController, 'minDistance', 10, 300);
    gui.add(effectController, 'limitConnections');
    gui.add(effectController, 'maxConnections', 0, 30, 1);
    gui.add(effectController, 'particleCount', 0, maxParticleCount, 1).onChange(function (value) {

        particleCount = value;
        particles.setDrawRange(0, particleCount);
    });
}