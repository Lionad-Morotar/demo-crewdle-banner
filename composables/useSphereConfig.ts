import { reactive } from 'vue'

/**
 * BannerSphere 视觉配置模型。
 *
 * 所有可调试参数集中在此，生产页与 dev/shape 调参页共享同一默认值，
 * 避免两者漂移。
 */

export interface SphereGeometryConfig {
  /** 球体基础半径 */
  radius: number
  /** IcosahedronGeometry 细分等级 */
  detail: number
}

export interface SphereCameraConfig {
  /** 相机沿 Z 轴距离 */
  z: number
}

export interface SphereMaterialConfig {
  /** 基础色 */
  color: string
  /** 自发光色 */
  emissive: string
  /** 金属度 */
  metalness: number
  /** 粗糙度 */
  roughness: number
  /** 透光率 */
  transmission: number
  /** 厚度（用于模拟体积透光） */
  thickness: number
  /** 折射率 */
  ior: number
  /** 清漆强度 */
  clearcoat: number
  /** 清漆粗糙度 */
  clearcoatRoughness: number
  /** 虹彩强度 */
  iridescence: number
  /** 虹彩折射率 */
  iridescenceIOR: number
  /** 虹彩厚度最小值 */
  iridescenceThicknessMin: number
  /** 虹彩厚度最大值 */
  iridescenceThicknessMax: number
  /** 环境贴图强度 */
  envMapIntensity: number
}

export interface SphereNoiseConfig {
  /** 低频噪声空间频率 */
  lowFreq: number
  /** 低频噪声位移幅度 */
  lowAmp: number
  /** 低频噪声时间速度 */
  lowSpeed: number
  /** 高频噪声空间频率 */
  highFreq: number
  /** 高频噪声位移幅度 */
  highAmp: number
  /** 高频噪声时间速度 */
  highSpeed: number
  /** 鼠标驱动局部形变强度 */
  mouseInfluence: number
}

export interface SphereMouseConfig {
  /** 鼠标位置向目标值的插值系数 */
  lerp: number
  /** 鼠标静止时当前值向中心衰减的系数 */
  idleDecay: number
}

export interface SphereBloomConfig {
  /** 是否启用 UnrealBloomPass */
  enabled: boolean
  /** 亮度阈值 */
  threshold: number
  /** 辉光强度 */
  strength: number
  /** 辉光半径 */
  radius: number
}

export interface SphereConfig {
  geometry: SphereGeometryConfig
  camera: SphereCameraConfig
  material: SphereMaterialConfig
  noise: SphereNoiseConfig
  mouse: SphereMouseConfig
  bloom: SphereBloomConfig
}

/**
 * 默认配置。
 *
 * 该默认值应与当前生产视觉效果保持一致；dev/shape 页面打开时即呈现此效果。
 */
export function createDefaultConfig(): SphereConfig {
  return {
    geometry: {
      radius: 1,
      detail: 12,
    },
    camera: {
      z: 3.45,
    },
    material: {
      color: '#241a14',
      emissive: '#120d0a',
      metalness: 0.08,
      roughness: 0.26,
      transmission: 0.50,
      thickness: 3.5,
      ior: 1.30,
      clearcoat: 0.55,
      clearcoatRoughness: 0.28,
      iridescence: 0.90,
      iridescenceIOR: 1.42,
      iridescenceThicknessMin: 160,
      iridescenceThicknessMax: 520,
      envMapIntensity: 2.60,
    },
    noise: {
      lowFreq: 0.45,
      lowAmp: 0.07,
      lowSpeed: 0.05,
      highFreq: 1.55,
      highAmp: 0.022,
      highSpeed: 0.10,
      mouseInfluence: 0.060,
    },
    mouse: {
      lerp: 0.038,
      idleDecay: 0.015,
    },
    bloom: {
      enabled: true,
      threshold: 0.92,
      strength: 0.10,
      radius: 0.45,
    },
  }
}

/**
 * 深拷贝配置对象，用于 Reset 或导出时避免引用污染。
 */
export function cloneConfig(config: SphereConfig): SphereConfig {
  return JSON.parse(JSON.stringify(config))
}

/**
 * 将配置序列化为格式化的 JSON 字符串。
 */
export function exportConfig(config: SphereConfig): string {
  return JSON.stringify(config, null, 2)
}

/**
 * BannerSphere 配置的可复用状态。
 *
 * 返回响应式 config 与恢复默认、导出配置的便捷方法。
 * 生产页与调参页共用同一默认工厂，避免视觉漂移。
 */
export function useSphereConfig() {
  const defaultConfig = createDefaultConfig()
  const config = reactive<SphereConfig>(cloneConfig(defaultConfig))

  function resetConfig() {
    const fresh = createDefaultConfig()
    Object.assign(config.geometry, fresh.geometry)
    Object.assign(config.camera, fresh.camera)
    Object.assign(config.material, fresh.material)
    Object.assign(config.noise, fresh.noise)
    Object.assign(config.mouse, fresh.mouse)
    Object.assign(config.bloom, fresh.bloom)
  }

  function exportCurrentConfig(): string {
    return exportConfig(config)
  }

  return {
    defaultConfig,
    config,
    resetConfig,
    exportConfig: exportCurrentConfig,
  }
}
