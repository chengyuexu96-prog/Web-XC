/* 导航滚动变色 */
window.addEventListener('scroll', () => {
  const nav = document.querySelector('.navbar');
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 50);
});

/* 元素进入视口触发动画 */
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('active');
      observer.unobserve(e.target);
    }
  });
}, { threshold: .15, rootMargin: '0px' });

document.querySelectorAll('.reveal-item').forEach(el => observer.observe(el));

// 图鉴（新闻）通过 AJAX 加载并分页显示，每次 3 条
(function() {
  const NEWS_URL = 'news.json';
  const BATCH = 3;
  let data = [];
  let index = 0;
  const row = document.getElementById('newsCardsRow');
  const btn = document.getElementById('loadMoreBtn');

  function cardHTML(item) {
    const img = item.img || item.image || item.imgSrc || 'media/news-placeholder.png';
    const title = item.title || item.name || '';
    const intro = item.introduction || item.excerpt || item.summary || '';
    const time = item.time || item.date || '';
    return `
      <div class="col-md-4 mb-4 d-flex">
        <div class="heritage-card reveal-item w-100">
          <div class="heritage-img-wrapper">
            <img src="${img}" alt="${title}">
          </div>
          <div class="card-body p-4">
            <div>
              <h5>${title}</h5>
              <p class="text-muted mt-2 small">${intro}</p>
            </div>
            <div class="mt-3 d-flex justify-content-between align-items-center">
              <span class="badge-dynasty">${time}</span>
              <a href="${item.url || '#'}" class="btn btn-outline-gold btn-sm" target="_blank" rel="noopener">查看更多</a>
            </div>
          </div>
        </div>
      </div>`;
  }

  function renderBatch() {
    if (!data.length) return;
    const slice = data.slice(index, index + BATCH);
    if (slice.length === 0) {
      btn.style.display = 'none';
      return;
    }
    row.insertAdjacentHTML('beforeend', slice.map(cardHTML).join(''));
    // 让新插入的 reveal-item 被 observer 监听以触发动画
    document.querySelectorAll('#newsCardsRow .reveal-item').forEach(el => {
      if (!el.classList.contains('active')) observer.observe(el);
    });
    index += slice.length;
    if (index >= data.length) btn.style.display = 'none';
  }

  fetch(NEWS_URL).then(res => res.json()).then(json => {
    data = Array.isArray(json) ? json : (json.items || []);
    renderBatch();
  }).catch(err => {
    console.error('加载 news.json 失败：', err);
    if (row) row.innerHTML = '<div class="col-12 text-center text-muted">无法加载内容</div>';
    if (btn) btn.style.display = 'none';
  });

  if (btn) btn.addEventListener('click', renderBatch);
})();
