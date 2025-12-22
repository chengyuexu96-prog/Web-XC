// profile.js - relies on `currentUser` variable injected by server-side EJS

// 1. 初始化粒子
if (typeof tsParticles !== 'undefined') {
  tsParticles.load("tsparticles", {
    fpsLimit: 60,
    background: { color: "#000" },
    particles: {
      number: { value: 100, density: { enable: true, value_area: 800 } },
      color: { value: ["#ff4500", "#ffa500", "#ffd700", "#ffffff"] },
      shape: { type: "circle" },
      opacity: { value: 0.8, random: true, anim: { enable: true, speed: 1, opacity_min: 0.1, sync: false } },
      size: { value: 3, random: true },
      move: { enable: true, speed: 0.5, direction: "none", random: true, out_mode: "out" }
    },
    interactivity: {
      detect_on: "canvas",
      events: { onhover: { enable: true, mode: "bubble" } },
      modes: { bubble: { distance: 200, size: 6, duration: 2, opacity: 1 } }
    },
    retina_detect: true
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initProfile();
  updateSiteStats();
});

async function initProfile() {
  const user = currentUser;
  if (!user) return;

  const nameEl = document.getElementById('userName');
  const emailEl = document.getElementById('userEmail');
  const joinEl = document.getElementById('joinDate');
  if (nameEl) nameEl.innerText = user.username;
  if (emailEl) emailEl.innerText = user.email || '未绑定';
  if (joinEl && user.created_at) joinEl.innerText = new Date(user.created_at).toLocaleDateString();

  const imgEl = document.getElementById('userAvatarImg');
  const txtEl = document.getElementById('userAvatarTxt');
  if (user.avatar && user.avatar.length > 5) {
    if (imgEl) { imgEl.src = user.avatar; imgEl.style.display = 'block'; }
    if (txtEl) txtEl.style.display = 'none';
  } else if (txtEl) {
    txtEl.innerText = user.username.charAt(0).toUpperCase();
    txtEl.style.display = 'block';
  }

  // 统计
  try {
    const res = await fetch(`/api/user/${user.id}/stats`);
    const json = await res.json();
    if (json.success) {
      const likes = document.getElementById('statLikes');
      const favs = document.getElementById('statFavs');
      if (likes) likes.innerText = json.likes || 0;
      if (favs) favs.innerText = json.favs || 0;
    }
  } catch (e) { console.error(e); }

  loadPosts(`/api/user/${user.id}/posts`, 'myPostsContainer');
  loadPosts(`/api/user/${user.id}/favorites`, 'myFavsContainer');
  loadFollowing(user.id);
}

async function updateSiteStats() {
  try {
    const now = new Date();
    const weekDays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
    const displayDate = document.getElementById('displayDate');
    if (displayDate) displayDate.innerHTML = `<i class="bi bi-calendar3 me-2"></i>${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日 ${weekDays[now.getDay()]}`;

    const res = await fetch('/api/site/stats');
    const json = await res.json();
    if (json.success) {
      const visits = document.getElementById('displayVisits');
      if (visits) visits.innerHTML = `<i class="bi bi-people me-2"></i>雅客到访总量：<span class="text-warning">${json.visitCount}</span>`;
    }
  } catch (e) { console.error('无法获取访问统计', e); }
}

// 更换头像
const avatarInput = document.getElementById('avatarInput');
if (avatarInput) {
  avatarInput.addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if(!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    formData.append('user_id', currentUser.id);
    try {
      const res = await fetch('/api/user/avatar', { method: 'POST', body: formData });
      const json = await res.json();
      if(json.success) { alert('头像更新成功！'); location.reload(); }
    } catch(err) { console.error(err); }
  });
}

// 加载帖子/关注等通用函数
async function loadPosts(url, containerId) {
  try {
    const res = await fetch(url);
    const json = await res.json();
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    if (json.success && json.data.length > 0) {
      json.data.forEach(post => {
        let img = '';
        try { const parsed = JSON.parse(post.images); img = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : ''; }
        catch(e) { img = post.images; }

        const mgmtHtml = containerId === 'myPostsContainer' ? `<div class="post-mgmt-btns"><button class="btn-mgmt btn-mgmt-del" onclick="deletePost(${post.id})"><i class="bi bi-trash"></i></button></div>` : '';
        container.innerHTML += `
          <div class="note-card" style="position: relative;">
            ${mgmtHtml}
            <img src="${img}" class="note-img" onerror="this.style.display='none'">
            <div class="note-info">
              <div class="fw-bold text-white text-truncate">${post.title}</div>
              <div class="d-flex justify-content-between text-white-50 small mt-1">
                <span>${new Date(post.created_at).toLocaleDateString()}</span>
                <span><i class="bi bi-heart-fill text-danger"></i> ${post.likes_count}</span>
              </div>
            </div>
          </div>`;
      });
    } else {
      container.innerHTML = '<p class="text-center text-white-50 w-100 mt-5">空空如也</p>';
    }
  } catch(e) { console.error(e); }
}

async function loadFollowing(userId) {
  try {
    const res = await fetch(`/api/user/${userId}/following`);
    const json = await res.json();
    const container = document.getElementById('myFollowContainer');
    if (!container) return;
    container.innerHTML = '';
    if (json.success && json.data.length > 0) {
      json.data.forEach(u => {
        let av = u.avatar && u.avatar.length > 5 ? `<img src="${u.avatar}" style="width:50px;height:50px;border-radius:50%;object-fit:cover;">` : `<div style="width:50px;height:50px;border-radius:50%;background:#BFA46F;color:#000;line-height:50px;text-align:center;font-weight:bold;">${u.username.charAt(0)}</div>`;
        container.innerHTML += `
          <div class="d-flex align-items-center justify-content-between p-3 mb-2 rounded border border-secondary" style="background:rgba(255,255,255,0.05);">
            <div class="d-flex align-items-center gap-3">
              ${av}
              <div class="fw-bold text-white">${u.username}</div>
            </div>
            <button class="btn btn-secondary btn-sm rounded-pill" onclick="unfollow(${u.id}, this)">已关注</button>
          </div>`;
      });
    } else {
      container.innerHTML = '<p class="text-center text-white-50 mt-5">暂无关注</p>';
    }
  } catch(e) { console.error(e); }
}

async function unfollow(targetId, btn) {
  if(!confirm('取消关注？')) return;
  try {
    await fetch('/api/users/follow', { method: 'POST', headers: {'Content-Type':'application/json'}, body:JSON.stringify({ follower_id: currentUser.id, following_id: targetId }) });
    if (btn && btn.parentElement) btn.parentElement.remove();
  } catch(e) { console.error(e); }
}

async function deletePost(postId) {
  if(!confirm('确定要删除这篇笔记吗？')) return;
  try {
    const res = await fetch(`/api/community/posts/${postId}`, { method: 'DELETE', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ user_id: currentUser.id }) });
    const json = await res.json();
    if(json.success) { alert('已删除'); initProfile(); }
  } catch(e) { alert('网络错误'); }
}
