import type {
  SphereConfig,
} from '~/composables/useSphereConfig'
import { cloneConfig, createDefaultConfig } from '~/composables/useSphereConfig'

/**
 * 构建教学步骤模型。
 *
 * 每一步只描述相对于前一步的增量（patch），从 Step 0 的最简配置
 * 逐步叠加到 createDefaultConfig() 的完整效果。
 */

export interface SphereConfigPatch {
  geometry?: Partial<SphereConfig['geometry']>
  camera?: Partial<SphereConfig['camera']>
  material?: Partial<SphereConfig['material']>
  noise?: Partial<SphereConfig['noise']>
  mouse?: Partial<SphereConfig['mouse']>
  bloom?: Partial<SphereConfig['bloom']>
}

export interface SphereTourStep {
  /** 步骤唯一标识 */
  id: string
  /** 步骤标题 */
  title: string
  /** 一句话效果说明 */
  description: string
  /** 关键技术点 */
  techniques: string[]
  /** 对应代码位置 */
  codeLocations: { label: string; path: string }[]
  /** 本步骤引入的配置增量 */
  patch: SphereConfigPatch
}

/**
 * Step 0 的最简基准配置。
 *
 * 使用低多面体几何体与关闭所有高级效果的材质，让学习者看清"起点"。
 */
export function createTourBaseConfig(): SphereConfig {
  return {
    geometry: {
      radius: 1,
      detail: 1,
    },
    camera: {
      z: 3.45,
    },
    material: {
      color: '#888888',
      emissive: '#000000',
      metalness: 0,
      roughness: 1,
      transmission: 0,
      thickness: 0,
      ior: 1.5,
      clearcoat: 0,
      clearcoatRoughness: 0.5,
      iridescence: 0,
      iridescenceIOR: 1.3,
      iridescenceThicknessMin: 0,
      iridescenceThicknessMax: 0,
      envMapIntensity: 0,
    },
    noise: {
      lowFreq: 0,
      lowAmp: 0,
      lowSpeed: 0,
      highFreq: 0,
      highAmp: 0,
      highSpeed: 0,
      mouseInfluence: 0,
    },
    mouse: {
      lerp: 0,
      idleDecay: 0,
    },
    bloom: {
      enabled: false,
      threshold: 0,
      strength: 0,
      radius: 0,
    },
  }
}

/**
 * 深度合并 patch 到基准配置，生成当前步骤的完整配置。
 */
export function mergePatches(base: SphereConfig, patches: SphereConfigPatch[]): SphereConfig {
  const result = cloneConfig(base)
  for (const patch of patches) {
    if (patch.geometry) Object.assign(result.geometry, patch.geometry)
    if (patch.camera) Object.assign(result.camera, patch.camera)
    if (patch.material) Object.assign(result.material, patch.material)
    if (patch.noise) Object.assign(result.noise, patch.noise)
    if (patch.mouse) Object.assign(result.mouse, patch.mouse)
    if (patch.bloom) Object.assign(result.bloom, patch.bloom)
  }
  return result
}

/**
 * 所有教学步骤定义。
 *
 * 顺序经过刻意设计：几何 → PBR 基础 → 玻璃 → 清漆 → 虹彩 → 环境反光 →
 * 低频形变 → 高频形变与鼠标 → 后处理辉光。
 *
 * 注意：codeLocations 中的行号指向 BannerSphere.vue 的当前实现，属于
 * 教学快照。若主组件大幅重构，需同步更新这些锚点。
 */
export function createTourSteps(): SphereTourStep[] {
  return [
    {
      id: 'base-geometry',
      title: '基础几何体',
      description: '从一个低多面体的 IcosahedronGeometry 开始，这是整个 shape 的形体基础。',
      techniques: [
        '使用 IcosahedronGeometry 而不是 SphereGeometry，便于后续顶点噪声形变',
        'detail 为 1 时呈现明显的低多面风格，便于观察后续细分升级',
      ],
      codeLocations: [
        { label: '几何体创建', path: 'components/BannerSphere.vue:368' },
        { label: '几何体更新', path: 'components/BannerSphere.vue:256-262' },
      ],
      patch: {},
    },
    {
      id: 'pbr-base',
      title: 'PBR 基础材质',
      description: '提升几何细分到生产级别，并赋予基础颜色、金属度与粗糙度，建立物理材质的第一层质感。',
      techniques: [
        'geometry.detail 从 1 提升到 12，让球体表面足够平滑以承载高级材质',
        'color + emissive 控制基础与自发光色调',
        'metalness 与 roughness 决定表面对光的响应方式',
      ],
      codeLocations: [
        { label: '几何体创建', path: 'components/BannerSphere.vue:368' },
        { label: '几何体更新', path: 'components/BannerSphere.vue:256-262' },
        { label: '材质初始化', path: 'components/BannerSphere.vue:371-386' },
        { label: '材质热更新', path: 'components/BannerSphere.vue:264-282' },
      ],
      patch: {
        geometry: {
          detail: 12,
        },
        material: {
          color: '#241a14',
          emissive: '#120d0a',
          metalness: 0.08,
          roughness: 0.26,
        },
      },
    },
    {
      id: 'glass',
      title: '玻璃质感',
      description: '开启 transmission 模拟半透明油膜/气泡效果，配合 thickness 与 ior 控制体积感。',
      techniques: [
        'MeshPhysicalMaterial.transmission 让光线能够穿透表面',
        'thickness 模拟体积厚度，ior 控制折射率',
      ],
      codeLocations: [
        { label: '材质参数', path: 'components/BannerSphere.vue:376-378' },
        { label: '配置模型', path: 'composables/useSphereConfig.ts:22-51' },
      ],
      patch: {
        material: {
          transmission: 0.50,
          thickness: 3.5,
          ior: 1.30,
        },
      },
    },
    {
      id: 'clearcoat',
      title: '清漆层',
      description: '在表面添加一层清漆，增强高光反射与湿润感。',
      techniques: [
        'clearcoat 模拟表面涂层的高光层',
        'clearcoatRoughness 控制涂层的粗糙度',
      ],
      codeLocations: [
        { label: '清漆参数', path: 'components/BannerSphere.vue:379-380' },
      ],
      patch: {
        material: {
          clearcoat: 0.55,
          clearcoatRoughness: 0.28,
        },
      },
    },
    {
      id: 'iridescence',
      title: '虹彩薄膜',
      description: '添加薄膜干涉效果，让表面随着视角变化呈现紫、绿、橙等彩虹色偏移。',
      techniques: [
        'iridescence 模拟肥皂泡/油膜的薄膜干涉',
        'iridescenceThicknessRange 控制厚度范围，影响干涉色带',
      ],
      codeLocations: [
        { label: '虹彩参数', path: 'components/BannerSphere.vue:381-383' },
        { label: '厚度范围更新', path: 'components/BannerSphere.vue:278-279' },
      ],
      patch: {
        material: {
          iridescence: 0.90,
          iridescenceIOR: 1.42,
          iridescenceThicknessMin: 160,
          iridescenceThicknessMax: 520,
        },
      },
    },
    {
      id: 'env-map',
      title: '程序化环境贴图',
      description: '通过 Canvas 2D 绘制六面体环境贴图，为球体提供紫、黄绿、青绿、橙琥珀等彩色反光。',
      techniques: [
        'CubeTexture 从 6 张 Canvas 构建环境贴图',
        '径向渐变与色块模拟参考图的光照分布',
      ],
      codeLocations: [
        { label: '环境贴图生成', path: 'components/BannerSphere.vue:124-219' },
        { label: '强度更新', path: 'components/BannerSphere.vue:280' },
      ],
      patch: {
        material: {
          envMapIntensity: 2.60,
        },
      },
    },
    {
      id: 'noise-low',
      title: '低频有机形变',
      description: '在顶点着色器中注入 Simplex noise，让球体产生缓慢、大尺度的有机形变。',
      techniques: [
        'onBeforeCompile 注入 GLSL noise',
        '低频噪声控制整体_blob_形态的起伏',
      ],
      codeLocations: [
        { label: 'Shader 注入', path: 'components/BannerSphere.vue:389-422' },
        { label: 'Simplex noise 实现', path: 'components/BannerSphere.vue:59-106' },
        { label: 'uniform 更新', path: 'components/BannerSphere.vue:245-254' },
      ],
      patch: {
        noise: {
          lowFreq: 0.45,
          lowAmp: 0.07,
          lowSpeed: 0.05,
        },
      },
    },
    {
      id: 'noise-high-mouse',
      title: '高频细节与鼠标驱动',
      description: '叠加高频噪声丰富表面细节，同时用鼠标位置驱动局部形变，制造液体惯性。',
      techniques: [
        '高频噪声提供小尺度表面抖动',
        '鼠标位置经 lerp 平滑后写入 uMouse uniform',
        'noise.mouseInfluence 控制鼠标驱动的形变强度',
      ],
      codeLocations: [
        { label: '鼠标平滑跟踪', path: 'components/BannerSphere.vue:224-240' },
        { label: '鼠标驱动形变', path: 'components/BannerSphere.vue:414-416' },
      ],
      patch: {
        noise: {
          highFreq: 1.55,
          highAmp: 0.022,
          highSpeed: 0.10,
          mouseInfluence: 0.060,
        },
        mouse: {
          lerp: 0.038,
          idleDecay: 0.015,
        },
      },
    },
    {
      id: 'bloom',
      title: 'Bloom 辉光后处理',
      description: '使用 EffectComposer + UnrealBloomPass 柔化高光与边缘光，让球体更融入暗色背景。',
      techniques: [
        'EffectComposer 组合 RenderPass 与 UnrealBloomPass',
        'threshold / strength / radius 控制辉光范围与强度',
      ],
      codeLocations: [
        { label: 'Bloom 重建', path: 'components/BannerSphere.vue:298-335' },
        { label: '后处理渲染', path: 'components/BannerSphere.vue:466-470' },
      ],
      patch: {
        bloom: {
          enabled: true,
          threshold: 0.92,
          strength: 0.10,
          radius: 0.45,
        },
      },
    },
  ]
}

/**
 * 验证教学终点：全部步骤完成后配置应与生产默认配置一致。
 */
export function verifyTourMatchesDefault(): boolean {
  const steps = createTourSteps()
  const fullPatches: SphereConfigPatch[] = steps.map(s => s.patch)
  const final = mergePatches(createTourBaseConfig(), fullPatches)
  return JSON.stringify(final) === JSON.stringify(createDefaultConfig())
}
