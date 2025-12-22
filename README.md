# Porcelain_Project

## 一句话简介
“瓷韵中华”演示站 —— 基于 Node.js + Express + EJS 的静态/动态内容展示与社区交互原型。

## 网站定位
面向对中国陶瓷文化、纪录片与文物感兴趣的用户，定位为藏品展示、资料聚合与社区交流的平台。

## 主要功能
- 首页支持视频与大图轮播展示。
- 朝代专题页（宋 / 元 / 明 / 清）展示图像与交互（放大镜、视差、横向滚动等）。
- 藏经阁（资源页）支持视频/书籍展示、搜索与资源上传表单。
- 社区（雅集）支持发帖、评论、点赞、收藏、关注等互动（需后端 API 支持）。
- 用户系统：注册/登录、个人主页（`profile`）展示用户信息与发帖管理。
- 静态资源：`media/` 存放素材，`uploads/` 接收用户上传，`js/` 和 `css/` 管理前端交互与样式。

## 快速运行（本地开发）
前提：已安装 Node.js（建议 16+）和 npm。

1. 克隆仓库并进入目录：

```powershell
git clone <repo-url>
cd Porcelain_Project
```

2. 安装依赖：

```powershell
npm install
```

3. 启动服务：

```powershell
npm start
# 或者
node server.js
```

4. 打开浏览器访问：

```
http://localhost:3000
```

（端口以 `server.js` 中配置为准；如需使用自定义端口，可在启动前设置 `PORT` 环境变量。）

## 项目结构（树状图）
```
Porcelain_Project/
├─ server.js                 # Express 应用入口与路由
├─ package.json
├─ README.md
├─ common.js                 # 公用前端工具/API 封装
├─ news.json                 # 示例新闻数据
├─ css/                      # 样式表
│  └─ ...
├─ js/                       # 前端脚本（已把内联脚本抽离到此处）
│  ├─ common.js
│  ├─ index2.js
│  ├─ profile.js
│  ├─ community.js
│  └─ ...
├─ media/                    # 图片 / 视频 素材
├─ uploads/                  # 用户上传目录（运行时）
└─ views/                    # EJS 模板视图
   ├─ partials/
   │  ├─ header.ejs
   │  └─ footer.ejs
   ├─ index2.ejs
   ├─ login.ejs
   ├─ profile.ejs
   ├─ community.ejs
   └─ (其他页面：song.ejs, yuan.ejs, ming.ejs, qing.ejs, resource.ejs...)
```
# Web-XC
