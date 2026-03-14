// DOM 元素
const statusEl = document.getElementById('status');
const mainContent = document.getElementById('mainContent');
const errorPage = document.getElementById('errorPage');
const webhookTypeEl = document.getElementById('webhookType');
const webhookUrlEl = document.getElementById('webhookUrl');
const saveWebhookBtn = document.getElementById('saveWebhookBtn');
const imageUrlEl = document.getElementById('imageUrl');
const imagePreviewEl = document.getElementById('imagePreview');
const refImagePreviewEl = document.getElementById('refImagePreview');
const refImageTypeEl = document.getElementById('refImageType');
const promptEl = document.getElementById('prompt');
const modelEl = document.getElementById('model');
const ratioEl = document.getElementById('ratio');
const qualityEl = document.getElementById('quality');
const jsonOutputEl = document.getElementById('jsonOutput');
const refreshBtn = document.getElementById('refreshBtn');
const copyBtn = document.getElementById('copyBtn');
const webhookBtn = document.getElementById('webhookBtn');
const retryBtn = document.getElementById('retryBtn');
const toastEl = document.getElementById('toast');

let currentWebhookUrl = '';
let currentWebhookType = 'default';

// 从存储加载 webhook
function loadWebhook() {
  chrome.storage.local.get(['webhookUrl', 'webhookType'], (result) => {
    if (result.webhookUrl) {
      currentWebhookUrl = result.webhookUrl;
      webhookUrlEl.value = result.webhookUrl;
    }
    if (result.webhookType) {
      currentWebhookType = result.webhookType;
      webhookTypeEl.value = result.webhookType;
    }
  });
}

// 保存 webhook 到存储
function saveWebhook() {
  const url = webhookUrlEl.value.trim();
  const type = webhookTypeEl.value;

  if (!url) {
    showToast('请输入 Webhook URL');
    return;
  }
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    showToast('请输入有效的 URL');
    return;
  }

  chrome.storage.local.set({ webhookUrl: url, webhookType: type }, () => {
    currentWebhookUrl = url;
    currentWebhookType = type;
    showToast('Webhook 已保存');
  });
}

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), 2000);
}

function showError() {
  mainContent.classList.add('hidden');
  errorPage.classList.add('show');
}

function showMain() {
  mainContent.classList.remove('hidden');
  errorPage.classList.remove('show');
}

function updateJsonOutput() {
  const data = {
    imageUrl: imageUrlEl.value,
    prompt: promptEl.value,
    model: modelEl.value,
    ratio: ratioEl.value,
    quality: qualityEl.value,
    refImageUrl: refImagePreviewEl.src || '',
    refImageType: refImageTypeEl.value
  };
  jsonOutputEl.value = JSON.stringify(data, null, 2);
}

async function fetchImageInfo() {
  statusEl.textContent = '获取中...';
  statusEl.className = 'status loading';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.url.includes('jimeng.jianying.com')) {
      statusEl.textContent = '请在即梦图片详情页面中使用';
      statusEl.className = 'status error';
      showError();
      return;
    }

    const response = await chrome.tabs.sendMessage(tab.id, { action: 'getImageInfo' });

    if (response && (response.imageUrl || response.prompt)) {
      showMain();
      imageUrlEl.value = response.imageUrl || '';
      promptEl.value = response.prompt || '';
      modelEl.value = response.model || '';
      ratioEl.value = response.ratio || '';
      qualityEl.value = response.quality || '';

      if (response.imageUrl) {
        imagePreviewEl.src = response.imageUrl;
        imagePreviewEl.classList.remove('hidden');
      } else {
        imagePreviewEl.classList.add('hidden');
      }

      if (response.refImageUrl) {
        refImagePreviewEl.src = response.refImageUrl;
        refImagePreviewEl.classList.remove('hidden');
      } else {
        refImagePreviewEl.classList.add('hidden');
      }
      refImageTypeEl.value = response.refImageType || '';

      updateJsonOutput();

      statusEl.textContent = '获取成功';
      statusEl.className = 'status success';
    } else {
      statusEl.textContent = '未找到图片信息';
      statusEl.className = 'status error';
      showError();
    }
  } catch (error) {
    statusEl.textContent = '获取失败: ' + error.message;
    statusEl.className = 'status error';
    showError();
  }
}

async function copyToClipboard() {
  const jsonText = jsonOutputEl.value;
  if (!jsonText) {
    showToast('没有可复制的内容');
    return;
  }

  try {
    await navigator.clipboard.writeText(jsonText);
    showToast('已复制到剪贴板');
  } catch (err) {
    const textarea = document.createElement('textarea');
    textarea.value = jsonText;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast('已复制到剪贴板');
  }
}

// 构建 Discord 消息格式
function buildDiscordMessage() {
  const imageUrl = imageUrlEl.value;
  const refImageUrl = refImagePreviewEl.src || '';
  const timestamp = new Date().toISOString();
  const generateTime = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });

  return {
    content: "@everyone 以下是本次图片生成的完整配置信息！",
    username: "jimeng内容采集",
    avatar_url: "https://lf3-beecdn.bytetos.com/obj/ies-fe-bee-upload/bee_prod/biz_1521/tos_1719b7abacbdde1c5773b830fcfb166b.png",
    embeds: [
      {
        title: "🎨 生成提示词 参考图片---->",
        description: promptEl.value || "无",
        color: 3447003,
        thumbnail: refImageUrl ? {
          url: refImageUrl
        } : undefined,
        image: imageUrl ? {
          url: imageUrl
        } : undefined,
        fields: [
          {
            name: "🔧 模型版本",
            value: modelEl.value || "无",
            inline: true
          },
          {
            name: "📐 比例",
            value: ratioEl.value || "无",
            inline: true
          },
          {
            name: "🖥️ 画质",
            value: qualityEl.value || "无",
            inline: true
          },
          {
            name: "🖼️ 参考图类型",
            value: refImageTypeEl.value || "无",
            inline: true
          }
        ],
        footer: {
          text: `图片生成任务参数 | 生成时间：${generateTime}`
        },
        timestamp: timestamp
      }
    ]
  };
}

async function sendWebhook() {
  const url = webhookUrlEl.value.trim() || currentWebhookUrl;
  const type = webhookTypeEl.value || currentWebhookType;

  if (!url) {
    showToast('请先设置 Webhook URL');
    return;
  }

  statusEl.textContent = '发送中...';
  statusEl.className = 'status loading';
  webhookBtn.disabled = true;

  try {
    if (type === 'discord') {
      // Discord 格式 - POST 请求
      const discordData = buildDiscordMessage();
      console.log('[Webhook Discord] 请求体:', JSON.stringify(discordData, null, 2));

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discordData)
      });

      console.log('[Webhook Discord] 响应状态:', response.status, response.statusText);

      if (response.ok) {
        statusEl.textContent = 'Discord 发送成功';
        statusEl.className = 'status success';
        showToast('发送成功');
      } else {
        statusEl.textContent = '发送失败';
        statusEl.className = 'status error';
        showToast('发送失败: ' + response.status);
      }
    } else {
      // 默认格式 - GET 请求，URL 拼接参数
      const data = {
        imageUrl: imageUrlEl.value,
        prompt: promptEl.value,
        model: modelEl.value,
        ratio: ratioEl.value,
        quality: qualityEl.value,
        refImageUrl: refImagePreviewEl.src || '',
        refImageType: refImageTypeEl.value,
        timestamp: new Date().toISOString()
      };

      const jsonStr = JSON.stringify(data);
      const encodedJson = encodeURIComponent(jsonStr);
      let requestUrl = url.replace('{json}', encodedJson);

      console.log('[Webhook Default] 最终URL:', requestUrl);

      const response = await fetch(requestUrl, {
        method: 'GET'
      });

      console.log('[Webhook Default] 响应状态:', response.status, response.statusText);

      if (response.ok) {
        statusEl.textContent = 'Webhook 发送成功';
        statusEl.className = 'status success';
        showToast('发送成功');
      } else {
        statusEl.textContent = '发送失败';
        statusEl.className = 'status error';
        showToast('发送失败: ' + response.status);
      }
    }
  } catch (error) {
    console.error('[Webhook] 请求失败:', error);
    statusEl.textContent = '发送失败';
    statusEl.className = 'status error';
    showToast('发送失败: ' + error.message);
  } finally {
    webhookBtn.disabled = false;
  }
}

// 事件监听
refreshBtn.addEventListener('click', fetchImageInfo);
retryBtn.addEventListener('click', fetchImageInfo);
copyBtn.addEventListener('click', copyToClipboard);
saveWebhookBtn.addEventListener('click', saveWebhook);
webhookBtn.addEventListener('click', sendWebhook);

[imageUrlEl, promptEl, modelEl, ratioEl, qualityEl].forEach(el => {
  el.addEventListener('input', updateJsonOutput);
});

// 初始化
loadWebhook();
fetchImageInfo();

// 打开插件时自动关闭水印
async function initCloseWatermark() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.url.includes('jimeng.jianying.com')) {
      await chrome.tabs.sendMessage(tab.id, { action: 'closeWatermark' });
    }
  } catch (e) {
    console.log('关闭水印:', e);
  }
}
initCloseWatermark();
