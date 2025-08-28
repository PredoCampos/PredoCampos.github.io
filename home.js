document.addEventListener("DOMContentLoaded", function () {
    const targetElement = document.querySelector('.absolute-service-list');

    if (!targetElement) {
        console.warn("Elemento para a animação de scroll não encontrado.");
        return;
    }

    const START_Y = 15;
    const END_Y = -45;
    const RANGE_Y = END_Y - START_Y;

    const ANIMATION_START_DISTANCE_FROM_BOTTOM = 1000;
    const ANIMATION_END_DISTANCE_FROM_BOTTOM = 200;
    const ANIMATION_DISTANCE = ANIMATION_START_DISTANCE_FROM_BOTTOM - ANIMATION_END_DISTANCE_FROM_BOTTOM;

    const SMOOTHING_FACTOR = 0.08;

    let currentY = START_Y;
    let targetY = START_Y;
    let isAnimating = false;

    function updateTargetPosition() {
        const scrollTop = window.scrollY;
        const viewportHeight = window.innerHeight;
        const totalHeight = document.documentElement.scrollHeight;

        const distanceFromBottom = totalHeight - (scrollTop + viewportHeight);

        const progressInZone = ANIMATION_START_DISTANCE_FROM_BOTTOM - distanceFromBottom;
        const progress = progressInZone / ANIMATION_DISTANCE;

        const clampedProgress = Math.max(0, Math.min(1, progress));

        targetY = START_Y + (clampedProgress * RANGE_Y);

        if (!isAnimating) {
            isAnimating = true;
            requestAnimationFrame(animate);
        }
    }

    function animate() {
        const delta = targetY - currentY;

        if (Math.abs(delta) < 0.01) {
            currentY = targetY;
            isAnimating = false;
        } else {
            currentY += delta * SMOOTHING_FACTOR;
            requestAnimationFrame(animate);
        }

        targetElement.style.transform = `translateY(${currentY}%)`;
    }

    window.addEventListener('scroll', updateTargetPosition);

    updateTargetPosition();
});