import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import markerMap from '~/assets/tour-markers.json'
import { createTourSteps } from '~/utils/sphereTourSteps'
import { resolveMarkers } from '../../scripts/resolve-tour-markers'

const __dirname = dirname(fileURLToPath(import.meta.url))
const tourFile = JSON.parse(readFileSync(resolve(__dirname, '../../.vscode/tours/shape.tour'), 'utf-8'))

/**
 * 教学 marker 完整性测试。
 *
 * 防止源码重构后 marker 注释被误删或重命名，导致教学卡片找不到代码位置。
 */
describe('tour markers', () => {
  it('every step code location has a resolvable marker', () => {
    const steps = createTourSteps()
    const markers = new Set(Object.keys(markerMap))
    const missing: { stepId: string; label: string; marker: string }[] = []

    for (const step of steps) {
      for (const location of step.codeLocations) {
        if (!markers.has(location.marker)) {
          missing.push({ stepId: step.id, label: location.label, marker: location.marker })
        }
      }
    }

    expect(missing).toEqual([])
  })

  it('every resolved marker points to a known file', () => {
    for (const [marker, location] of Object.entries(markerMap)) {
      expect(location.file, `marker "${marker}" file`).toBeTruthy()
      expect(typeof location.line, `marker "${marker}" line`).toBe('number')
      expect(location.line).toBeGreaterThan(0)
    }
  })

  it('VS Code tour steps match shape-tour steps', () => {
    const steps = createTourSteps()
    expect(tourFile.title).toBe('Shape Tour')
    expect(tourFile.steps.length).toBe(steps.length)

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]!
      const tourStep = tourFile.steps[i]
      expect(tourStep).toBeDefined()
      expect(tourStep.title).toBe(step.title)

      const primaryMarker = step.codeLocations[0]?.marker
      expect(primaryMarker, `step "${step.id}" has a primary marker`).toBeTruthy()
      const location = (markerMap as Record<string, { file: string; line: number }>)[primaryMarker!]
      expect(location, `primary marker "${primaryMarker}" resolves`).toBeTruthy()
      expect(tourStep.file).toBe(location!.file)
      expect(tourStep.line).toBe(location!.line)
    }
  })

  it('committed marker file matches live source scan', () => {
    const liveMarkers = resolveMarkers()
    expect(markerMap).toEqual(liveMarkers)
  })
})
