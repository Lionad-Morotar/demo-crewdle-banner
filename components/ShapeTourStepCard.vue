<template>
  <article class="step-card" aria-label="当前步骤说明">
    <header class="step-card-header">
      <span class="step-card-badge">Step {{ stepIndex }}</span>
      <h2 class="step-card-title">{{ step.title }}</h2>
    </header>

    <p class="step-card-description">{{ step.description }}</p>

    <section class="step-card-section" aria-label="关键技术点">
      <h3 class="step-card-section-title">关键技术</h3>
      <ul class="step-card-list">
        <li v-for="(technique, index) in step.techniques" :key="index" class="step-card-item">
          {{ technique }}
        </li>
      </ul>
    </section>

    <section class="step-card-section" aria-label="代码位置">
      <h3 class="step-card-section-title">代码位置</h3>
      <dl class="code-location-list">
        <div v-for="(location, index) in resolvedLocations" :key="index" class="code-location">
          <dt class="code-location-label">{{ location.label }}</dt>
          <dd class="code-location-path" :class="{ 'is-missing': location.isMissing }">
            {{ location.path }}
          </dd>
        </div>
      </dl>
    </section>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SphereTourStep } from '~/utils/sphereTourSteps'
import markerMap from '~/assets/tour-markers.json'

/**
 * 单个步骤的教学卡片。
 *
 * 展示当前步骤的标题、效果说明、关键技术点与对应代码路径。
 * 代码路径中的行号由 marker 在构建期解析生成，避免行号腐烂。
 */
interface Props {
  step: SphereTourStep
  stepIndex: number
}

const props = defineProps<Props>()

interface MarkerLocation {
  file: string
  line: number
}

const resolvedLocations = computed(() =>
  props.step.codeLocations.map((location) => {
    const resolved = (markerMap as Record<string, MarkerLocation>)[location.marker]
    if (!resolved) {
      return {
        label: location.label,
        path: `${location.marker} (marker missing)`,
        isMissing: true,
      }
    }
    return {
      label: location.label,
      path: `${resolved.file}:${resolved.line}`,
      isMissing: false,
    }
  })
)
</script>

<style scoped>
.step-card {
  position: fixed;
  left: 304px;
  right: 24px;
  bottom: 24px;
  z-index: 30;
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr;
  gap: 24px;
  padding: 20px 24px;
  border-radius: 16px;
  background-color: rgba(18, 14, 11, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.35);
}

.step-card-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.step-card-badge {
  width: fit-content;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: rgb(255, 255, 255);
  background-color: rgb(255, 83, 34);
}

.step-card-title {
  font-family: 'TroisMille', Inter, system-ui, sans-serif;
  font-size: 18px;
  font-weight: 500;
  margin: 0;
  color: rgb(241, 235, 226);
}

.step-card-description {
  font-size: 13px;
  line-height: 1.55;
  color: rgb(165, 152, 142);
  margin: 0;
}

.step-card-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.step-card-section-title {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgb(140, 130, 122);
  margin: 0;
}

.step-card-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.step-card-item {
  position: relative;
  padding-left: 14px;
  font-size: 12px;
  line-height: 1.45;
  color: rgb(210, 200, 190);
}

.step-card-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 7px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background-color: rgb(140, 220, 160);
}

.code-location-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
}

.code-location {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.code-location-label {
  font-size: 12px;
  font-weight: 500;
  color: rgb(241, 235, 226);
}

.code-location-path {
  font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
  font-size: 11px;
  color: rgb(255, 180, 120);
  margin: 0;
}

.code-location-path.is-missing {
  color: rgb(255, 100, 100);
}

@media (max-width: 1024px) {
  .step-card {
    left: 24px;
    grid-template-columns: 1fr;
    gap: 16px;
    max-height: 34vh;
    overflow-y: auto;
  }
}

@media (max-width: 768px) {
  .step-card {
    left: 16px;
    right: 16px;
    bottom: 16px;
  }
}
</style>
