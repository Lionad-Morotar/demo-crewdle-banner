import { describe, expect, it } from 'vitest'
import { createDefaultConfig } from '~/composables/useSphereConfig'
import { useSphereTour } from '~/composables/useSphereTour'
import { createTourBaseConfig, createTourSteps, mergePatches, verifyTourMatchesDefault } from '~/utils/sphereTourSteps'

describe('sphereTourSteps', () => {
  it('全部 patch 累加后应等于生产默认配置', () => {
    expect(verifyTourMatchesDefault()).toBe(true)
  })

  it('mergePatches 从基准配置开始应用所有 patch 得到完整配置', () => {
    const steps = createTourSteps()
    const final = mergePatches(createTourBaseConfig(), steps.map(s => s.patch))
    expect(final).toEqual(createDefaultConfig())
  })

  it('Step 0 是最简基准配置', () => {
    expect(createTourBaseConfig().geometry.detail).toBe(1)
    expect(createTourBaseConfig().material.transmission).toBe(0)
    expect(createTourBaseConfig().bloom.enabled).toBe(false)
  })
})

describe('useSphereTour', () => {
  it('初始状态为 Step 0 且 tourConfig 引用稳定', () => {
    const { activeStepIndex, tourConfig, currentStep } = useSphereTour()
    expect(activeStepIndex.value).toBe(0)
    expect(currentStep.value?.id).toBe('base-geometry')
    expect(tourConfig.geometry.detail).toBe(1)
  })

  it('selectStep 允许直接选择任意步骤', () => {
    const { activeStepIndex, selectStep } = useSphereTour()
    expect(activeStepIndex.value).toBe(0)
    selectStep(5)
    expect(activeStepIndex.value).toBe(5)
    selectStep(1)
    expect(activeStepIndex.value).toBe(1)
  })

  it('selectStep 回退会清空后续步骤状态', () => {
    const { activeStepIndex, tourConfig, completeAll, selectStep } = useSphereTour()
    completeAll()
    expect(activeStepIndex.value).toBe(8)
    expect(tourConfig.bloom.enabled).toBe(true)

    selectStep(1)
    expect(activeStepIndex.value).toBe(1)
    expect(tourConfig.bloom.enabled).toBe(false)
    expect(tourConfig.geometry.detail).toBe(12)
  })

  it('completeAll 后回到 Step 0 的配置是最简基准', () => {
    const { activeStepIndex, tourConfig, completeAll, resetTour } = useSphereTour()
    completeAll()
    resetTour()
    expect(activeStepIndex.value).toBe(0)
    expect(tourConfig.geometry.detail).toBe(1)
    expect(tourConfig.material.transmission).toBe(0)
  })

  it('completeAll 后的 tourConfig 等于生产默认配置', () => {
    const { tourConfig, completeAll } = useSphereTour()
    completeAll()
    expect(tourConfig).toEqual(createDefaultConfig())
  })
})
