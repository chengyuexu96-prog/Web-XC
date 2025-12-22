// 前端模拟意见反馈提交交互
const feedbackForm = document.getElementById('feedbackForm');
if (feedbackForm) {
  feedbackForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    const originalHtml = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> 投递中...';
    btn.disabled = true;
    setTimeout(() => {
      alert('✅ 您的意见已成功投递！感谢您的反馈，我们会尽快处理。');
      feedbackForm.reset();
      setTimeout(() => { btn.innerHTML = originalHtml; btn.disabled = false; btn.classList.remove('btn-success-custom'); }, 1000);
    }, 1500);
  });
}
