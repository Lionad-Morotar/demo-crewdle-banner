<template>
  <div class="shape-debug-page">
    <!-- 中央视觉区 -->
    <main class="shape-stage" aria-label="Shape 预览">
      <ClientOnly>
        <BannerSphere :config="config" enable-camera-control class="sphere" />
      </ClientOnly>
    </main>
  </div>
</template>

<script setup lang="ts">
import GUI from 'lil-gui'
import { onMounted, onUnmounted } from 'vue'
import { useSphereConfig } from '~/composables/useSphereConfig'
import { addController, TOUR_GUI_FIELDS } from '~/utils/tourGuiFolders'

/**
 * dev/shape 调参页面。
 *
 * 提供完整的 lil-gui 全参数面板，供设计师自由探索所有视觉参数。
 * 分步调参面板已移至 dev/shape-tour。
 */
definePageMeta({
  layout: false,
})

useHead({
  title: 'Dev / Shape — Banner Sphere Tuning',
})

const { config, resetConfig } = useSphereConfig()

let gui: GUI | null = null

function buildAllParamsGui(root: GUI) {
  const folders = new Map<string, GUI>()

  function getFolder(name: string): GUI {
    if (!folders.has(name)) {
      folders.set(name, root.addFolder(name))
    }
    return folders.get(name)!
  }

  for (const meta of TOUR_GUI_FIELDS) {
    const folder = getFolder(meta.folder)
    addController(folder, config, meta.key)
  }

  function resetAndRefresh() {
    resetConfig()
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    gui?.controllersRecursive().forEach(controller => controller.updateDisplay())
  }

  function exportAsCode() {
    const c = config
    const code = `createDefaultConfig(): SphereConfig {
  return {
    geometry: {
      radius: ${c.geometry.radius},
      detail: ${c.geometry.detail},
    },
    camera: {
      z: ${c.camera.z},
    },
    material: {
      color: '${c.material.color}',
      emissive: '${c.material.emissive}',
      metalness: ${c.material.metalness},
      roughness: ${c.material.roughness},
      transmission: ${c.material.transmission},
      thickness: ${c.material.thickness},
      ior: ${c.material.ior},
      clearcoat: ${c.material.clearcoat},
      clearcoatRoughness: ${c.material.clearcoatRoughness},
      iridescence: ${c.material.iridescence},
      iridescenceIOR: ${c.material.iridescenceIOR},
      iridescenceThicknessMin: ${c.material.iridescenceThicknessMin},
      iridescenceThicknessMax: ${c.material.iridescenceThicknessMax},
      envMapIntensity: ${c.material.envMapIntensity},
    },
    noise: {
      lowFreq: ${c.noise.lowFreq},
      lowAmp: ${c.noise.lowAmp},
      lowSpeed: ${c.noise.lowSpeed},
      highFreq: ${c.noise.highFreq},
      highAmp: ${c.noise.highAmp},
      highSpeed: ${c.noise.highSpeed},
      mouseInfluence: ${c.noise.mouseInfluence},
    },
    mouse: {
      lerp: ${c.mouse.lerp},
      idleDecay: ${c.mouse.idleDecay},
    },
    bloom: {
      enabled: ${c.bloom.enabled},
      threshold: ${c.bloom.threshold},
      strength: ${c.bloom.strength},
      radius: ${c.bloom.radius},
    },
  }
}`
    // eslint-disable-next-line no-console
    console.log(code)
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).catch(() => {
        // 剪贴板写入失败时已在控制台输出代码，不影响使用
      })
    }
  }

  root.add({ reset: resetAndRefresh }, 'reset')
  root.add({ export: exportAsCode }, 'export')
}

onMounted(() => {
  gui = new GUI({ title: 'Banner Sphere' })
  buildAllParamsGui(gui)
})

onUnmounted(() => {
  gui?.destroy()
  gui = null
})
</script>

<style scoped>
.shape-debug-page {
  position: fixed;
  inset: 0;
  background-color: rgb(21, 17, 13);
  color: rgb(241, 235, 226);
}

.shape-stage {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.sphere {
  position: absolute;
  inset: 0;
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
</style>
