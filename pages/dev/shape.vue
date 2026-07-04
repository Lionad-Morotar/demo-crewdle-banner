<template>
  <div class="shape-debug-page">
    <ClientOnly>
      <BannerSphere :config="config" class="sphere" />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import GUI from 'lil-gui'
import { onMounted, onUnmounted } from 'vue'

/**
 * dev/shape 调参页面。
 *
 * 单独挂载 BannerSphere 并通过 lil-gui 暴露所有视觉参数，
 * 仅客户端渲染，避免 SSR 访问 DOM/WebGL。
 */
definePageMeta({
  layout: false,
})

useHead({
  title: 'Dev / Shape — Banner Sphere Tuning',
})

const { config, resetConfig } = useSphereConfig()

let gui: GUI | null = null

onMounted(() => {
  gui = new GUI({ title: 'Banner Sphere' })

  const geometry = gui.addFolder('Geometry')
  geometry.add(config.geometry, 'radius', 0.5, 3.0, 0.01)
  geometry.add(config.geometry, 'detail', 0, 28, 1)

  const camera = gui.addFolder('Camera')
  camera.add(config.camera, 'z', 1.0, 8.0, 0.05)

  const materialBase = gui.addFolder('Material / Base')
  materialBase.addColor(config.material, 'color')
  materialBase.addColor(config.material, 'emissive')
  materialBase.add(config.material, 'metalness', 0, 1, 0.01)
  materialBase.add(config.material, 'roughness', 0, 1, 0.01)

  const materialGlass = gui.addFolder('Material / Glass')
  materialGlass.add(config.material, 'transmission', 0, 1, 0.01)
  materialGlass.add(config.material, 'thickness', 0, 10, 0.1)
  materialGlass.add(config.material, 'ior', 1.0, 2.5, 0.01)

  const materialCoat = gui.addFolder('Material / Coat')
  materialCoat.add(config.material, 'clearcoat', 0, 1, 0.01)
  materialCoat.add(config.material, 'clearcoatRoughness', 0, 1, 0.01)

  const materialIrid = gui.addFolder('Material / Iridescence')
  materialIrid.add(config.material, 'iridescence', 0, 1, 0.01)
  materialIrid.add(config.material, 'iridescenceIOR', 1.0, 2.5, 0.01)
  materialIrid.add(config.material, 'iridescenceThicknessMin', 0, 1000, 10)
  materialIrid.add(config.material, 'iridescenceThicknessMax', 0, 1000, 10)

  const envMap = gui.addFolder('Lighting / EnvMap')
  envMap.add(config.material, 'envMapIntensity', 0, 5, 0.05)

  const noiseLow = gui.addFolder('Noise / Low Freq')
  noiseLow.add(config.noise, 'lowFreq', 0, 2, 0.01)
  noiseLow.add(config.noise, 'lowAmp', 0, 0.5, 0.001)
  noiseLow.add(config.noise, 'lowSpeed', 0, 0.5, 0.001)

  const noiseHigh = gui.addFolder('Noise / High Freq')
  noiseHigh.add(config.noise, 'highFreq', 0, 5, 0.01)
  noiseHigh.add(config.noise, 'highAmp', 0, 0.2, 0.001)
  noiseHigh.add(config.noise, 'highSpeed', 0, 1, 0.001)

  const noiseMouse = gui.addFolder('Noise / Mouse')
  noiseMouse.add(config.noise, 'mouseInfluence', 0, 0.3, 0.001)

  const mouseSmooth = gui.addFolder('Mouse / Smoothing')
  mouseSmooth.add(config.mouse, 'lerp', 0, 0.2, 0.001)
  mouseSmooth.add(config.mouse, 'idleDecay', 0, 0.1, 0.001)

  const bloom = gui.addFolder('Post / Bloom')
  bloom.add(config.bloom, 'enabled')
  bloom.add(config.bloom, 'threshold', 0, 1, 0.01)
  bloom.add(config.bloom, 'strength', 0, 1, 0.01)
  bloom.add(config.bloom, 'radius', 0, 1, 0.01)

  function resetAndRefresh() {
    resetConfig()
    // 让当前聚焦的输入框失去焦点，确保 lil-gui 控制器重新读取对象值并刷新显示
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

  gui.add({ reset: resetAndRefresh }, 'reset')
  gui.add({ export: exportAsCode }, 'export')
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
