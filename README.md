# 即梦 AI 图片信息采集插件

Chrome 扩展插件，用于采集即梦 AI (jimeng.jianying.com) 生成图片的详细信息。

## 功能特性

- 自动获取图片链接和预览
- 获取提示词 (Prompt)
- 获取参考图信息
- 获取模型版本、比例、质量等参数
- 支持 Webhook 推送（默认 GET / Discord POST）
- 一键复制 JSON 数据

## 安装方法

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 开启右上角的「开发者模式」
4. 点击「加载已解压的扩展程序」
5. 选择本插件文件夹

## 使用方法

### 1. 获取图片信息

1. 打开即梦 AI 网站 [jimeng.jianying.com](https://jimeng.jianying.com)
2. 生成一张图片
3. 点击图片进入「详情页」
4. 点击浏览器地址栏右侧的插件图标
5. 插件会自动提取并显示图片信息

### 2. 复制数据

- 点击「复制」按钮一键复制 JSON 数据到剪贴板
- 所有输入框支持手动编辑

### 3. Webhook 配置

插件支持两种 Webhook 格式：

#### 格式一：默认 (GET 请求)

使用 GET 请求，URL 中的 `{json}` 占位符会被替换为 JSON 字符串。

**使用场景：**
- Bark 通知 (iOS)
- 自定义服务器接收
- 简单消息推送

**URL 填写示例：**

```
https://api.day.app/YOUR_BARK_KEY/{json}
```

```
https://your-server.com/webhook/{json}
```

**发送的数据格式：**
```json
{
  "imageUrl": "https://example.com/image.webp",
  "prompt": "生成第一人称视角的足部腿部特写图",
  "model": "4.5",
  "ratio": "9:16",
  "quality": "2K",
  "refImageUrl": "https://example.com/ref.webp",
  "refImageType": "智能参考",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

#### 格式二：Discord (POST 请求)

使用 POST 请求，发送 Discord Webhook 嵌入消息格式。

**使用场景：**
- Discord 频道通知
- 群机器人推送

**配置步骤：**

1. 在 Discord 服务器设置中创建 Webhook
   - 服务器设置 → 整合 → Webhook → 新建 Webhook
   - 复制 Webhook URL

2. 在插件中配置：
   - 格式下拉框选择「Discord」
   - 粘贴 Webhook URL
   - 点击「保存」

3. 点击「发送 Webhook」即可推送

**Discord 消息效果：**
- 用户名：jimeng内容采集
- 头像：即梦 AI 图标
- 嵌入内容包含：
  - 主图片（大图展示）
  - 参考图（缩略图）
  - 提示词
  - 模型版本、比例、画质等参数
  - 生成时间

---

### 4. 调试方法

如果遇到问题，可以按以下步骤调试：

1. 右键点击插件图标
2. 选择「审查弹窗内容」
3. 在控制台查看日志输出

## 文件结构

```
├── manifest.json    # 插件清单配置
├── popup.html       # 插件界面
├── popup.js        # 弹窗逻辑脚本
├── content.js      # 页面内容提取脚本
└── README.md       # 说明文档
```

## 常见问题

**Q: 获取不到数据怎么办？**
A: 确保已在图片详情页使用插件，页面完全加载后再点击插件图标。

**Q: Webhook 发送失败？**
A:
- 检查 URL 是否正确
- 如果是 Discord 格式，确认选择了「Discord」格式
- 使用审查弹窗功能查看控制台错误日志

**Q: Discord 消息没有图片？**
A: 检查图片 URL 是否为有效的可访问链接，部分图片可能有过期时间。
