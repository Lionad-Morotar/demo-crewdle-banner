// @ts-check
/**
 * 解析源码中的 `// tour-marker: <id>` 注释，生成产物：
 *
 * 1. assets/tour-markers.json：{ "marker-id": { "file": "...", "line": 123 } }
 *    供页面与组件运行时反查行号。
 * 2. .vscode/tours/shape.tour（传入 --vscode 时）：VS Code CodeTour 文件，
 *    行号同样从 marker 解析，避免行号腐烂。
 */
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from 'node:fs'
import { join, relative, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createTourSteps } from '../utils/sphereTourSteps'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUTPUT = join(ROOT, 'assets', 'tour-markers.json')
const VSCODE_TOUR_OUTPUT = join(ROOT, '.vscode', 'tours', 'shape.tour')

const SOURCE_DIRS = ['components', 'composables', 'pages', 'utils']
const EXTENSIONS = new Set(['.vue', '.ts'])

const MARKER_RE = /^\s*\/\/\s*tour-marker:\s*(\S+)\s*$/

const IS_VSCODE_MODE = process.argv.includes('--vscode')

function collectFiles(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) {
      collectFiles(full, files)
    }
    else if (st.isFile() && EXTENSIONS.has(entry.slice(entry.lastIndexOf('.')))) {
      files.push(full)
    }
  }
  return files
}

interface MarkerLocation {
  file: string
  line: number
}

export function resolveMarkers(): Record<string, MarkerLocation> {
  const markers: Record<string, MarkerLocation> = {}

  for (const dirName of SOURCE_DIRS) {
    const dir = join(ROOT, dirName)
    const files = collectFiles(dir)
    for (const file of files) {
      const content = readFileSync(file, 'utf-8')
      const lines = content.split('\n')
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (line === undefined) continue
        const match = MARKER_RE.exec(line)
        if (!match || !match[1]) continue
        const markerId = match[1]
        const filePath = relative(ROOT, file).replace(/\\/g, '/')
        const existing = markers[markerId]
        if (existing) {
          // eslint-disable-next-line no-console
          console.warn(
            `Duplicate tour-marker "${markerId}" found at ${filePath}:${i + 1}, ` +
            `already defined at ${existing.file}:${existing.line}. ` +
            `The first occurrence wins.`
          )
          continue
        }
        markers[markerId] = { file: filePath, line: i + 1 }
      }
    }
  }

  return markers
}

interface CodeTourStep {
  title: string
  description: string
  file: string
  line: number
}

function generateVscodeTour(markers: Record<string, MarkerLocation>): { title: string; description: string; steps: CodeTourStep[] } {
  const steps = createTourSteps()
  return {
    title: 'Shape Tour',
    description: '一步步构建 Crewdle Banner 的 3D 球体',
    steps: steps.map((step) => {
      const primary = step.codeLocations[0]
      if (!primary) {
        throw new Error(`Step "${step.id}" has no code location`)
      }
      const location = markers[primary.marker]
      if (!location) {
        throw new Error(`Step "${step.id}" references unknown marker "${primary.marker}"`)
      }
      return {
        title: step.title,
        description: `${step.description}\n\n**关键技术：**\n${step.techniques.map(t => `- ${t}`).join('\n')}`,
        file: location.file,
        line: location.line,
      }
    }),
  }
}

const markers = resolveMarkers()

if (IS_VSCODE_MODE) {
  const tour = generateVscodeTour(markers)
  mkdirSync(dirname(VSCODE_TOUR_OUTPUT), { recursive: true })
  writeFileSync(VSCODE_TOUR_OUTPUT, `${JSON.stringify(tour, null, 2)}\n`)
  // eslint-disable-next-line no-console
  console.log(`Generated VS Code tour to ${VSCODE_TOUR_OUTPUT}`)
}
else {
  mkdirSync(dirname(OUTPUT), { recursive: true })
  writeFileSync(OUTPUT, `${JSON.stringify(markers, null, 2)}\n`)
  // eslint-disable-next-line no-console
  console.log(`Resolved ${Object.keys(markers).length} tour markers to ${OUTPUT}`)
}
