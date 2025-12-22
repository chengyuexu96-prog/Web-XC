// community.js - expects `currentUser` injected in the EJS before this script

let detailModalInstance = null;
let currentPostId = null, currentPostUserId = null;

async function openDetail(postId) {
  currentPostId = postId;
  const uid = currentUser ? currentUser.id : '';
  const res = await fetch(`/api/community/posts/${postId}?userId=${uid}`);
  const json = await res.json();
  if(!json.success) return;
  const { post, comments, isLiked, isFavorited, isFollowing } = json.data;
  currentPostUserId = post.user_id;
  const safeText = (v) => v == null ? '' : v;
  const setElText = (id, val) => { const el = document.getElementById(id); if(el) el.innerText = safeText(val); };
  setElText('detailUsername', post.username);
  setElText('detailTitle', post.title);
  setElText('detailContent', post.content);
  setElText('likeCount', post.likes_count);
  setElText('commentTotal', (comments || []).length);

  if(post.user_real_avatar) {
    const img = document.getElementById('detailAvatarImg');
    if(img) { img.src = post.user_real_avatar; img.style.display = 'block'; }
    const txt = document.getElementById('detailAvatarTxt'); if(txt) txt.style.display = 'none';
  } else {
    const img = document.getElementById('detailAvatarImg'); if(img) img.style.display = 'none';
    const txt = document.getElementById('detailAvatarTxt'); if(txt) { txt.innerText = post.username.charAt(0); txt.style.display = 'block'; }
  }

  const wrapper = document.getElementById('detailImages');
  if (wrapper) wrapper.innerHTML = (post.images || []).map(src => `<div class="swiper-slide"><img src="${src}"></div>`).join('');

  if (typeof Swiper !== 'undefined') {
    new Swiper('.detailSwiper', { observer: true, observeParents: true, pagination: { el: '.swiper-pagination', clickable: true }, navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' } });
  }

  const commentList = document.getElementById('commentList');
  if (commentList) commentList.innerHTML = (comments || []).map(c => `<div class="mb-3"><span class="text-warning small fw-bold">${c.username}:</span><span class="text-light ms-1 small" style="opacity:0.8">${c.content}</span></div>`).join('');

  updateInteractionUI(isLiked, isFavorited, isFollowing);
  const modalEl = document.getElementById('detailModal');
  if (!detailModalInstance) detailModalInstance = new bootstrap.Modal(modalEl);
  detailModalInstance.show();
}

function updateInteractionUI(isLiked, isFavorited, isFollowing) {
  const likeIcon = document.getElementById('likeIcon');
  const likeBtn = document.getElementById('likeBtn');
  if (likeIcon) likeIcon.className = isLiked ? 'bi bi-heart-fill' : 'bi bi-heart';
  if (likeBtn) likeBtn.classList.toggle('active-like', !!isLiked);

  const favIcon = document.getElementById('favIcon');
  const favBtn = document.getElementById('favBtn');
  if (favIcon) favIcon.className = isFavorited ? 'bi bi-star-fill' : 'bi bi-star';
  if (favBtn) favBtn.classList.toggle('active-fav', !!isFavorited);

  const btnFollow = document.getElementById('btnFollow');
  if (btnFollow) {
    btnFollow.innerText = isFollowing ? '已关注' : '关注';
    btnFollow.className = isFollowing ? 'btn btn-secondary btn-sm rounded-pill px-3' : 'btn btn-outline-warning btn-sm rounded-pill px-3';
  }
}

async function toggleFollow() {
  if(!currentUser) return alert('请先登录');
  if(currentUser.id === currentPostUserId) return alert('无需关注自己');
  try {
    const res = await fetch('/api/users/follow', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ follower_id: currentUser.id, following_id: currentPostUserId }) });
    const json = await res.json();
    if(json.success) {
      const btnFollow = document.getElementById('btnFollow');
      const isFollow = json.action === 'follow';
      if (btnFollow) { btnFollow.innerText = isFollow ? '已关注' : '关注'; btnFollow.className = isFollow ? 'btn btn-secondary btn-sm rounded-pill px-3' : 'btn btn-outline-warning btn-sm rounded-pill px-3'; }
    }
  } catch(e) { console.error(e); }
}

async function toggleLike() {
  if(!currentUser) return alert('登录后即可点赞');
  const res = await fetch(`/api/community/posts/${currentPostId}/like`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ user_id: currentUser.id }) });
  const json = await res.json();
  if(json.success) {
    const countEl = document.getElementById('likeCount');
    const isLike = json.action === 'like';
    if (countEl) countEl.innerText = isLike ? parseInt(countEl.innerText) + 1 : Math.max(0, parseInt(countEl.innerText) - 1);
    updateInteractionUI(isLike, document.getElementById('favBtn') && document.getElementById('favBtn').classList.contains('active-fav'), document.getElementById('btnFollow') && document.getElementById('btnFollow').innerText === '已关注');
  }
}

async function toggleFavorite() {
  if(!currentUser) return alert('登录后即可收藏');
  const res = await fetch(`/api/community/posts/${currentPostId}/favorite`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ user_id: currentUser.id }) });
  const json = await res.json();
  if(json.success) updateInteractionUI(document.getElementById('likeBtn') && document.getElementById('likeBtn').classList.contains('active-like'), json.action === 'favorite', document.getElementById('btnFollow') && document.getElementById('btnFollow').innerText === '已关注');
}

async function submitComment() {
  if(!currentUser) return alert('请先登录');
  const content = document.getElementById('commentInput').value;
  if(!content) return;
  await fetch(`/api/community/posts/${currentPostId}/comment`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ user_id: currentUser.id, username: currentUser.username, content }) });
  openDetail(currentPostId);
  const input = document.getElementById('commentInput'); if (input) input.value = '';
}

function openPublishModal() {
  if(!currentUser) { alert('请先登录'); window.location.href = '/login'; return; }
  new bootstrap.Modal(document.getElementById('publishModal')).show();
}

document.getElementById('postForm') && (document.getElementById('postForm').onsubmit = async (e) => {
  e.preventDefault(); if(!currentUser) return alert('登录已过期，请重新登录');
  const formData = new FormData(e.target);
  formData.append('user_id', currentUser.id);
  formData.append('username', currentUser.username);
  try {
    const res = await fetch('/api/community/posts', { method: 'POST', body: formData });
    if((await res.json()).success) { alert('发布成功！'); location.reload(); }
    else alert('发布失败');
  } catch(e) { alert('网络错误'); }
});
