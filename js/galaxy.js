let scene, camera, renderer;
let particles, particlePositions;
let clock = new THREE.Clock();
let explosionSystems = [];

initGalaxy();
animate();

function initGalaxy() {
    scene = new THREE.Scene();

    const w = window.innerWidth;
    const h = window.innerHeight;

    camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 2000);
    camera.position.z = 450;

    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById("galaxy"),
        antialias: true
    });
    renderer.setSize(w, h);
    renderer.setPixelRatio(devicePixelRatio);

    // ======================
    // Main particle system
    // ======================
    const count = 5000;
    particlePositions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        let r = 500 * Math.random();
        let angle = Math.random() * Math.PI * 2;
        let height = (Math.random() - 0.5) * 300;

        particlePositions[i * 3] = r * Math.cos(angle);
        particlePositions[i * 3 + 1] = height;
        particlePositions[i * 3 + 2] = r * Math.sin(angle);
    }


    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));

    const colors = [];
    for (let i = 0; i < count; i++) {
        const t = Math.random();  
        const color = new THREE.Color();
        color.setHSL(0.05 + 0.08 * t, 1, 0.5 + 0.3 * Math.random());
        colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

    const sprite = new THREE.TextureLoader().load(
        "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/sprites/circle.png"
    );
    const material = new THREE.PointsMaterial({
        size: 2.1,
        sizeAttenuation: true,
        vertexColors: true,
        map: sprite, 
        transparent: true,
        alphaTest: 0.1
    });



    particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // 鼠标点击触发爆炸
    window.addEventListener("click", (e) => createExplosion(e.clientX, e.clientY));

    window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// ======================
// Explosion system
// ======================
function createExplosion(x, y) {
    let vector = new THREE.Vector3(
        (x / window.innerWidth) * 2 - 1,
        -(y / window.innerHeight) * 2 + 1,
        0.5
    );
    vector.unproject(camera);

    let dir = vector.sub(camera.position).normalize();
    let distance = (Math.random() * 100) + 200;
    let pos = camera.position.clone().add(dir.multiplyScalar(distance));

    const count = 300;
    const geo = new THREE.BufferGeometry();
    const arr = new Float32Array(count * 3);
    const vel = [];

    for (let i = 0; i < count; i++) {
        arr[i * 3] = pos.x;
        arr[i * 3 + 1] = pos.y;
        arr[i * 3 + 2] = pos.z;

        vel.push(
            (Math.random() - 0.5) * 3,
            (Math.random() - 0.5) * 3,
            (Math.random() - 0.5) * 3
        );
    }

    geo.setAttribute("position", new THREE.BufferAttribute(arr, 3));


    const system = new THREE.Points(geo, mat);
    system.velocities = vel;
    system.life = 1.0;

    explosionSystems.push(system);
    scene.add(system);
}

function animateExplosion(dt) {
    for (let i = explosionSystems.length - 1; i >= 0; i--) {
        let sys = explosionSystems[i];
        const positions = sys.geometry.attributes.position.array;

        for (let j = 0; j < sys.velocities.length; j += 3) {
            positions[j] += sys.velocities[j] * dt * 30;
            positions[j + 1] += sys.velocities[j + 1] * dt * 30;
            positions[j + 2] += sys.velocities[j + 2] * dt * 30;
        }

        sys.geometry.attributes.position.needsUpdate = true;
        sys.life -= dt;

        if (sys.life <= 0) {
            scene.remove(sys);
            explosionSystems.splice(i, 1);
        }
    }
}

// ======================
// Animation loop
// ======================
function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();

    particles.rotation.y += dt * 0.05;

    animateExplosion(dt);

    renderer.render(scene, camera);
}
