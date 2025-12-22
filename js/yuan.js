// 1. 自定义光标
const cursorY = document.getElementById('cursor');
if (cursorY) {
  document.addEventListener('mousemove', (e) => {
    cursorY.style.left = e.clientX + 'px';
    cursorY.style.top = e.clientY + 'px';
  });
  document.querySelectorAll('a, .cobalt-card, .lens-wrapper, .shape-card').forEach(el => {
    el.addEventListener('mouseenter', () => cursorY.classList.add('hovered'));
    el.addEventListener('mouseleave', () => cursorY.classList.remove('hovered'));
  });
}

// 2. 滚动显现
const yuanObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('active');
  });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal-up').forEach(el => yuanObserver.observe(el));

// 3. 铁锈斑放大镜交互
const lens = document.getElementById('lens');
if (lens) {
  lens.addEventListener('mousemove', (e) => {
    const rect = lens.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * 100;
    const y = (e.clientY - rect.top) / rect.height * 100;
    lens.style.backgroundSize = '200%';
    lens.style.backgroundPosition = `${x}% ${y}%`;
  });
  lens.addEventListener('mouseleave', () => {
    lens.style.backgroundSize = '100%';
    lens.style.backgroundPosition = 'center';
  });
}

// 4. 横向滚动辅助
const shapeScroll = document.getElementById('shapeScroll');
if (shapeScroll) {
  shapeScroll.addEventListener('wheel', (evt) => {
    evt.preventDefault();
    shapeScroll.scrollLeft += evt.deltaY;
  });
}
