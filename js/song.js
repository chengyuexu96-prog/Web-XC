// 1. 入场动画 (Intersection Observer)
const songObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('active');
  });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal-up').forEach(el => songObserver.observe(el));

// 2. 显微镜交互逻辑
const container = document.getElementById('microScope');
if (container) {
  const img = container.querySelector('.zoom-img');
  container.addEventListener('mousemove', function(e) {
    const rect = container.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    img.style.transformOrigin = `${x * 100}% ${y * 100}%`;
    img.style.transform = 'scale(2)';
  });
  container.addEventListener('mouseleave', function() {
    img.style.transform = 'scale(1)';
    img.style.transformOrigin = 'center center';
  });
}
