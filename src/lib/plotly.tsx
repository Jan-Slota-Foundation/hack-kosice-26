import { lazy } from 'react'
import type { PlotParams } from 'react-plotly.js'

function unwrapFunction(mod: unknown): (plotly: object) => unknown {
  let cur: unknown = mod
  for (let i = 0; i < 4; i++) {
    if (typeof cur === 'function') return cur as (plotly: object) => unknown
    if (cur && typeof cur === 'object' && 'default' in cur) {
      cur = (cur as Record<string, unknown>).default
    } else break
  }
  throw new Error('react-plotly.js/factory did not export a function')
}

function unwrapObject(mod: unknown): object {
  if (mod && typeof mod === 'object' && 'default' in mod) {
    const d = (mod as Record<string, unknown>).default
    if (d && typeof d === 'object') return d
  }
  if (mod && typeof mod === 'object') return mod
  throw new Error('plotly.js-dist-min did not export an object')
}

export const Plot = lazy(async () => {
  const factoryMod: unknown = await import('react-plotly.js/factory')
  const plotlyMod: unknown = await import('plotly.js-dist-min')
  const createPlotlyComponent = unwrapFunction(factoryMod)
  const Plotly = unwrapObject(plotlyMod)
  const Component = createPlotlyComponent(Plotly) as React.ComponentType<PlotParams>
  return { default: Component }
})
