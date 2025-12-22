let hasClicked = false;

window.addEventListener("click", () => {
    if (hasClicked) return;
    hasClicked = true;

    const positions = particles.geometry.attributes.position;
    const count = positions.count;

    // 粒子收缩动画
    gsap.to(positions.array, {
        duration: 1.8,
        endArray: new Float32Array(count * 3).fill(0),
        ease: "power2.inOut",
        onUpdate: () => {
            positions.needsUpdate = true;
        },
        onComplete: () => fadeToBlack()
    });
});

function fadeToBlack() {
    gsap.to("#black-screen", {
        duration: 0.5,
        opacity: 1,
        ease: "power2.in",
        onComplete: () => {
            window.location.href = "/index2";
        }
    });
}
