const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const session = require('express-session');
const { Lunar } = require('lunar-javascript');

const app = express();
const PORT = 3000;

// ================= 1. 基础配置与中间件 =================

// 跨域与请求体解析
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session 配置 (用户登录状态)
app.use(session({
    secret: 'porcelain_key_2025',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1天过期
}));

// EJS 模板引擎配置
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 静态资源托管
app.use(express.static(path.join(__dirname, '.'))); 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// [关键] 全局变量中间件：让所有 EJS 模板都能直接访问 user
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// 文件上传配置 (Multer)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // 处理文件名编码，防止中文乱码
        const name = Buffer.from(file.originalname, "latin1").toString("utf8");
        cb(null, Date.now() + path.extname(name));
    }
});
const upload = multer({ storage: storage });

// ================= 2. 数据库初始化 =================
const db = new sqlite3.Database('./porcelain.db');

db.serialize(() => {
    // 创建用户表
    db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, email TEXT, password TEXT, avatar TEXT DEFAULT '', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
    // 创建资源表
    db.run(`CREATE TABLE IF NOT EXISTS resources (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT, title TEXT, image_path TEXT, link_url TEXT, description TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
    // 创建帖子表
    db.run(`CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, username TEXT, user_avatar TEXT, title TEXT, content TEXT, images TEXT, likes_count INTEGER DEFAULT 0, favorites_count INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
    // 创建评论表
    db.run(`CREATE TABLE IF NOT EXISTS comments (id INTEGER PRIMARY KEY AUTOINCREMENT, post_id INTEGER, user_id INTEGER, username TEXT, content TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
    // 关系表：点赞、收藏、关注
    db.run(`CREATE TABLE IF NOT EXISTS post_likes (user_id INTEGER, post_id INTEGER, PRIMARY KEY (user_id, post_id))`);
    db.run(`CREATE TABLE IF NOT EXISTS post_favorites (user_id INTEGER, post_id INTEGER, PRIMARY KEY (user_id, post_id))`);
    db.run(`CREATE TABLE IF NOT EXISTS follows (follower_id INTEGER, following_id INTEGER, PRIMARY KEY (follower_id, following_id))`);
    // 站点统计表
    db.run(`CREATE TABLE IF NOT EXISTS site_stats (id INTEGER PRIMARY KEY, visit_count INTEGER)`);

    // 初始化统计数据
    db.get("SELECT visit_count FROM site_stats WHERE id = 1", (err, row) => {
        if (!row) db.run("INSERT INTO site_stats (id, visit_count) VALUES (1, 0)");
    });

    // 初始化管理员账号
    db.run(`INSERT OR IGNORE INTO users (id, username, email, password, avatar) 
            VALUES (999, '系统管理员', 'admin@porcelain.com', 'admin123', 'https://api.dicebear.com/7.x/bottts/svg?seed=admin')`);
});

// ================= 3. 页面路由 (SSR 渲染) =================

// 首页
app.get('/', (req, res) => res.render('index', { page: 'home' }));
app.get('/index', (req, res) => res.render('index', { page: 'home' }));
// 第二个首页 / 进入页
app.get('/index2', (req, res) => {
    res.render('index2', { page: 'index2' });
});

// 登录页 (已登录则跳转)
app.get('/login', (req, res) => {
    if (req.session.user) return res.redirect('/');
    res.render('login', { page: 'login' });
});

// 社区页 (SSR核心：直接查库渲染，无需前端二次请求)
app.get('/community', (req, res) => {
    const sql = `SELECT p.*, u.avatar as user_real_avatar FROM posts p LEFT JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC`;
    db.all(sql, [], (err, rows) => {
        const posts = rows ? rows.map(p => {
            try { p.images = JSON.parse(p.images); } catch(e){ p.images = [] }
            // 优先使用 user 表里的最新头像
            if(p.user_real_avatar) p.user_avatar = p.user_real_avatar;
            return p;
        }) : [];
        res.render('community', { posts: posts, page: 'community' });
    });
});

// 个人中心 (路由守卫)
app.get('/profile', (req, res) => {
    if(!req.session.user) return res.redirect('/login');
    res.render('profile', { page: 'profile' });
});

// 其他静态页面
app.get('/resource', (req, res) => res.render('resource', { page: 'resource' }));
app.get('/feedback', (req, res) => res.render('feedback', { page: 'feedback' }));

// 朝代介绍页面
app.get('/song', (req, res) => res.render('song'));
app.get('/yuan', (req, res) => res.render('yuan'));
app.get('/ming', (req, res) => res.render('ming'));
app.get('/qing', (req, res) => res.render('qing'));
// 兼容旧链接
app.get('/Dynasty/song.html', (req, res) => res.render('song'));
app.get('/Dynasty/yuan.html', (req, res) => res.render('yuan'));
app.get('/Dynasty/ming.html', (req, res) => res.render('ming'));
app.get('/Dynasty/qing.html', (req, res) => res.render('qing'));

app.get('/logout', (req, res) => {
    // 1. 销毁服务端的 Session 数据
    req.session.destroy((err) => {
        if (err) {
            console.error("Session销毁失败:", err);
            // 即使销毁失败，也要强制让浏览器以为注销了
        }
        
        // 2. 关键：清除浏览器端的 Cookie (connect.sid 是默认名)
        res.clearCookie('connect.sid'); 
        
        // 3. 明确告诉浏览器：跳转回首页
        res.redirect('/');
    });
});

// ================= 4. API 接口 (数据交互) =================

// --- 认证模块 ---
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT * FROM users WHERE (username = ? OR email = ?) AND password = ?`, [username, username, password], (err, row) => {
        if (row) {
            req.session.user = row;
            res.json({ success: true, user: row });
        } else {
            res.json({ success: false, message: "账号或密码错误" });
        }
    });
});

app.post('/api/register', (req, res) => {
    const { username, email, password } = req.body;
    db.run(`INSERT INTO users (username, email, password) VALUES (?, ?, ?)`, [username, email, password], function(err) {
        if (err) return res.json({ success: false, message: "用户名或邮箱已存在" });
        req.session.user = { id: this.lastID, username, email, avatar: '' }; // 注册即登录
        res.json({ success: true });
    });
});

// --- 社区帖子模块 ---

// 发布帖子
app.post('/api/community/posts', upload.array('images', 9), (req, res) => {
    if(!req.session.user) return res.status(401).json({success:false, message:"请先登录"});
    
    const { title, content } = req.body;
    const user = req.session.user;
    const images = req.files.map(f => `/uploads/${f.filename}`);
    
    db.run(`INSERT INTO posts (user_id, username, user_avatar, title, content, images) VALUES (?, ?, ?, ?, ?, ?)`,
        [user.id, user.username, user.avatar, title, content, JSON.stringify(images)],
        (err) => res.json({ success: !err })
    );
});

// 获取帖子详情 (包含评论、点赞状态、关注状态)
app.get('/api/community/posts/:id', (req, res) => {
    const postId = req.params.id;
    const userId = req.session.user ? req.session.user.id : req.query.userId;

    db.get(`SELECT p.*, u.avatar as user_real_avatar FROM posts p LEFT JOIN users u ON p.user_id = u.id WHERE p.id = ?`, [postId], (err, post) => {
        if (!post) return res.json({ success: false });
        try { post.images = JSON.parse(post.images); } catch(e) { post.images = []; }

        db.all(`SELECT * FROM comments WHERE post_id = ? ORDER BY created_at DESC`, [postId], (err, comments) => {
            if (!userId) {
                return res.json({ success: true, data: { post, comments, isLiked: false, isFavorited: false, isFollowing: false } });
            }
            // 并行查询用户的交互状态
            Promise.all([
                new Promise(r => db.get(`SELECT 1 FROM post_likes WHERE user_id=? AND post_id=?`, [userId, postId], (e, row) => r(!!row))),
                new Promise(r => db.get(`SELECT 1 FROM post_favorites WHERE user_id=? AND post_id=?`, [userId, postId], (e, row) => r(!!row))),
                new Promise(r => db.get(`SELECT 1 FROM follows WHERE follower_id=? AND following_id=?`, [userId, post.user_id], (e, row) => r(!!row)))
            ]).then(([isLiked, isFavorited, isFollowing]) => {
                res.json({ success: true, data: { post, comments, isLiked, isFavorited, isFollowing } });
            });
        });
    });
});

// 删除帖子
app.delete('/api/community/posts/:id', (req, res) => {
    if(!req.session.user) return res.json({success:false, message:"未登录"});
    const postId = req.params.id;
    const userId = req.session.user.id;

    db.run(`DELETE FROM posts WHERE id = ? AND user_id = ?`, [postId, userId], function(err) {
        if (err || this.changes === 0) return res.json({ success: false, message: "删除失败或无权操作" });
        // 同步清理关联数据
        db.run(`DELETE FROM comments WHERE post_id = ?`, [postId]);
        db.run(`DELETE FROM post_likes WHERE post_id = ?`, [postId]);
        db.run(`DELETE FROM post_favorites WHERE post_id = ?`, [postId]);
        res.json({ success: true });
    });
});

// 修改帖子
app.put('/api/community/posts/:id', (req, res) => {
    if(!req.session.user) return res.json({success:false});
    const { title, content } = req.body;
    db.run(`UPDATE posts SET title = ?, content = ? WHERE id = ? AND user_id = ?`, 
        [title, content, req.params.id, req.session.user.id], 
        function(err) {
            res.json({ success: !err && this.changes > 0 });
        }
    );
});

// --- 交互模块 (点赞/收藏/评论/关注) ---

app.post('/api/community/posts/:id/like', (req, res) => {
    if(!req.session.user) return res.json({success:false});
    const userId = req.session.user.id;
    const postId = req.params.id;

    db.get(`SELECT 1 FROM post_likes WHERE user_id=? AND post_id=?`, [userId, postId], (err, row) => {
        if (row) { // 取消
            db.run(`DELETE FROM post_likes WHERE user_id=? AND post_id=?`, [userId, postId]);
            db.run(`UPDATE posts SET likes_count = MAX(0, likes_count - 1) WHERE id=?`, [postId]);
            res.json({ success: true, action: 'unlike' });
        } else { // 点赞
            db.run(`INSERT INTO post_likes (user_id, post_id) VALUES (?, ?)`, [userId, postId]);
            db.run(`UPDATE posts SET likes_count = likes_count + 1 WHERE id=?`, [postId]);
            res.json({ success: true, action: 'like' });
        }
    });
});

app.post('/api/community/posts/:id/favorite', (req, res) => {
    if(!req.session.user) return res.json({success:false});
    const userId = req.session.user.id;
    const postId = req.params.id;

    db.get(`SELECT 1 FROM post_favorites WHERE user_id=? AND post_id=?`, [userId, postId], (err, row) => {
        if (row) { // 取消
            db.run(`DELETE FROM post_favorites WHERE user_id=? AND post_id=?`, [userId, postId]);
            db.run(`UPDATE posts SET favorites_count = MAX(0, favorites_count - 1) WHERE id=?`, [postId]);
            res.json({ success: true, action: 'unfavorite' });
        } else { // 收藏
            db.run(`INSERT INTO post_favorites (user_id, post_id) VALUES (?, ?)`, [userId, postId]);
            db.run(`UPDATE posts SET favorites_count = favorites_count + 1 WHERE id=?`, [postId]);
            res.json({ success: true, action: 'favorite' });
        }
    });
});

app.post('/api/community/posts/:id/comment', (req, res) => {
    if(!req.session.user) return res.json({success:false});
    const { content } = req.body;
    db.run(`INSERT INTO comments (post_id, user_id, username, content) VALUES (?, ?, ?, ?)`, 
        [req.params.id, req.session.user.id, req.session.user.username, content], 
        (err) => res.json({ success: !err })
    );
});

app.post('/api/users/follow', (req, res) => {
    if(!req.session.user) return res.json({success:false});
    const { following_id } = req.body;
    const follower_id = req.session.user.id;

    if (follower_id == following_id) return res.json({ success: false, message: "不能关注自己" });

    db.get(`SELECT 1 FROM follows WHERE follower_id=? AND following_id=?`, [follower_id, following_id], (err, row) => {
        if(row) {
            db.run(`DELETE FROM follows WHERE follower_id=? AND following_id=?`, [follower_id, following_id]);
            res.json({success:true, action:'unfollow'});
        } else {
            db.run(`INSERT INTO follows (follower_id, following_id) VALUES (?, ?)`, [follower_id, following_id]);
            res.json({success:true, action:'follow'});
        }
    });
});

// --- 用户信息模块 ---

app.post('/api/user/avatar', upload.single('avatar'), (req, res) => {
    if(!req.session.user) return res.json({success:false});
    const avatarPath = '/uploads/' + req.file.filename;
    
    db.run(`UPDATE users SET avatar = ? WHERE id = ?`, [avatarPath, req.session.user.id], (err) => {
        if(!err) req.session.user.avatar = avatarPath; // 更新Session里的头像
        res.json({ success: !err, avatar: avatarPath });
    });
});

app.get('/api/user/:id/stats', (req, res) => {
    db.get(`SELECT SUM(likes_count) as l, SUM(favorites_count) as f FROM posts WHERE user_id=?`, [req.params.id], (err, row) => {
        res.json({ success: true, likes: row ? row.l || 0 : 0, favs: row ? row.f || 0 : 0 });
    });
});

app.get('/api/user/:id/posts', (req, res) => {
    db.all(`SELECT * FROM posts WHERE user_id=? ORDER BY created_at DESC`, [req.params.id], (err, rows) => {
        if (!rows) return res.json({ success: true, data: [] });
        rows.forEach(r => { try { r.images = JSON.parse(r.images); } catch(e) { r.images = []; } });
        res.json({ success: true, data: rows });
    });
});

app.get('/api/user/:id/favorites', (req, res) => {
    db.all(`SELECT p.* FROM posts p JOIN post_favorites f ON p.id=f.post_id WHERE f.user_id=? ORDER BY f.rowid DESC`, [req.params.id], (err, rows) => {
        if (!rows) return res.json({ success: true, data: [] });
        rows.forEach(r => { try { r.images = JSON.parse(r.images); } catch(e) { r.images = []; } });
        res.json({ success: true, data: rows });
    });
});

app.get('/api/user/:id/following', (req, res) => {
    db.all(`SELECT u.id, u.username, u.email, u.avatar FROM users u JOIN follows f ON u.id=f.following_id WHERE f.follower_id=?`, [req.params.id], (err, rows) => {
        res.json({success:true, data:rows || []});
    });
});

// --- 资源与统计 ---

app.post('/api/resources', upload.single('poster'), (req, res) => {
    const { type, title, link_url, description } = req.body;
    const image_path = req.file ? `/uploads/${req.file.filename}` : '';
    db.run(`INSERT INTO resources (type, title, image_path, link_url, description) VALUES (?, ?, ?, ?, ?)`,
        [type, title, image_path, link_url, description],
        (err) => res.json({ success: !err })
    );
});

app.get('/api/resources', (req, res) => {
    const search = req.query.search || '';
    let sql = "SELECT * FROM resources WHERE 1=1";
    let params = [];
    if(search) {
        sql += " AND (title LIKE ? OR description LIKE ?)";
        params.push(`%${search}%`, `%${search}%`);
    }
    sql += " ORDER BY created_at DESC";
    db.all(sql, params, (err, rows) => res.json({ success: true, data: rows || [] }));
});

app.get('/api/site/stats', (req, res) => {
    db.get("SELECT visit_count FROM site_stats WHERE id = 1", (err, row) => {
        let count = row ? row.visit_count + 1 : 1;
        db.run("UPDATE site_stats SET visit_count = ? WHERE id = 1", [count]);
        res.json({ success: true, visitCount: count });
    });
});

app.get('/api/time-info', (req, res) => {
    try {
        const now = new Date();
        const lunar = Lunar.fromDate(now);
        const lunarStr = `${lunar.getYearInGanZhi()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;
        const jieqi = lunar.getJieQi();
        const festival = lunar.getFestivals()[0];
        
        res.json({
            success: true,
            date: now.toLocaleDateString('zh-CN'),
            week: "星期" + "日一二三四五六".charAt(now.getDay()),
            lunar: lunarStr,
            extra: festival || jieqi || ''
        });
    } catch (e) {
        console.error("农历计算出错:", e);
        res.status(500).json({ success: false });
    }
});

// ================= 5. 启动服务器 =================
app.listen(PORT, () => {
    console.log(`项目启动成功: http://localhost:${PORT}`);
});