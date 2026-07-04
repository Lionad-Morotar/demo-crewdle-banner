<template>
  <div class="shape-tour-page">
    <!-- 左侧步骤面板 -->
    <aside class="tour-sidebar" aria-label="构建步骤">
      <div class="sidebar-header">
        <h1 class="sidebar-title">Shape Tour</h1>
        <p class="sidebar-subtitle">一步步构建 Crewdle Banner 的 3D 球体</p>
      </div>

      <nav class="step-list">
        <label
          v-for="(step, index) in steps"
          :key="step.id"
          class="step-item"
          :class="{
            'is-active': index === activeStepIndex,
            'is-completed': completedSteps[index],
            'is-locked': index > activeStepIndex + 1,
          }"
        >
          <input
            type="checkbox"
            class="step-checkbox"
            :checked="completedSteps[index]"
            :disabled="index > activeStepIndex + 1"
            @click.prevent="handleToggle(index)"
          />
          <span class="step-number">{{ index }}</span>
          <span class="step-title">{{ step.title }}</span>
        </label>
      </nav>

      <div class="sidebar-actions">
        <button type="button" class="tour-btn" @click="completeAll">
          全部完成
        </button>
        <button type="button" class="tour-btn tour-btn-ghost" @click="resetTour">
          重置
        </button>
      </div>
    </aside>

    <!-- 中央视觉区 -->
    <main class="tour-stage" aria-label="Shape 预览">
      <ClientOnly>
        <BannerSphere
          :config="tourConfig"
          class="sphere"
          :class="{ 'is-pulsing': isPulsing }"
        />
      </ClientOnly>
    </main>

    <!-- 底部教学卡片 -->
    <ShapeTourStepCard :step="currentStep" :step-index="activeStepIndex" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

/**
 * dev/shape-tour 交互式构建教学页。
 *
 * 以步骤勾选的方式让 UI/UX 与动效设计师理解 BannerSphere
 * 从基础几何体到最终视觉的完整构建过程。
 */
definePageMeta({
  layout: false,
})

useHead({
  title: 'Dev / Shape Tour — Banner Sphere Builder',
})

const { steps, activeStepIndex, completedSteps, tourConfig, currentStep, toggleStep, completeAll, resetTour } = useSphereTour()

const isPulsing = ref(false)

/**
 * 触发一次视觉脉冲，让学习者感知 shape 已重新渲染。
 */
function triggerPulse() {
  isPulsing.value = true
  window.setTimeout(() => {
    isPulsing.value = false
  }, 150)
}

function handleToggle(index: number) {
  toggleStep(index)
  triggerPulse()
}
</script>

<style scoped>
.shape-tour-page {
  position: fixed;
  inset: 0;
  display: grid;
  grid-template-columns: 280px 1fr;
  background-color: rgb(21, 17, 13);
  color: rgb(241, 235, 226);
}

.tour-sidebar {
  grid-row: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  background-color: rgba(18, 14, 11, 0.96);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  overflow-y: auto;
}

.sidebar-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sidebar-title {
  font-family: 'TroisMille', Inter, system-ui, sans-serif;
  font-size: 22px;
  font-weight: 500;
  margin: 0;
  color: rgb(255, 83, 34);
}

.sidebar-subtitle {
  font-size: 12px;
  line-height: 1.4;
  color: rgb(165, 152, 142);
  margin: 0;
}

.step-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 10px;
  background-color: rgba(255, 255, 255, 0.03);
  border: 1px solid transparent;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.step-item:hover {
  background-color: rgba(255, 255, 255, 0.06);
}

.step-item.is-active {
  border-color: rgba(255, 83, 34, 0.5);
  background-color: rgba(255, 83, 34, 0.08);
}

.step-item.is-locked {
  opacity: 0.45;
  cursor: not-allowed;
}

.step-checkbox {
  width: 18px;
  height: 18px;
  accent-color: rgb(255, 83, 34);
  cursor: pointer;
  flex-shrink: 0;
}

.step-item.is-locked .step-checkbox {
  cursor: not-allowed;
}

.step-number {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
  background-color: rgba(255, 255, 255, 0.08);
  color: rgb(165, 152, 142);
  flex-shrink: 0;
}

.step-item.is-active .step-number {
  background-color: rgb(255, 83, 34);
  color: rgb(255, 255, 255);
}

.step-item.is-completed .step-number {
  background-color: rgba(140, 220, 160, 0.18);
  color: rgb(140, 220, 160);
}

.step-title {
  font-size: 13px;
  font-weight: 500;
  color: rgb(241, 235, 226);
}

.sidebar-actions {
  display: flex;
  gap: 8px;
  margin-top: auto;
}

.tour-btn {
  flex: 1;
  padding: 10px 12px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: rgb(255, 255, 255);
  background-color: rgb(255, 83, 34);
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.tour-btn:hover {
  background-color: rgb(255, 100, 50);
}

.tour-btn-ghost {
  background-color: rgba(255, 255, 255, 0.08);
  color: rgb(241, 235, 226);
}

.tour-btn-ghost:hover {
  background-color: rgba(255, 255, 255, 0.12);
}

.tour-stage {
  position: relative;
  grid-column: 2;
  grid-row: 1;
  overflow: hidden;
}

.sphere {
  position: absolute;
  inset: 0;
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.sphere.is-pulsing {
  opacity: 0.85;
  transform: scale(0.985);
}

@media (max-width: 768px) {
  .shape-tour-page {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr auto;
  }

  .tour-sidebar {
    grid-row: 1;
    grid-column: 1;
    max-height: 38vh;
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  .tour-stage {
    grid-row: 2;
    grid-column: 1;
  }
}
</style>
