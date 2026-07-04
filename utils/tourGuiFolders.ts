/**
 * Shape Tour 各 step 涉及的 patch 字段与 lil-gui folder 映射。
 *
 * 用于 dev/shape-tour 页面的分步调参面板：选择 step 后只展示该 step
 * patch 中涉及的字段，让学习者单独调整每一步的参数。
 */

import type GUI from 'lil-gui'
import type { SphereConfig } from '~/composables/useSphereConfig'

export interface GuiFieldMeta {
  /** 配置路径，例如 "geometry.radius" */
  key: string
  /** lil-gui folder 名称 */
  folder: string
  /** 最小值（颜色/布尔值不需要） */
  min?: number
  /** 最大值（颜色/布尔值不需要） */
  max?: number
  /** 步长（颜色/布尔值不需要） */
  step?: number
  /** 是否使用 addColor */
  isColor?: boolean
  /** 是否使用 add (boolean) */
  isBoolean?: boolean
}

/**
 * 所有可调试字段的元数据。
 *
 * 顺序与 lil-gui folder 分组保持一致，便于在"按步骤"模式下重建 folder。
 */
export const TOUR_GUI_FIELDS: GuiFieldMeta[] = [
  // Geometry
  { key: 'geometry.radius', folder: 'Geometry', min: 0.5, max: 3.0, step: 0.01 },
  { key: 'geometry.detail', folder: 'Geometry', min: 0, max: 28, step: 1 },

  // Camera
  { key: 'camera.z', folder: 'Camera', min: 1.0, max: 8.0, step: 0.05 },

  // Material / Base
  { key: 'material.color', folder: 'Material / Base', isColor: true },
  { key: 'material.emissive', folder: 'Material / Base', isColor: true },
  { key: 'material.metalness', folder: 'Material / Base', min: 0, max: 1, step: 0.01 },
  { key: 'material.roughness', folder: 'Material / Base', min: 0, max: 1, step: 0.01 },

  // Material / Glass
  { key: 'material.transmission', folder: 'Material / Glass', min: 0, max: 1, step: 0.01 },
  { key: 'material.thickness', folder: 'Material / Glass', min: 0, max: 10, step: 0.1 },
  { key: 'material.ior', folder: 'Material / Glass', min: 1.0, max: 2.5, step: 0.01 },

  // Material / Coat
  { key: 'material.clearcoat', folder: 'Material / Coat', min: 0, max: 1, step: 0.01 },
  { key: 'material.clearcoatRoughness', folder: 'Material / Coat', min: 0, max: 1, step: 0.01 },

  // Material / Iridescence
  { key: 'material.iridescence', folder: 'Material / Iridescence', min: 0, max: 1, step: 0.01 },
  { key: 'material.iridescenceIOR', folder: 'Material / Iridescence', min: 1.0, max: 2.5, step: 0.01 },
  { key: 'material.iridescenceThicknessMin', folder: 'Material / Iridescence', min: 0, max: 1000, step: 10 },
  { key: 'material.iridescenceThicknessMax', folder: 'Material / Iridescence', min: 0, max: 1000, step: 10 },

  // Lighting / EnvMap
  { key: 'material.envMapIntensity', folder: 'Lighting / EnvMap', min: 0, max: 5, step: 0.05 },

  // Noise / Low Freq
  { key: 'noise.lowFreq', folder: 'Noise / Low Freq', min: 0, max: 2, step: 0.01 },
  { key: 'noise.lowAmp', folder: 'Noise / Low Freq', min: 0, max: 0.5, step: 0.001 },
  { key: 'noise.lowSpeed', folder: 'Noise / Low Freq', min: 0, max: 0.5, step: 0.001 },

  // Noise / High Freq
  { key: 'noise.highFreq', folder: 'Noise / High Freq', min: 0, max: 5, step: 0.01 },
  { key: 'noise.highAmp', folder: 'Noise / High Freq', min: 0, max: 0.2, step: 0.001 },
  { key: 'noise.highSpeed', folder: 'Noise / High Freq', min: 0, max: 1, step: 0.001 },

  // Noise / Mouse
  { key: 'noise.mouseInfluence', folder: 'Noise / Mouse', min: 0, max: 0.3, step: 0.001 },

  // Mouse / Smoothing
  { key: 'mouse.lerp', folder: 'Mouse / Smoothing', min: 0, max: 0.2, step: 0.001 },
  { key: 'mouse.idleDecay', folder: 'Mouse / Smoothing', min: 0, max: 0.1, step: 0.001 },

  // Post / Bloom
  { key: 'bloom.enabled', folder: 'Post / Bloom', isBoolean: true },
  { key: 'bloom.threshold', folder: 'Post / Bloom', min: 0, max: 1, step: 0.01 },
  { key: 'bloom.strength', folder: 'Post / Bloom', min: 0, max: 1, step: 0.01 },
  { key: 'bloom.radius', folder: 'Post / Bloom', min: 0, max: 1, step: 0.01 },
]

/**
 * 根据配置路径获取字段元数据。
 */
export function getGuiFieldMeta(key: string): GuiFieldMeta | undefined {
  return TOUR_GUI_FIELDS.find(f => f.key === key)
}

/**
 * 提取 patch 对象中涉及的所有字段路径。
 *
 * 例如：{ material: { transmission: 0.5, thickness: 3.5 } }
 *       → ["material.transmission", "material.thickness"]
 */
export function getPatchFieldPaths(patch: Record<string, unknown>): string[] {
  const paths: string[] = []
  for (const [category, values] of Object.entries(patch)) {
    if (values && typeof values === 'object') {
      for (const key of Object.keys(values)) {
        paths.push(`${category}.${key}`)
      }
    }
  }
  return paths
}
/**
 * 为 lil-gui folder 添加一个配置控制器。
 *
 * 根据字段元数据自动选择 addColor / add(boolean) / add(number, min, max, step)。
 */
export function addController(folder: GUI, configObj: SphereConfig, key: string) {
  const meta = getGuiFieldMeta(key)
  if (!meta) return

  const parts = key.split('.')
  const fieldKey = parts.pop()!
  const target = parts.reduce<Record<string, unknown> | undefined>(
    (acc, part) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[part] as Record<string, unknown> : undefined),
    configObj as unknown as Record<string, unknown>,
  )

  if (!target || !(fieldKey in target)) return

  if (meta.isColor) {
    folder.addColor(target, fieldKey)
  }
  else if (meta.isBoolean) {
    folder.add(target, fieldKey)
  }
  else if (meta.min !== undefined && meta.max !== undefined) {
    folder.add(target, fieldKey, meta.min, meta.max, meta.step)
  }
}
