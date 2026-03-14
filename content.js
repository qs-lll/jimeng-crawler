// 从页面提取AI图片信息
function extractImageInfo() {
  const result = {
    imageUrl: "",
    prompt: "",
    model: "",
    ratio: "",
    quality: "",
    refImageUrl: "",
    refImageType: ""
  };

  try {
    // 1. 获取主图片 - 多种方式尝试
    let imgElement = document.querySelector('img[data-apm-action="ai-generated-image-detail-card"]');

    // 如果找不到，尝试其他方式
    if (!imgElement || !imgElement.src) {
      // 查找大图
      const allImages = document.querySelectorAll('img');
      for (const img of allImages) {
        if (img.src && img.src.includes('webp') && img.naturalWidth > 500) {
          imgElement = img;
          break;
        }
      }
    }

    if (imgElement && imgElement.src) {
      result.imageUrl = imgElement.src;
    }

    // 2. 获取提示词和详细信息
    const detailContainer = document.querySelector('.detail-info-uin_og');

    if (detailContainer) {
      // 提示词 - 多种选择器尝试
      let promptSpan = detailContainer.querySelector('.prompt-value-text-_SHupC span');
      if (!promptSpan) {
        promptSpan = detailContainer.querySelector('.prompt-value-container-KCtKOf span');
      }
      if (promptSpan) {
        result.prompt = promptSpan.textContent.trim();
      }

      // 参考图
      let refContainer = detailContainer.querySelector('.container-yzZWZG');
      if (refContainer) {
        const refImg = refContainer.querySelector('img');
        if (refImg && refImg.src) {
          result.refImageUrl = refImg.src;
        }
        const refText = refContainer.querySelector('.text-AnWyUb');
        if (refText) {
          result.refImageType = refText.textContent.trim();
        }
      }

      // 提取参数
      const text = detailContainer.textContent;

      // 图片版本
      const imgMatch = text.match(/图片\s*([\d.]+)/);
      if (imgMatch) result.model = imgMatch[1];

      // 比例
      const ratioMatch = text.match(/(\d+:\d+)/);
      if (ratioMatch) result.ratio = ratioMatch[1];

      // 质量
      const qualityMatch = text.match(/(4K|2K)/);
      if (qualityMatch) result.quality = qualityMatch[1];
    }

    console.log('[AI Info] 提取结果:', result);

  } catch (e) {
    console.error('[AI Info] 提取失败:', e);
  }

  return result;
}

// 关闭水印
async function closeWatermark() {
  console.log('[AI Info] 开始关闭水印...');
  try {
    const response = await fetch('https://jimeng.jianying.com/mweb/v1/update_settings', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        custom_settings: {
          close_watermark: true,
          close_watermark_popup_tip: true
        }
      })
    });

    const data = await response.json();
    console.log('[AI Info] 关闭水印结果:', data);
    return data;
  } catch (error) {
    console.error('[AI Info] 关闭水印失败:', error);
  }
}

// 监听消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getImageInfo') {
    console.log('[AI Info] 收到请求');
    const info = extractImageInfo();
    console.log('[AI Info] 返回数据:', info);
    sendResponse(info);
  } else if (request.action === 'closeWatermark') {
    console.log('[AI Info] 收到关闭水印请求');
    closeWatermark().then(result => sendResponse(result));
    return true; // 异步响应
  }
  return true;
});

console.log('[AI Info] Content script 已加载');
