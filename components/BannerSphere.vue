<template>
  <div
    ref="container"
    class="sphere-scene"
    :class="{ 'has-camera-control': enableCameraControl }"
    aria-hidden="true"
  ></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import type { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import type { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import type { SphereConfig } from '~/composables/useSphereConfig'

/**
 * 复刻 Crewdle Banner 的巨型半透明虹彩气泡球。
 *
 * 本组件接收外部 SphereConfig 配置，所有视觉参数均可在运行时通过 props 更新。
 * - IcosahedronGeometry + 多层 Simplex noise 实现有机缓慢形变
 * - MeshPhysicalMaterial 开启 transmission 模拟半透明油膜/气泡
 * - 程序化 CubeTexture 环境贴图复刻参考图的紫/黄绿/白/青绿/橙琥珀反光
 * - 鼠标位置经 lerp 平滑后驱动局部形变与虚拟光源，制造液体惯性
 * - EffectComposer + UnrealBloomPass 柔化高光与边缘光
 */
interface Props {
  config?: SphereConfig
  /** 是否启用相机交互（拖拽旋转、双指平移、滚轮/捏合缩放），支持运行时切换 */
  enableCameraControl?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  config: () => createDefaultConfig(),
  enableCameraControl: false,
})

const container = ref<HTMLDivElement | null>(null)

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let sphere: THREE.Mesh | null = null
let material: THREE.MeshPhysicalMaterial | null = null
let composer: EffectComposer | null = null
let bloomPass: UnrealBloomPass | null = null
let geometry: THREE.IcosahedronGeometry | null = null
let envMap: THREE.CubeTexture | null = null
let rafId = 0
let envMapFaces: HTMLCanvasElement[] = []
let handleResize: (() => void) | null = null

// 相机交互基准状态，用于 reset 时恢复
const CAMERA_BASE = {
  azimuth: 0,
  polar: Math.PI / 2,
  radiusOffset: 0,
  panX: 0,
  panY: 0,
}

// 相机交互控制：拖拽旋转、双指平移、滚轮缩放
const cameraControl = { ...CAMERA_BASE }
let isDragging = false
let cameraListenersAttached = false
let lastPointerX = 0
let lastPointerY = 0

// Shader uniforms 引用，便于运行时直接修改噪声参数
const noiseUniforms = {
  uLowFreq: { value: 0 },
  uLowAmp: { value: 0 },
  uLowSpeed: { value: 0 },
  uHighFreq: { value: 0 },
  uHighAmp: { value: 0 },
  uHighSpeed: { value: 0 },
  uMouseInfluence: { value: 0 },
}

// ─────────────────────────────────────────────────────────────────────────────
// Simplex noise GLSL
// tour-marker: simplex-noise
// ─────────────────────────────────────────────────────────────────────────────
const snoise = `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
`

// ─────────────────────────────────────────────────────────────────────────────
// 程序化环境贴图：按参考图分布色块
// tour-marker: env-map-create
// ─────────────────────────────────────────────────────────────────────────────
interface ZoneDef {
  color: [number, number, number]
  pos: [number, number]
  radius: number
  intensity: number
}

interface FaceDef {
  name: string
  base: [number, number, number]
  zones: ZoneDef[]
}

function createEnvironmentMap(): { texture: THREE.CubeTexture; faces: HTMLCanvasElement[] } {
  const size = 512
  const faces: HTMLCanvasElement[] = []

  const faceDefs: FaceDef[] = [
    // px: 右侧，紫罗兰 + 微弱黄绿
    {
      name: 'px',
      base: [13, 10, 8],
      zones: [
        { color: [140, 90, 190], pos: [0.22, 0.30], radius: 0.46, intensity: 0.88 },
        { color: [205, 225, 115], pos: [0.38, 0.18], radius: 0.16, intensity: 0.75 },
      ],
    },
    // nx: 左侧，青绿 + 柔和暖光
    {
      name: 'nx',
      base: [15, 11, 9],
      zones: [
        { color: [90, 195, 155], pos: [0.78, 0.82], radius: 0.42, intensity: 0.52 },
        { color: [240, 180, 120], pos: [0.65, 0.30], radius: 0.50, intensity: 0.18 },
      ],
    },
    // py: 顶部，左紫 + 黄绿 + 超平柔白光
    {
      name: 'py',
      base: [15, 11, 9],
      zones: [
        { color: [145, 95, 195], pos: [0.28, 0.34], radius: 0.52, intensity: 0.85 },
        { color: [215, 230, 125], pos: [0.25, 0.22], radius: 0.48, intensity: 0.18 },
        { color: [255, 250, 240], pos: [0.70, 0.30], radius: 0.95, intensity: 0.16 },
      ],
    },
    // ny: 底部，橙琥珀 + 青绿边缘
    {
      name: 'ny',
      base: [12, 9, 7],
      zones: [
        { color: [240, 130, 60], pos: [0.48, 0.35], radius: 0.58, intensity: 0.92 },
        { color: [80, 190, 150], pos: [0.80, 0.55], radius: 0.30, intensity: 0.52 },
      ],
    },
    // pz: 前方，青绿 + 暖光 + 柔白光
    {
      name: 'pz',
      base: [14, 10, 8],
      zones: [
        { color: [95, 200, 165], pos: [0.70, 0.82], radius: 0.34, intensity: 0.55 },
        { color: [240, 180, 120], pos: [0.60, 0.25], radius: 0.30, intensity: 0.32 },
        { color: [255, 250, 240], pos: [0.55, 0.45], radius: 0.60, intensity: 0.15 },
      ],
    },
    // nz: 后方，暗调 + 一点紫
    {
      name: 'nz',
      base: [10, 8, 6],
      zones: [
        { color: [110, 65, 145], pos: [0.35, 0.40], radius: 0.42, intensity: 0.45 },
      ],
    },
  ]

  for (const face of faceDefs) {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = `rgb(${face.base[0]}, ${face.base[1]}, ${face.base[2]})`
    ctx.fillRect(0, 0, size, size)

    const grad = ctx.createRadialGradient(size / 2, size / 2, size * 0.2, size / 2, size / 2, size * 0.78)
    grad.addColorStop(0, `rgba(${face.base[0]}, ${face.base[1]}, ${face.base[2]}, 0)`)
    grad.addColorStop(1, 'rgba(5, 4, 3, 0.88)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)

    for (const zone of face.zones) {
      const zx = zone.pos[0] * size
      const zy = zone.pos[1] * size
      const zr = zone.radius * size
      const zg = ctx.createRadialGradient(zx, zy, zr * 0.08, zx, zy, zr)
      zg.addColorStop(0, `rgba(${zone.color[0]}, ${zone.color[1]}, ${zone.color[2]}, ${zone.intensity})`)
      zg.addColorStop(0.45, `rgba(${zone.color[0]}, ${zone.color[1]}, ${zone.color[2]}, ${zone.intensity * 0.35})`)
      zg.addColorStop(1, `rgba(${zone.color[0]}, ${zone.color[1]}, ${zone.color[2]}, 0)`)
      ctx.fillStyle = zg
      ctx.fillRect(0, 0, size, size)
    }

    faces.push(canvas)
  }

  const texture = new THREE.CubeTexture(faces)
  texture.needsUpdate = true
  return { texture, faces }
}

// ─────────────────────────────────────────────────────────────────────────────
// 鼠标平滑跟踪
// tour-marker: mouse-track
// ─────────────────────────────────────────────────────────────────────────────
const mouseTarget = new THREE.Vector2(0, 0)
const mouseCurrent = new THREE.Vector2(0, 0)
const isMouseActive = ref(false)
let mouseTimeout = 0

function handleMouseMove(e: MouseEvent) {
  if (!container.value) return
  const rect = container.value.getBoundingClientRect()
  const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
  const y = -((e.clientY - rect.top) / rect.height) * 2 + 1
  mouseTarget.set(x, y)
  isMouseActive.value = true
  window.clearTimeout(mouseTimeout)
  mouseTimeout = window.setTimeout(() => {
    isMouseActive.value = false
  }, 120)
}

// ─────────────────────────────────────────────────────────────────────────────
// 相机交互：拖拽旋转、双指平移、滚轮缩放
// ─────────────────────────────────────────────────────────────────────────────
function updateCameraTransform() {
  if (!camera) return
  const baseRadius = props.config.camera.z
  const minRadius = props.config.geometry.radius * 1.5
  const maxRadius = baseRadius * 4
  const targetRadius = baseRadius + cameraControl.radiusOffset
  const radius = Math.max(minRadius, Math.min(maxRadius, targetRadius))
  camera.position.setFromSphericalCoords(radius, cameraControl.polar, cameraControl.azimuth)
  const panLimit = radius * 0.75
  camera.position.x += Math.max(-panLimit, Math.min(panLimit, cameraControl.panX))
  camera.position.y += Math.max(-panLimit, Math.min(panLimit, cameraControl.panY))
  camera.lookAt(0, 0, 0)
}

function handlePointerDown(e: PointerEvent) {
  if (!container.value) return
  isDragging = true
  lastPointerX = e.clientX
  lastPointerY = e.clientY
  container.value.setPointerCapture(e.pointerId)
}

function handlePointerMove(e: PointerEvent) {
  if (!isDragging) return
  const dx = e.clientX - lastPointerX
  const dy = e.clientY - lastPointerY
  cameraControl.azimuth -= dx * 0.005
  cameraControl.polar = Math.max(0.1, Math.min(Math.PI - 0.1, cameraControl.polar + dy * 0.005))
  lastPointerX = e.clientX
  lastPointerY = e.clientY
}

function handlePointerUp(e: PointerEvent) {
  isDragging = false
  try {
    container.value?.releasePointerCapture(e.pointerId)
  }
  catch {
    // 若 pointer 已释放或从未 capture，忽略异常
  }
}

function handleWheel(e: WheelEvent) {
  e.preventDefault()
  const isPinch = e.ctrlKey || e.metaKey
  const isTrackpad = e.deltaMode === WheelEvent.DOM_DELTA_PIXEL
  // 双指 pinch / Ctrl+滚轮 / 普通鼠标滚轮：缩放
  // 双指滑动（trackpad pixel 模式）或 Shift+滚轮：平移
  if (isPinch || (!isTrackpad && !e.shiftKey)) {
    cameraControl.radiusOffset -= e.deltaY * 0.002
  }
  else {
    cameraControl.panX += e.deltaX * 0.002
    cameraControl.panY -= e.deltaY * 0.002
  }
}

function attachCameraListeners() {
  if (!container.value || cameraListenersAttached) return
  container.value.addEventListener('pointerdown', handlePointerDown)
  container.value.addEventListener('pointermove', handlePointerMove)
  container.value.addEventListener('pointerup', handlePointerUp)
  container.value.addEventListener('pointerleave', handlePointerUp)
  container.value.addEventListener('wheel', handleWheel, { passive: false })
  cameraListenersAttached = true
}

function detachCameraListeners() {
  if (!container.value || !cameraListenersAttached) return
  container.value.removeEventListener('pointerdown', handlePointerDown)
  container.value.removeEventListener('pointermove', handlePointerMove)
  container.value.removeEventListener('pointerup', handlePointerUp)
  container.value.removeEventListener('pointerleave', handlePointerUp)
  container.value.removeEventListener('wheel', handleWheel)
  cameraListenersAttached = false
}

function resetCamera() {
  Object.assign(cameraControl, CAMERA_BASE)
}

// ─────────────────────────────────────────────────────────────────────────────
// 运行时更新函数
// tour-marker: material-update
// ─────────────────────────────────────────────────────────────────────────────
function updateNoiseUniforms() {
  const n = props.config.noise
  noiseUniforms.uLowFreq.value = n.lowFreq
  noiseUniforms.uLowAmp.value = n.lowAmp
  noiseUniforms.uLowSpeed.value = n.lowSpeed
  noiseUniforms.uHighFreq.value = n.highFreq
  noiseUniforms.uHighAmp.value = n.highAmp
  noiseUniforms.uHighSpeed.value = n.highSpeed
  noiseUniforms.uMouseInfluence.value = n.mouseInfluence
}

// tour-marker: noise-uniforms
function updateGeometry() {
  if (!sphere) return
  const oldGeometry = geometry
  // tour-marker: geometry-update
  geometry = new THREE.IcosahedronGeometry(props.config.geometry.radius, props.config.geometry.detail)
  sphere.geometry = geometry
  oldGeometry?.dispose()
}

function updateMaterial() {
  if (!material) return
  const m = props.config.material
  material.color.set(m.color)
  material.emissive.set(m.emissive)
  material.metalness = m.metalness
  material.roughness = m.roughness
  material.transmission = m.transmission
  material.thickness = m.thickness
  material.ior = m.ior
  material.clearcoat = m.clearcoat
  material.clearcoatRoughness = m.clearcoatRoughness
  material.iridescence = m.iridescence
  material.iridescenceIOR = m.iridescenceIOR
  // tour-marker: material-iridescence-range
  material.iridescenceThicknessRange[0] = m.iridescenceThicknessMin
  material.iridescenceThicknessRange[1] = m.iridescenceThicknessMax
  // tour-marker: env-map-intensity
  material.envMapIntensity = m.envMapIntensity
  // 标量属性变更不需要强制 needsUpdate；保留注释说明即可
}

function updateCamera() {
  // config.camera.z 只作为基准半径，实际位置由 updateCameraTransform 应用交互偏移
  updateCameraTransform()
}

function updateBloomPass() {
  if (!bloomPass) return
  const b = props.config.bloom
  bloomPass.threshold = b.threshold
  bloomPass.strength = b.strength
  bloomPass.radius = b.radius
}

let bloomRevision = 0

// tour-marker: bloom-rebuild
async function rebuildBloomPipeline() {
  if (!renderer || !scene || !camera || !container.value) return
  const currentRevision = ++bloomRevision

  const width = container.value.clientWidth
  const height = container.value.clientHeight

  // 清理旧后处理
  if (composer) {
    composer.dispose()
    composer = null
    bloomPass = null
  }

  if (!props.config.bloom.enabled) return

  try {
    const { EffectComposer } = await import('three/examples/jsm/postprocessing/EffectComposer.js')
    const { RenderPass } = await import('three/examples/jsm/postprocessing/RenderPass.js')
    const { UnrealBloomPass } = await import('three/examples/jsm/postprocessing/UnrealBloomPass.js')

    // 若期间有新的重建请求（currentRevision 落后），则丢弃本次结果，
    // 避免用过期 enabled 状态创建 composer。
    if (currentRevision !== bloomRevision) return

    composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      props.config.bloom.strength,
      props.config.bloom.radius,
      props.config.bloom.threshold
    )
    composer.addPass(bloomPass)
  } catch (e) {
    console.warn('Bloom post-processing unavailable, falling back to standard render.', e)
  }
}

// 监听配置变化并应用
watch(() => props.config.geometry, updateGeometry, { deep: true })
watch(() => props.config.material, updateMaterial, { deep: true })
watch(() => props.config.camera, updateCamera, { deep: true })
watch(() => props.config.bloom, updateBloomPass, { deep: true })
watch(() => props.config.bloom.enabled, rebuildBloomPipeline)
watch(() => props.config.noise, updateNoiseUniforms, { deep: true })

onMounted(async () => {
  if (!container.value) return

  const width = container.value.clientWidth
  const height = container.value.clientHeight

  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
  updateCameraTransform()

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.92
  container.value.appendChild(renderer.domElement)

  const { texture: envMapTexture, faces } = createEnvironmentMap()
  envMap = envMapTexture
  envMapFaces = faces
  scene.environment = envMap

  // ── 几何体 ──
  // tour-marker: geometry-create
  geometry = new THREE.IcosahedronGeometry(props.config.geometry.radius, props.config.geometry.detail)

  // ── 材质 ──
  // tour-marker: material-init
  material = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(props.config.material.color),
    emissive: new THREE.Color(props.config.material.emissive),
    metalness: props.config.material.metalness,
    roughness: props.config.material.roughness,
    // tour-marker: material-glass
    transmission: props.config.material.transmission,
    thickness: props.config.material.thickness,
    ior: props.config.material.ior,
    // tour-marker: material-clearcoat
    clearcoat: props.config.material.clearcoat,
    clearcoatRoughness: props.config.material.clearcoatRoughness,
    // tour-marker: material-iridescence
    iridescence: props.config.material.iridescence,
    iridescenceIOR: props.config.material.iridescenceIOR,
    iridescenceThicknessRange: [props.config.material.iridescenceThicknessMin, props.config.material.iridescenceThicknessMax],
    envMap,
    envMapIntensity: props.config.material.envMapIntensity,
  })

  // ── Shader 注入：多层 noise + 鼠标驱动形变 ──
  // tour-marker: shader-inject
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 }
    shader.uniforms.uMouse = { value: new THREE.Vector2(0, 0) }
    Object.assign(shader.uniforms, noiseUniforms)
    updateNoiseUniforms()

    shader.vertexShader = `
      uniform float uTime;
      uniform vec2 uMouse;
      uniform float uLowFreq;
      uniform float uLowAmp;
      uniform float uLowSpeed;
      uniform float uHighFreq;
      uniform float uHighAmp;
      uniform float uHighSpeed;
      uniform float uMouseInfluence;
      ${snoise}
    ` + shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>

      float displacement = snoise(position * uLowFreq + vec3(0.0, uTime * uLowSpeed, 0.0)) * uLowAmp;
      displacement += snoise(position * uHighFreq + vec3(uTime * uHighSpeed * 0.7, uTime * uHighSpeed, 0.0)) * uHighAmp;

      // tour-marker: mouse-deform
      vec3 mouseDir = normalize(vec3(uMouse.x, uMouse.y, 0.35));
      float mouseProximity = smoothstep(0.85, 0.0, distance(normalize(position), mouseDir));
      displacement += mouseProximity * uMouseInfluence;

      transformed += normal * displacement;
      `
    )
    material!.userData.shader = shader
  }

  sphere = new THREE.Mesh(geometry, material)
  sphere.position.x = 0.0
  sphere.position.y = -0.02
  sphere.rotation.y = Math.PI * 0.88
  sphere.rotation.z = Math.PI * 0.02
  scene.add(sphere)

  // ── 光源 ──
  const ambient = new THREE.AmbientLight(0xffffff, 0.03)
  scene.add(ambient)

  // 主光：柔和暖白光，从右上方
  const mainLight = new THREE.DirectionalLight(0xfff0e0, 0.40)
  mainLight.position.set(2.5, 2.0, 3.0)
  scene.add(mainLight)

  // ── 后处理 ──
  await rebuildBloomPipeline()

  container.value.addEventListener('mousemove', handleMouseMove)
  if (props.enableCameraControl) {
    attachCameraListeners()
  }

  const clock = new THREE.Clock()
  const animate = () => {
    rafId = requestAnimationFrame(animate)
    const elapsed = clock.getElapsedTime()

    updateCameraTransform()

    // 鼠标平滑
    const decay = isMouseActive.value ? 0.0 : props.config.mouse.idleDecay
    mouseCurrent.x += (mouseTarget.x - mouseCurrent.x) * props.config.mouse.lerp - mouseCurrent.x * decay
    mouseCurrent.y += (mouseTarget.y - mouseCurrent.y) * props.config.mouse.lerp - mouseCurrent.y * decay

    if (material?.userData.shader) {
      material.userData.shader.uniforms.uTime.value = elapsed
      material.userData.shader.uniforms.uMouse.value.copy(mouseCurrent)
    }

    // 极缓慢自转，让高光和色块自然漂移；取模避免浮点精度累积
    if (sphere) {
      sphere.rotation.y = (sphere.rotation.y + 0.0004) % (Math.PI * 2)
      sphere.rotation.z = (sphere.rotation.z + 0.00015) % (Math.PI * 2)
    }

    if (composer) {
      // tour-marker: bloom-render
      composer.render()
    } else if (renderer && scene && camera) {
      renderer.render(scene, camera)
    }
  }
  animate()

  handleResize = () => {
    if (!container.value || !camera || !renderer) return
    const w = container.value.clientWidth
    const h = container.value.clientHeight
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
    if (composer) {
      composer.setSize(w, h)
    }
  }
  window.addEventListener('resize', handleResize)

  // onUnmounted 必须在 setup 顶层注册，因此清理逻辑使用组件级变量
})

watch(() => props.enableCameraControl, (enabled) => {
  if (enabled) attachCameraListeners()
  else detachCameraListeners()
})

defineExpose({ resetCamera })

onUnmounted(() => {
  if (handleResize) {
    window.removeEventListener('resize', handleResize)
  }
  container.value?.removeEventListener('mousemove', handleMouseMove)
  detachCameraListeners()
  window.clearTimeout(mouseTimeout)
  cancelAnimationFrame(rafId)

  if (renderer) {
    renderer.dispose()
    renderer.forceContextLoss()
    if (container.value && renderer.domElement.parentNode === container.value) {
      container.value.removeChild(renderer.domElement)
    }
  }
  if (composer) {
    composer.dispose()
  }
  geometry?.dispose()
  material?.dispose()
  envMap?.dispose()
  // 6 个 canvas 从未挂载到 DOM，清空引用即可被 GC
  envMapFaces = []
})
</script>

<style scoped>
.sphere-scene {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  overflow: hidden;
}

.sphere-scene.has-camera-control {
  touch-action: none;
}

.sphere-scene canvas {
  width: 100% !important;
  height: 100% !important;
}
</style>
