import { describe, expect, it } from 'vitest'
import { createTourSteps } from '~/utils/sphereTourSteps'
import { getGuiFieldMeta, TOUR_GUI_FIELDS } from '~/utils/tourGuiFolders'

/**
 * dev/shape "按步骤"模式的参数映射测试。
 *
 * 确保每个 step patch 中涉及的字段都有对应的 lil-gui folder 元数据，
 * 避免切换步骤后某些参数无法显示。
 */
describe('tour gui folders', () => {
  it('every patch field across all steps has gui metadata', () => {
    const steps = createTourSteps()
    const knownFields = new Set(TOUR_GUI_FIELDS.map(f => f.key))
    const missing: { stepId: string; field: string }[] = []

    for (const step of steps) {
      for (const category of Object.keys(step.patch)) {
        const group = (step.patch as Record<string, Record<string, unknown>>)[category]
        if (!group) continue
        for (const field of Object.keys(group)) {
          const key = `${category}.${field}`
          if (!knownFields.has(key)) {
            missing.push({ stepId: step.id, field: key })
          }
        }
      }
    }

    expect(missing).toEqual([])
  })

  it('getGuiFieldMeta returns metadata for every known field', () => {
    for (const field of TOUR_GUI_FIELDS) {
      expect(getGuiFieldMeta(field.key)).toBe(field)
    }
  })
})
