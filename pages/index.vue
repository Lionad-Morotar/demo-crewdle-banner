<template>
  <div class="banner-page">
    <AppHeader />
    <BannerHero />
  </div>
</template>

<script setup lang="ts">
/**
 * 首页：复刻 Crewdle Banner 首屏。
 */
useHead({
  title: 'Crewdle AI: AI works for you. Not the opposite.',
  meta: [
    { name: 'description', content: 'All the AI your business needs, without the hassle. No subscription. Pay only for what you use.' },
  ],
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap' },
  ],
})
</script>

<style scoped>
.banner-page {
  min-height: 100%;
  background-color: rgb(21, 17, 13);
  position: relative;
}
</style>
