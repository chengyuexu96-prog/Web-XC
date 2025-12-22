// --- 1. 初始化 Swiper 轮播图 ---
if (typeof Swiper !== 'undefined') {
  new Swiper(".mySwiper", {
    effect: "coverflow",
    grabCursor: true,
    centeredSlides: true,
    slidesPerView: "auto",
    loop: true,
    coverflowEffect: {
      rotate: 50,
      stretch: 0,
      depth: 100,
      modifier: 1,
      slideShadows: true,
    },
    pagination: { el: ".swiper-pagination", clickable: true },
    navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" },
  });
}

// --- 2. 页面加载逻辑 ---
document.addEventListener('DOMContentLoaded', () => {
  if (typeof loadResources === 'function') loadResources();
  else loadResources();
});

// --- 3. 搜索与加载逻辑 ---
async function loadResources() {
  const searchInput = document.getElementById('searchInput');
  const keyword = searchInput ? searchInput.value.trim().toLowerCase() : '';
  const bookContainer = document.getElementById('book-container');

  // A. 前端筛选静态卡片
  const staticCards = document.querySelectorAll('.resource-card:not(.db-item)');
  staticCards.forEach(card => {
    const titleEl = card.querySelector('.resource-title');
    const descEl = card.querySelector('.resource-desc');
    const title = titleEl ? titleEl.innerText.toLowerCase() : '';
    const desc = descEl ? descEl.innerText.toLowerCase() : '';
    if (title.includes(keyword) || desc.includes(keyword)) card.style.display = 'block';
    else card.style.display = 'none';
  });

  // B. 后端查询
  if (!bookContainer) return;
  const oldDbItems = bookContainer.querySelectorAll('.db-item');
  oldDbItems.forEach(el => el.remove());

  try {
    const res = await fetch(`/api/resources?type=book&search=${encodeURIComponent(keyword)}`);
    const json = await res.json();
    if (json.success && json.data.length > 0) {
      json.data.forEach(item => {
        const cardHtml = `
          <div class="resource-card db-item">
            <div class="resource-poster-box">
              <a href="${item.link_url}" target="_blank">
                <img src="${item.image_path}" class="resource-poster" alt="${item.title}">
              </a>
            </div>
            <h5 class="resource-title">${item.title}</h5>
            <p class="resource-desc">${item.description}</p>
            <a href="${item.link_url}" target="_blank" class="small text-decoration-none" style="color: var(--gold-primary);">查看详情 <i class="bi bi-arrow-right"></i></a>
          </div>`;
        bookContainer.insertAdjacentHTML('beforeend', cardHtml);
      });
    }
  } catch (err) {
    console.error('搜索失败:', err);
  }
}

// --- 4. 资源上传逻辑 ---
async function handleUpload(e) {
  e.preventDefault();
  const user = localStorage.getItem('porcelain_user');
  if(!user) {
    alert('请先登录后参与共建！');
    window.location.href = '/login.html';
    return;
  }

  const form = document.getElementById('resourceForm');
  const formData = new FormData(form);

  try {
    const btn = form.querySelector('button');
    const oldText = btn.innerHTML;
    btn.disabled = true; btn.innerHTML = '正在上传...';

    const res = await fetch('/api/resources', { method: 'POST', body: formData });
    const json = await res.json();

    if(json.success) {
      alert('收录成功！');
      form.reset();
      loadResources();
    } else {
      alert(json.message);
    }
    btn.disabled = false; btn.innerHTML = oldText;
  } catch (err) {
    console.error(err);
    alert('网络错误');
  }
}
