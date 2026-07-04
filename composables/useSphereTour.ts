import { computed, reactive, ref, watch } from 'vue'
import type { SphereConfig } from '~/composables/useSphereConfig'
import { cloneConfig } from '~/composables/useSphereConfig'
import {
  createTourBaseConfig,
  createTourSteps,
  mergePatches,
} from '~/utils/sphereTourSteps'

/**
 * Shape 构建教学的响应式状态。
 *
 * 维护一个引用稳定的 reactive config，在 activeStepIndex 变化时
 * 用 Object.assign 将目标 patch 增量应用到稳定对象上，从而与
 * BannerSphere 的字段级 watch 契约保持一致——只有真正变化的
 * 字段才会触发对应更新函数。
 */
export function useSphereTour() {
  const steps = createTourSteps()
  const baseConfig = createTourBaseConfig()
  const tourConfig = reactive<SphereConfig>(cloneConfig(baseConfig))
  const activeStepIndex = ref(0)

  /**
   * 将前 index 步的 patch 合并后，增量写入引用稳定的 tourConfig。
   */
  function applyPatchesUpTo(index: number) {
    const patches = steps.slice(0, index + 1).map(s => s.patch)
    const target = mergePatches(baseConfig, patches)
    Object.assign(tourConfig.geometry, target.geometry)
    Object.assign(tourConfig.camera, target.camera)
    Object.assign(tourConfig.material, target.material)
    Object.assign(tourConfig.noise, target.noise)
    Object.assign(tourConfig.mouse, target.mouse)
    Object.assign(tourConfig.bloom, target.bloom)
  }

  // 初始应用 Step 0 的配置
  applyPatchesUpTo(0)

  const completedSteps = computed(() =>
    steps.map((_, index) => index <= activeStepIndex.value)
  )

  const currentStep = computed(() => steps[activeStepIndex.value])

  function toggleStep(index: number) {
    if (index < 0 || index >= steps.length) return

    if (index === activeStepIndex.value + 1) {
      // 前进一步
      activeStepIndex.value = index
    } else if (index <= activeStepIndex.value) {
      // 取消当前或回退到更早步骤
      activeStepIndex.value = index
    }
    // 不允许跳到更远的未来步骤
  }

  function completeAll() {
    activeStepIndex.value = steps.length - 1
  }

  function resetTour() {
    activeStepIndex.value = 0
  }

  watch(activeStepIndex, (newIndex) => {
    applyPatchesUpTo(newIndex)
  }, { flush: 'sync' })

  return {
    steps,
    activeStepIndex,
    completedSteps,
    tourConfig,
    currentStep,
    toggleStep,
    completeAll,
    resetTour,
  }
}
