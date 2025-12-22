// 登录/注册页面脚本
// Tab 切换逻辑
function switchTab(type) {
  document.querySelectorAll('.auth-tab').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.form-section').forEach(el => el.classList.remove('active'));
  if(type === 'login') {
    document.querySelectorAll('.auth-tab')[0].classList.add('active');
    document.getElementById('loginForm').classList.add('active');
  } else {
    document.querySelectorAll('.auth-tab')[1].classList.add('active');
    document.getElementById('registerForm').classList.add('active');
  }
}

// 注册验证逻辑
const regInputs = {
  user: document.getElementById('regUser'),
  email: document.getElementById('regEmail'),
  pass: document.getElementById('regPass')
};
const btnReg = document.getElementById('btnReg');
const validators = {
  user: (val) => val.length >= 2 && val.length <= 10,
  email: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
  pass: (val) => val.length >= 6
};

Object.keys(regInputs).forEach(key => {
  const input = regInputs[key];
  if (!input) return;
  input.addEventListener('input', () => {
    const isValid = validators[key](input.value);
    if (input.value.length > 0 && !isValid) input.classList.add('is-invalid');
    else input.classList.remove('is-invalid');
    checkFormValidity();
  });
});

function checkFormValidity() {
  const isUserValid = validators.user(regInputs.user.value);
  const isEmailValid = validators.email(regInputs.email.value);
  const isPassValid = validators.pass(regInputs.pass.value);
  btnReg.disabled = !(isUserValid && isEmailValid && isPassValid);
}

// 登录/注册网络交互（依赖 common.js 中的 apiLogin / apiRegister 或自行实现）
async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('btnLogin');
  const userField = document.getElementById('loginUser').value;
  const passField = document.getElementById('loginPass').value;
  if(!userField || !passField) return alert('请填写完整的账号和密码');
  const originalText = btn.innerText; btn.disabled = true; btn.innerText = '验 证 中 ...';
  try {
    const result = await apiLogin(userField, passField);
    if (result.success) {
      btn.innerText = '验 证 通 过';
      setTimeout(() => { window.location.href = '/index2'; }, 500);
    } else {
      alert('登录失败：' + (result.message || '账号或密码错误'));
      btn.disabled = false; btn.innerText = originalText;
    }
  } catch (err) {
    alert('网络错误，请稍后重试'); btn.disabled = false; btn.innerText = originalText;
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const btn = document.getElementById('btnReg');
  const originalText = btn.innerText; if(btn.disabled) return;
  btn.disabled = true; btn.innerText = '注 册 中 ...';
  const user = regInputs.user.value; const email = regInputs.email.value; const pass = regInputs.pass.value;
  try {
    const result = await apiRegister(user, email, pass);
    if (result.success) { alert('入籍成功！请使用刚才的账号登录。'); switchTab('login'); document.getElementById('loginUser').value = user; }
    else alert('注册失败：' + (result.message || '未知错误'));
  } catch (err) { alert('网络错误'); }
  btn.disabled = false; btn.innerText = originalText; checkFormValidity();
}
