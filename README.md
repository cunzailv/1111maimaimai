# 双11 花开心（双十一买买买）

整屏模拟手机的多人网页小游戏：9 个购物 App，花的是「开心币」，不是真钱。

- 在线玩：<http://1111maimaimai.zhuhongquan.com/>
- 房间号固定 `1111`，进同一个链接就是同一间房，能互相看到对方在买什么、抢了什么、许了什么愿。

## 玩法

预算 300 开心币，随便花，最后按「六瓣花 + 称号池」结算（锦鲤附体 / 凑单鬼才 / 冤大头 / 手速废物 / 铁公鸡 / 开心就好）。心愿优先、预算花光、剩钱扣分。

| App | 玩什么 |
| --- | --- |
| 大额补贴 | 28 件「今日货架」，点一下加购物车，抽补贴券抵扣 |
| 比价神器 | 10 道同款比价题，算到手价挑最便宜那家，答对加开心币 |
| 砍一刀 | 致敬拼夕夕的砍价：199 元目标，第一刀砍到 18.80，第二刀剩 0.20，之后是 0.1 / 0.098 / 0.085 / 0.0001 这种小数，永远差一点点；8% 概率一刀到手 |
| 补贴转盘 | 八格转盘，转发到群聊让房友帮你再转一次，被助力方次数 +1（封顶 10） |
| 直播间 | 30 件货，横向滑卡，换货重置倒计时 |
| 真情买买买 | 10 个随机小剧场，每次抽 5 个没看过的 + 动态终章 |
| 许愿池 | 自己的三件愿望可改名改价；「轮到你了」滚动显示房里别人的愿望，也能给真人塞一件 |
| 购格测试 | 15 题，出四维购格代码 + 海报 |
| 1111 群聊 | 房间实时消息流、在线人数、桌面入口 |
| 结算 | 六瓣花 + 称号 + 可保存的 Canvas 战报海报 |

## 技术

- 前端：单文件 `双十一买买买.html`，原生 JS、无构建、无框架；图片走 `assets/` 相对路径。
- 后端：`server/hx-server.js`，零依赖 Node 房间服务（内存态），`/api/*` 提供房间事件与玩家状态。
- 部署：宝塔 Nginx 静态托管 + `location /api/` 反代到 `127.0.0.1:4100`，systemd 守护 `hx-game`。

### API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/health` | 健康检查 |
| GET | `/api/room?room=1111&u=<uid>` | 房间玩家列表 |
| GET | `/api/since?room=&after=&u=` | 增量拉事件（seq / evts / players / online / helps） |
| POST | `/api/evt` | 推一条房间事件（`cid` 幂等，`meta` 可带 `{target,kind,item}`） |
| POST | `/api/state` | 上报我的状态（花瓣、花费、购格、转盘次数、3 条愿望） |
| POST | `/api/help` | 给房友的转盘助力 |

### 本地跑

```bash
node server/hx-server.js        # 默认 4100
python3 -m http.server 8000     # 起静态页，浏览器打开 /双十一买买买.html
```

前端在 `file:` 协议下会自动回落到线上域名，所以直接双击 html 也能连上房间。

### 线上部署

```bash
scp 双十一买买买.html root@<server>:/www/wwwroot/1111maimaimai/index.html
scp server/hx-server.js root@<server>:/www/wwwroot/1111maimaimai/server/hx-server.js
ssh root@<server> "chown -R www:www /www/wwwroot/1111maimaimai && systemctl restart hx-game"
```

## 合规

不接真钱、不接真支付、不接真奖品。所有金额都是「开心币」，砍价、补贴、抽奖全部是模拟，不产生任何真实交易。

## 目录

```
双十一买买买.html      主页面（单文件）
server/hx-server.js    房间实时服务
assets/                商品图与壁纸
```
