<template>
  <div class="shape-tour-page">
    <!-- 左侧步骤面板 -->
    <aside class="tour-sidebar" aria-label="构建步骤">
      <div class="sidebar-header">
        <h1 class="sidebar-title">Shape Tour</h1>
        <p class="sidebar-subtitle">一步步构建 Crewdle Banner 的 3D 球体</p>
      </div>

      <nav class="step-list">
        <button
          v-for="(step, index) in steps"
          :key="step.id"
          type="button"
          class="step-item"
          :class="{ 'is-active': index === activeStepIndex }"
          @click="selectStepAndPulse(index)"
        >
          <span class="step-number">{{ index }}</span>
          <span class="step-title">{{ step.title }}</span>
        </button>
      </nav>

      <div class="sidebar-actions">
        <button type="button" class="tour-btn" @click="completeAll">
          全部完成
        </button>
        <button type="button" class="tour-btn tour-btn-ghost" @click="resetTourAndPulse">
          重置
        </button>
        <button type="button" class="tour-btn tour-btn-ghost" title="复位视角 (R)" @click="resetCamera">
          视角
        </button>
      </div>
    </aside>

    <!-- 中央视觉区 -->
    <main class="tour-stage" aria-label="Shape 预览">
      <ClientOnly>
        <BannerSphere
          ref="sphereRef"
          :config="tourConfig"
          enable-camera-control
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
import GUI from 'lil-gui'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import type BannerSphere from '~/components/BannerSphere.vue'
import { addController, getGuiFieldMeta, getPatchFieldPaths } from '~/utils/tourGuiFolders'

/**
 * dev/shape-tour 交互式构建教学页。
 *
 * 左侧为步骤选择（无锁定，点击任意步骤即可跳转），右侧 3D 预览，
 * 右上角 lil-gui 仅展示当前 step 涉及的分步参数，底部为教学卡片。
 */
definePageMeta({
  layout: false,
})

useHead({
  title: 'Dev / Shape Tour — Banner Sphere Builder',
})

const sphereRef = ref<InstanceType<typeof BannerSphere> | null>(null)

const { steps, activeStepIndex, tourConfig, currentStep, selectStep, completeAll, resetTour } = useSphereTour()

const isPulsing = ref(false)

let pulseTimeout = 0

/**
 * 触发一次视觉脉冲，让学习者感知 shape 已重新渲染。
 */
function triggerPulse() {
  isPulsing.value = true
  window.clearTimeout(pulseTimeout)
  pulseTimeout = window.setTimeout(() => {
    isPulsing.value = false
  }, 150)
}

function selectStepAndPulse(index: number) {
  selectStep(index)
  triggerPulse()
}

function resetTourAndPulse() {
  resetTour()
  triggerPulse()
}

function resetCamera() {
  sphereRef.value?.resetCamera()
}

// ── 分步调参面板 ──
let gui: GUI | null = null

function buildStepGui(root: GUI, stepIndex: number) {
  const step = steps[stepIndex]
  if (!step) return
  const fields = getPatchFieldPaths(step.patch)
  const folders = new Map<string, GUI>()

  function getFolder(name: string): GUI {
    if (!folders.has(name)) {
      folders.set(name, root.addFolder(name))
    }
    return folders.get(name)!
  }

  for (const key of fields) {
    const meta = getGuiFieldMeta(key)
    if (!meta) continue
    const folder = getFolder(meta.folder)
    addController(folder, tourConfig, key)
  }
}

function rebuildGui() {
  if (!gui) return
  gui.destroy()
  gui = new GUI({ title: 'Step Params' })
  buildStepGui(gui, activeStepIndex.value)
}

onMounted(() => {
  gui = new GUI({ title: 'Step Params' })
  buildStepGui(gui, activeStepIndex.value)
})

onUnmounted(() => {
  window.clearTimeout(pulseTimeout)
  gui?.destroy()
  gui = null
})

watch(activeStepIndex, rebuildGui)
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
  color: rgb(241, 235, 226);
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
  text-align: left;
}

.step-item:hover {
  background-color: rgba(255, 255, 255, 0.06);
}

.step-item.is-active {
  border-color: rgba(255, 83, 34, 0.5);
  background-color: rgba(255, 83, 34, 0.08);
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

/* 让 lil-gui 面板在暗色页面上更醒目 */
:global(.lil-gui) {
  --background-color: rgba(30, 25, 20, 0.92);
  --text-color: rgb(241, 235, 226);
  --title-background-color: rgb(255, 83, 34);
  --widget-color: rgba(255, 255, 255, 0.12);
  --hover-color: rgba(255, 255, 255, 0.18);
  --focus-color: rgba(255, 83, 34, 0.5);
  --number-color: rgb(255, 180, 120);
  --string-color: rgb(140, 220, 160);
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
