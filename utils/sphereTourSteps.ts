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
  /** 步骤效果说明与原理讲解 */
  description: string
  /** 关键技术点 */
  techniques: string[]
  /** 对应代码位置，使用 marker 而非硬编码行号 */
  codeLocations: { label: string; marker: string }[]
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
 * codeLocations 使用 marker 指向源码中的 `// tour-marker: <id>` 注释。
 * 行号由 scripts/resolve-tour-markers.ts 在构建期解析并生成
 * assets/tour-markers.json，页面运行时从产物反查。
 */
export function createTourSteps(): SphereTourStep[] {
  return [
    {
      id: 'base-geometry',
      title: '基础几何体',
      description: '从一个低多面体的 IcosahedronGeometry 开始，这是整个 shape 的形体基础。IcosahedronGeometry 由 20 个等边三角形构成，detail 参数控制每个三角形被细分的次数。当 detail 为 1 时，球体表面仍保持明显的低多面棱角，这种"未完成"的状态让学习者能直观看到后续细分带来的平滑变化。选择 IcosahedronGeometry 而非 SphereGeometry，是因为它的顶点分布更均匀，后续注入顶点噪声形变时不会出现两极压缩导致的拉伸 artifact。',
      techniques: [
        '使用 IcosahedronGeometry 而不是 SphereGeometry，便于后续顶点噪声形变',
        'detail 为 1 时呈现明显的低多面风格，便于观察后续细分升级',
      ],
      codeLocations: [
        { label: '几何体创建', marker: 'geometry-create' },
        { label: '几何体更新', marker: 'geometry-update' },
      ],
      patch: {
        geometry: {
          radius: 1,
          detail: 1,
        },
      },
    },
    {
      id: 'pbr-base',
      title: 'PBR 基础材质',
      description: '把几何体细分到生产级别后，开始赋予 MeshPhysicalMaterial 基础质感。这一步同时将几何体 detail 从 1 提升到 12，使表面拥有足够顶点来承载玻璃、清漆、虹彩等高级效果。颜色设为深棕 (#241a14) 并叠加微弱自发光 (#120d0a)，让球体在暗色背景中仍保持体积感；metalness 0.08 与 roughness 0.26 的组合模拟一种略带金属微粒、但表面大部分区域被漫反射覆盖的有机材质，为后续透明层打下基础。',
      techniques: [
        'geometry.detail 从 1 提升到 12，让球体表面足够平滑以承载高级材质',
        'color + emissive 控制基础与自发光色调',
        'metalness 与 roughness 决定表面对光的响应方式',
      ],
      codeLocations: [
        { label: '材质初始化', marker: 'material-init' },
        { label: '几何体创建', marker: 'geometry-create' },
        { label: '几何体更新', marker: 'geometry-update' },
        { label: '材质热更新', marker: 'material-update' },
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
      description: '在 PBR 基础之上开启 transmission，让光线能够穿透表面，模拟半透明油膜或气泡效果。transmission 0.50 意味着大约一半入射光会穿过物体，另一半被表面反射或吸收；thickness 3.5 给这种穿透增加了体积感，让球体中心看起来比边缘更暗、更厚实；ior 1.30 接近玻璃/油类介质的折射率，控制光线弯曲程度。这三个参数共同奠定了 Crewdle Banner 标志性的"湿润有机玻璃球"观感。',
      techniques: [
        'MeshPhysicalMaterial.transmission 让光线能够穿透表面',
        'thickness 模拟体积厚度，ior 控制折射率',
      ],
      codeLocations: [
        { label: '材质玻璃参数', marker: 'material-glass' },
        { label: '配置模型', marker: 'config-material' },
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
      description: '在玻璃表面再叠加一层清漆（clearcoat），用来增强高光反射与湿润感。可以把它理解为球体表面有一层极薄的透明涂层：clearcoat 0.55 表示涂层反射强度较高，但不到镜面；clearcoatRoughness 0.28 让这层高光带有一点点柔和散射，而不是生硬的点光源反射。清漆层与底层的 transmission 相互作用，使球体在转动时产生流动的"油光"，是区分"塑料"与"高级有机玻璃"的关键细节。',
      techniques: [
        'clearcoat 模拟表面涂层的高光层',
        'clearcoatRoughness 控制涂层的粗糙度',
      ],
      codeLocations: [
        { label: '清漆参数', marker: 'material-clearcoat' },
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
      description: '添加薄膜干涉效果，让表面随着视角变化呈现紫、绿、橙等彩虹色偏移。iridescence 0.90 开启较强的干涉强度；iridescenceIOR 1.42 决定薄膜内光线的反射相位；iridescenceThicknessMin 160 与 iridescenceThicknessMax 520 定义薄膜厚度范围，厚度不同导致干涉波长不同，从而在曲面上形成色带。这一步让原本单调的玻璃球获得了肥皂泡/油膜般的幻彩质感，是 Banner 视觉记忆点的核心。',
      techniques: [
        'iridescence 模拟肥皂泡/油膜的薄膜干涉',
        'iridescenceThicknessRange 控制厚度范围，影响干涉色带',
      ],
      codeLocations: [
        { label: '虹彩参数', marker: 'material-iridescence' },
        { label: '厚度范围更新', marker: 'material-iridescence-range' },
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
      description: '仅靠默认光照无法呈现参考图中丰富的紫、黄绿、青绿、橙琥珀反光，因此通过 Canvas 2D 程序化绘制六面体 CubeTexture 作为环境贴图。每个面使用径向渐变与色块模拟特定方向的光源：px 面放紫罗兰、nx 面放青绿与暖光、py 面放顶部柔和白光、ny 面放橙琥珀底部光、pz 面放前方青绿与暖光、nz 面保持暗调与一点紫。envMapIntensity 2.60 拉高反射强度，使这些色块能在玻璃与清漆层上形成清晰的高光与边缘光。',
      techniques: [
        'CubeTexture 从 6 张 Canvas 构建环境贴图',
        '径向渐变与色块模拟参考图的光照分布',
      ],
      codeLocations: [
        { label: '环境贴图生成', marker: 'env-map-create' },
        { label: '强度更新', marker: 'env-map-intensity' },
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
      description: '球体如果保持完美球面会显得过于机械，因此通过 material.onBeforeCompile 向顶点着色器注入 Simplex noise，对顶点位置进行动态偏移。低频噪声负责大尺度的"blob"形态起伏：lowFreq 0.45 控制噪声在空间中的密度，值越小起伏越缓慢；lowAmp 0.07 控制顶点最大偏移量，决定形变幅度；lowSpeed 0.05 控制噪声随时间漂移的速度。由于噪声基于世界坐标 position 计算，球体在自转时会带动噪声采样点移动，形成持续缓慢流动的有机形态。',
      techniques: [
        'onBeforeCompile 注入 GLSL noise',
        '低频噪声控制整体 blob 形态的起伏',
      ],
      codeLocations: [
        { label: 'Shader 注入', marker: 'shader-inject' },
        { label: 'Simplex noise 实现', marker: 'simplex-noise' },
        { label: 'uniform 更新', marker: 'noise-uniforms' },
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
      description: '在低频形变之上叠加第二层更高频率的噪声，负责小尺度表面抖动与细节。highFreq 1.55 使噪声波纹更细密，highAmp 0.022 保持小幅偏移以免破坏整体球形，highSpeed 0.10 让它比低频层漂移更快，制造"液体表面微颤"的感觉。同时引入鼠标驱动：鼠标位置经 lerp 平滑后写入 uMouse uniform，noise.mouseInfluence 0.060 控制鼠标附近顶点的额外凸起强度，mouse.lerp 0.038 与 mouse.idleDecay 0.015 共同决定这种凸起如何柔和地跟随并衰减，最终形成液体被手指靠近时微微鼓起的惯性效果。',
      techniques: [
        '高频噪声提供小尺度表面抖动',
        '鼠标位置经 lerp 平滑后写入 uMouse uniform',
        'noise.mouseInfluence 控制鼠标驱动的形变强度',
      ],
      codeLocations: [
        { label: '鼠标平滑跟踪', marker: 'mouse-track' },
        { label: '鼠标驱动形变', marker: 'mouse-deform' },
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
      description: '最后一步使用 EffectComposer 组合 RenderPass 与 UnrealBloomPass，对高光与边缘光进行柔化与光晕扩散。bloom.enabled 开启后处理管线；bloom.threshold 0.92 表示只有亮度超过 0.92 的像素才会参与辉光，避免整个暗色背景都发光；bloom.strength 0.10 控制辉光强度，保持克制以免画面发糊；bloom.radius 0.45 控制光晕扩散半径。Bloom 让虹彩高光与清漆反射有了更自然的呼吸感，同时把高光"融"入深色背景，完成 Crewdle Banner 的最终氛围。',
      techniques: [
        'EffectComposer 组合 RenderPass 与 UnrealBloomPass',
        'threshold / strength / radius 控制辉光范围与强度',
      ],
      codeLocations: [
        { label: 'Bloom 重建', marker: 'bloom-rebuild' },
        { label: '后处理渲染', marker: 'bloom-render' },
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
