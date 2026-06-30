<template>
  <section class="hero" aria-label="Hero">
    <!-- 背景球体 -->
    <BannerSphere />

    <!-- 背景环境光晕 -->
    <div class="ambient-glow" aria-hidden="true"></div>

    <!-- 右上角提示卡片 -->
    <div class="tip-card" aria-hidden="true">
      <div class="tip-eyebrow">
        <span class="tip-dot" aria-hidden="true"></span>
        <span>AI CLASSES · LIMITED OFFER</span>
      </div>
      <span class="tip-title">Free website included</span>
      <span class="tip-link">See the offer →</span>
    </div>

    <!-- 主内容：标题 + 副标题 -->
    <div class="hero-content">
      <h1 class="hero-title">
        <span class="line">AI works for you.</span>
        <span class="line accent">Not the opposite.</span>
      </h1>

      <p class="hero-subtitle">
        All the AI your business needs, without the hassle.<br />
        No subscription. Pay only for what you use.<br />
        Made in Montréal.
      </p>
    </div>

    <!-- 左下角 Product Hunt 徽章 -->
    <a class="ph-badge" href="https://www.producthunt.com" target="_blank" rel="noopener">
      <span class="ph-logo" aria-hidden="true">
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="20" fill="#FF6154"/>
          <path d="M13 11h8.5a4.5 4.5 0 0 1 0 9H19v9h-6V11Z" fill="white"/>
          <path d="M19 20h5l-7 10v-6h-2l4-4Z" fill="white"/>
        </svg>
      </span>
      <span class="ph-content">
        <span class="ph-eyebrow">FEATURED ON</span>
        <span class="ph-title">Product Hunt <strong>304</strong></span>
      </span>
    </a>

    <!-- 右下角 CTA + demo 文案 -->
    <div class="right-bottom-group">
      <a class="cta-btn" href="https://auth.crewdle.ai/signup" target="_blank" rel="noopener">
        <span>Start for free</span>
        <span class="cta-arrow">→</span>
      </a>
      <a class="demo-link" href="#demo" target="_blank" rel="noopener">Or book a 30-minute demo →</a>
      <span class="credits-note">Free credits when you sign up.</span>
    </div>

    <!-- 右下角聊天按钮 -->
    <button class="chat-btn" type="button" aria-label="Open chat">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  </section>
</template>

<script setup lang="ts">
/**
 * 复刻 Crewdle 首屏 Banner：
 * - 深色背景 + 中央 3D 光泽球体
 * - 左侧大标题，第二行使用品牌橙红色
 * - 左下角 Product Hunt 官方风格徽章
 * - 右下角 Start for free CTA
 * - 右上角促销提示卡片
 */
</script>

<style scoped>
.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0 64px;
  overflow: hidden;
}

.ambient-glow {
  position: absolute;
  top: 58%;
  left: 58%;
  width: 200vw;
  height: 200vw;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 115, 50, 0.16) 0%,
    rgba(255, 95, 40, 0.07) 30%,
    transparent 66%
  );
  pointer-events: none;
  z-index: 0;
}

.hero-content {
  position: relative;
  z-index: 10;
  max-width: 760px;
  padding-top: 80px;
}

.hero-title {
  font-family: 'TroisMille', Inter, system-ui, sans-serif;
  font-size: clamp(48px, 8.6vw, 124px);
  font-weight: 400;
  line-height: 0.96;
  letter-spacing: -0.015em;
  color: rgb(241, 235, 226);
  margin-bottom: 32px;
}

.hero-title .line {
  display: block;
  white-space: nowrap;
}

.hero-title .accent {
  color: rgb(255, 83, 34);
}

.hero-subtitle {
  font-size: 17px;
  line-height: 1.6;
  color: rgb(165, 152, 142);
  max-width: 420px;
}

.right-bottom-group {
  position: absolute;
  right: 64px;
  bottom: 64px;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}

.cta-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 500;
  color: rgb(255, 255, 255);
  background-color: rgb(255, 83, 34);
  text-decoration: none;
  padding: 16px 28px;
  border-radius: 999px;
  transition: transform 0.2s ease, background-color 0.2s ease;
}

.demo-link {
  font-size: 13px;
  font-weight: 500;
  color: rgb(241, 235, 226);
  text-decoration: none;
  opacity: 0.85;
  transition: opacity 0.2s ease;
}

.demo-link:hover {
  opacity: 1;
}

.credits-note {
  font-size: 12px;
  font-weight: 400;
  color: rgb(165, 152, 142);
}

.chat-btn {
  position: fixed;
  right: 32px;
  bottom: 32px;
  z-index: 50;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: none;
  background-color: rgb(255, 83, 34);
  color: rgb(255, 255, 255);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 6px 24px rgba(255, 83, 34, 0.35);
  transition: transform 0.2s ease, background-color 0.2s ease;
}

.chat-btn:hover {
  background-color: rgb(255, 100, 50);
  transform: translateY(-2px);
}

.chat-btn svg {
  width: 24px;
  height: 24px;
}

.cta-btn:hover {
  background-color: rgb(255, 100, 50);
  transform: translateY(-1px);
}

.cta-arrow {
  font-size: 16px;
}

.ph-badge {
  position: absolute;
  left: 64px;
  bottom: 64px;
  z-index: 20;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  padding: 10px 14px;
  border-radius: 8px;
  background-color: rgb(255, 255, 255);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease;
}

.ph-badge:hover {
  transform: translateY(-1px);
}

.ph-logo {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ph-logo svg {
  width: 100%;
  height: 100%;
}

.ph-content {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.ph-eyebrow {
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: rgb(120, 110, 105);
  text-transform: uppercase;
}

.ph-title {
  font-size: 13px;
  font-weight: 500;
  color: rgb(34, 29, 26);
}

.ph-title strong {
  font-weight: 700;
  color: rgb(255, 83, 34);
}

.tip-card {
  position: absolute;
  top: 120px;
  right: 64px;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px 20px;
  border-radius: 16px;
  background-color: rgb(255, 255, 255);
  color: rgb(34, 29, 26);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
  font-family: 'TroisMille', Inter, system-ui, sans-serif;
  min-width: 240px;
}

.tip-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: rgb(100, 70, 180);
  text-transform: uppercase;
}

.tip-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: rgb(255, 83, 34);
}

.tip-title {
  font-size: 17px;
  font-weight: 500;
  line-height: 1.15;
  letter-spacing: -0.01em;
  color: rgb(34, 29, 26);
  white-space: nowrap;
}

.tip-link {
  font-size: 12px;
  font-weight: 500;
  color: rgb(255, 83, 34);
  margin-top: 4px;
}

@media (max-width: 1024px) {
  .hero {
    padding: 0 32px;
  }

  .tip-card {
    right: 24px;
    top: 100px;
  }

  .right-bottom-group {
    right: 32px;
    bottom: 48px;
  }

  .chat-btn {
    right: 20px;
    bottom: 20px;
  }

  .ph-badge {
    left: 32px;
    bottom: 48px;
  }
}

@media (max-width: 768px) {
  .hero {
    padding: 0 20px;
    align-items: flex-end;
    padding-bottom: 160px;
  }

  .hero-content {
    padding-top: 0;
  }

  .hero-subtitle {
    font-size: 15px;
  }

  .tip-card {
    display: none;
  }

  .right-bottom-group {
    right: 20px;
    bottom: 90px;
  }

  .chat-btn {
    right: 16px;
    bottom: 16px;
  }

  .ph-badge {
    left: 20px;
    bottom: 90px;
  }
}
</style>
