// 使用相对路径，自动适配当前域名
const API_BASE = '/api';

// ==========================================
// 1. API 请求封装 (保持不变，供 login.ejs 调用)
// ==========================================
async function apiRegister(username, email, password) {
    try {
        const response = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        return await response.json();
    } catch (error) { return { success: false, message: "网络连接失败" }; }
}

async function apiLogin(username, password) {
    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        return await response.json();
    } catch (error) { return { success: false, message: "网络连接失败" }; }
}

// ==========================================
// 2. 退出登录 (修改为直接跳转后端路由)
// ==========================================
function apiLogout() {
    if(confirm("确定要离开瓷韵中华吗？")) {
        // ★关键修改：不再操作 localStorage，直接访问后端的注销路由
        // 后端会销毁 Session 并重定向回首页
        window.location.href = '/logout'; 
    }
}

// ==========================================
// 3. 页面交互逻辑 ( jQuery )
// ==========================================
$(document).ready(function() {
    // A. 导航栏滚动变色 (jQuery 版本)
    // 监听窗口滚动事件
    $(window).scroll(function() {
        // $(this).scrollTop() 获取滚动距离
        if ($(this).scrollTop() > 50) {
            $('.navbar').addClass('scrolled'); // jQuery 添加类名
        } else {
            $('.navbar').removeClass('scrolled'); // jQuery 移除类名
        }
    });

    // B. 自动高亮当前菜单 (混合写法，不动核心逻辑)
    highlightActiveLink();

    function updateCalendarData() {
        $.ajax({
            url: '/api/time-info',
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                if(data.success) {
                    // 把数据存到全局变量，方便 updateClock 使用
                    window.serverDateData = data;
                    updateClock(); // 立即刷新一次
                }
            }
        });
    }

    // updateClock 函数
    function updateClock() {
        const now = new Date();
        // 补零函数
        const pad = (n) => n < 10 ? '0' + n : n;
        
        // 生成时间字符串 (秒数稍微淡一点)
        const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}<span style="opacity:0.6; font-size:0.9em">:${pad(now.getSeconds())}</span>`;
        
        if (window.serverDateData) {
            const d = window.serverDateData;
            const html = `
                <span>${d.date} ${d.week}</span>
                <span style="border-right: 1px solid rgba(255,255,255,0.15); height: 14px; margin: 0 15px;"></span>
                <span style="color: #BFA46F;">${d.lunar}</span>
                <span style="border-right: 1px solid rgba(255,255,255,0.15); height: 14px; margin: 0 15px;"></span>
            `;
            
            // 填入刚才 header.ejs 里定义的 ID
            $('#nav-date-display').html(html);
        }
    }

    // 3. 启动逻辑
    updateCalendarData(); // 页面加载时请求一次农历数据
    setInterval(updateCalendarData, 60000 * 60); // 每小时重新校对一次日期(防止跨夜)
});


// 自动高亮逻辑
function highlightActiveLink() {
    const currentPath = window.location.pathname;
    // 获取所有的 nav-link 和 dropdown-item
    const navLinks = document.querySelectorAll('.nav-link, .dropdown-item');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        // 简单匹配：如果当前路径以 href 开头 (例如 /community 匹配 /community)
        // 且 href 不仅仅是 "/" (防止所有页面都高亮首页)
        if (href === currentPath || (href !== '/' && currentPath.startsWith(href))) {
            link.classList.add('active');
            
            // 如果是下拉菜单里的子项，同时也点亮它的父级菜单
            const parentDropdown = link.closest('.nav-item.dropdown');
            if (parentDropdown) {
                const parentLink = parentDropdown.querySelector('.nav-link.dropdown-toggle');
                if(parentLink) parentLink.classList.add('active');
            }
        }
    });
}

