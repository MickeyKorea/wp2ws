//console.log("three.js Version: " + THREE.REVISION);

let container, gui, stats;
let scene, camera, renderer;
let controls;
let time, frame = 0;

function initThree() {
    scene = new THREE.Scene();

    const fov = 90;
    const aspectRatio = window.innerWidth / window.innerHeight;
    const near = 1;
    const far = 3000;
    camera = new THREE.PerspectiveCamera(fov, aspectRatio, near, far);
    camera.position.z = 1300;

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    container = document.getElementById("container-three");
    container.appendChild(renderer.domElement);

    // controls = new OrbitControls(camera, renderer.domElement);
    // controls.enableDamping = true;
    // controls.dampingFactor = 0.05;
    // controls.screenSpacePanning = false;
    // controls.minDistance = 1;
    // controls.maxDistance = 3000;  // Match with far plane
    // controls.maxPolarAngle = Math.PI;

    //gui = new dat.GUI();

    // stats = new Stats();
    // stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    // document.body.appendChild(stats.domElement);

    setupThree();

    animate();
    renderer.setAnimationLoop(animate); // Necessary for WebXR!!!
}

function animate() {
    // requestAnimationFrame(animate);
    //stats.update();
    time = performance.now();
    frame++;

    //controls.update();
    updateThree();

    renderer.render(scene, camera);
}

window.addEventListener("resize", function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});