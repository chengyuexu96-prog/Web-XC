// 1. 自定义光标
const cursorM = document.getElementById('cursor');
if (cursorM) {
  document.addEventListener('mousemove', (e) => {
    cursorM.style.left = e.clientX + 'px';
    cursorM.style.top = e.clientY + 'px';
  });
  document.querySelectorAll('a, .color-sample, .history-node, .aesthetic-card').forEach(el => {
    el.addEventListener('mouseenter', () => cursorM.classList.add('hovered'));
    el.addEventListener('mouseleave', () => cursorM.classList.remove('hovered'));
  });
}

// 2. Hero 文字入场动画
window.addEventListener('load', () => {
  const spans = document.querySelectorAll('.hero-title span');
  spans.forEach((span, index) => {
    setTimeout(() => {
      span.style.opacity = '1';
      span.style.transform = 'translateY(0)';
    }, 500 + index * 200);
  });
  setTimeout(() => {
    const sub = document.querySelector('.hero-subtitle');
    if (sub) sub.style.opacity = '1';
  }, 1200);
});

// 4. 显微镜
const microWrap = document.getElementById('microScope');
if (microWrap) {
  const microImg = microWrap.querySelector('.micro-img');
  microWrap.addEventListener('mousemove', function(e) {
    const rect = microWrap.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * 100;
    const y = (e.clientY - rect.top) / rect.height * 100;
    microImg.style.transformOrigin = `${x}% ${y}%`;
    microImg.style.transform = 'scale(3)';
  });
  microWrap.addEventListener('mouseleave', () => { microImg.style.transform = 'scale(1)'; });
}

// 5. 滚动显现
const mingObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => { if(entry.isIntersecting) entry.target.classList.add('active'); });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal-up').forEach(el => mingObserver.observe(el));
