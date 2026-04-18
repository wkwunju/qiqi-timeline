# 骐骐 · Qiqi Timeline

- 站点:GitHub Pages(public 仓库,只有代码)
- 照片 + 时间线数据:Cloudflare R2(私有,不在 GitHub 上)
- 上传接口:Cloudflare Worker(密码验证)

访问:https://wkwunju.github.io/qiqi-timeline/

## 部署 Worker + R2(一次性,约 10 分钟)

### 1. 注册 Cloudflare(免费,不要信用卡)
https://dash.cloudflare.com/sign-up

### 2. 安装 wrangler 并登录
```
npm install -g wrangler
wrangler login
```

### 3. 创建 R2 存储桶
```
wrangler r2 bucket create qiqi-photos
```

> 注:首次使用 R2 时 Cloudflare 会让你在网页控制台里接受一下 R2 条款。
> 打开 https://dash.cloudflare.com → R2 → 按提示点一下 "Enable R2"。
> (如果提示要信用卡,可以跳过,免费额度内不会扣费。)

### 4. 部署 Worker
```
cd worker
wrangler deploy
```
部署成功后会打印一个地址,形如:
```
https://qiqi-api.wkwunju.workers.dev
```
**把这个地址记下来**,等下要填进 `index.html`。

### 5. 设置上传密码
```
wrangler secret put UPLOAD_PASSWORD
```
会让你输入密码(不显示),这就是以后上传照片要用的密码。

### 6. 把 Worker 地址填进前端
编辑 `../index.html`,找到这一行:
```js
const API_URL = 'https://qiqi-api.wkwunju.workers.dev';
```
如果你的 Worker 地址不一样(比如账户用户名不同),改成你的。

### 7. 推送更新
```
cd ..
git add . && git commit -m "connect to worker" && git push
```

等 1 分钟让 GitHub Pages 重新构建,就完成了。

## 之后要改东西

- **改前端**(index.html):`git push` 就行,GitHub Pages 自动更新
- **改 Worker**(worker/):`cd worker && wrangler deploy`
- **换密码**:`cd worker && wrangler secret put UPLOAD_PASSWORD`

## 免费额度(随便用都不会超)

- R2:10 GB 存储 / 月,足够放几千张压缩后的照片
- Worker:100,000 次请求 / 天
- GitHub Pages:无限流量
