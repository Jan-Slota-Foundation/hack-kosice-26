import { GradientCard } from '@/components/ui/gradient-card'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'
import { useAuth } from '@/lib/auth-context'
import { PLASMA_COLORSCALE } from '@/lib/plasma'
import { Plot } from '@/lib/plotly'
import { supabase } from '@/lib/supabase'
import { trpc } from '@/lib/trpc'
import { useQueries } from '@tanstack/react-query'
import { Suspense, useMemo, useState } from 'react'

interface AfmSurfaceViewerProps {
  rawImageId: string
  channelName?: string
}

interface ChannelPixels {
  data: Float32Array
  width: number
  height: number
}

const DEFAULT_CHANNEL = 'Height Sensor'
const DEFAULT_Z_EXAG = 50

async function fetchChannelPixels(
  rawImageId: string,
  channelName: string,
  token: string,
): Promise<ChannelPixels> {
  const url = `/api/heightmap/${encodeURIComponent(rawImageId)}/${encodeURIComponent(channelName)}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    let message = `Failed to load channel '${channelName}' (HTTP ${String(res.status)})`
    try {
      const body: unknown = await res.json()
      if (
        typeof body === 'object' &&
        body !== null &&
        'error' in body &&
        typeof (body as { error: unknown }).error === 'string'
      ) {
        message = (body as { error: string }).error
      }
    } catch {
      // ignore JSON parse failure
    }
    throw new Error(message)
  }
  const width = Number.parseInt(res.headers.get('X-Width') ?? '0', 10)
  const heightPx = Number.parseInt(res.headers.get('X-Height') ?? '0', 10)
  if (!width || !heightPx) {
    throw new Error('Server response missing X-Width or X-Height headers')
  }
  const buffer = await res.arrayBuffer()
  return { data: new Float32Array(buffer), width, height: heightPx }
}

function reshapeToZ(pixels: ChannelPixels): number[][] {
  const { data, width, height } = pixels
  const z: number[][] = new Array<number[]>(height)
  for (let y = 0; y < height; y++) {
    const row = new Array<number>(width)
    const off = y * width
    for (let x = 0; x < width; x++) row[x] = data[off + x]
    z[y] = row
  }
  return z
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border p-4 text-sm">
      <p className="font-medium">Failed to render AFM surface</p>
      <p className="mt-1 wrap-break-word opacity-90">{message}</p>
    </div>
  )
}

export function AfmSurfaceViewer({
  rawImageId,
  channelName = DEFAULT_CHANNEL,
}: AfmSurfaceViewerProps) {
  const auth = useAuth()
  const metaQuery = trpc.rawImages.getHeightmapMeta.useQuery({ rawImageId })

  const channelMetas = useMemo(
    () => metaQuery.data?.channels ?? [],
    [metaQuery.data?.channels],
  )
  const initialChannel = useMemo(() => {
    if (channelMetas.length === 0) return channelName
    if (channelMetas.some((c) => c.name === channelName)) return channelName
    return channelMetas[0].name
  }, [channelMetas, channelName])

  const [selectedChannel, setSelectedChannel] = useState<string | null>(null)
  const activeChannel = selectedChannel ?? initialChannel
  const [zExagLive, setZExagLive] = useState(DEFAULT_Z_EXAG)
  const [zExagCommitted, setZExagCommitted] = useState(DEFAULT_Z_EXAG)

  const channelQueries = useQueries({
    queries: channelMetas.map((c) => ({
      queryKey: ['heightmap', rawImageId, c.name],
      queryFn: async (): Promise<ChannelPixels> => {
        let token = auth.session?.access_token
        if (!token) {
          const { data } = await supabase.auth.getSession()
          token = data.session?.access_token
        }
        if (!token) throw new Error('Not authenticated')
        return fetchChannelPixels(rawImageId, c.name, token)
      },
      enabled:
        channelMetas.length > 0 && Boolean(auth.session ?? auth.isLoading),
      staleTime: 60 * 60 * 1000,
      gcTime: 60 * 60 * 1000,
    })),
  })

  const activeIndex = channelMetas.findIndex((c) => c.name === activeChannel)
  const activeMeta = activeIndex >= 0 ? channelMetas[activeIndex] : null
  const activeQuery = activeIndex >= 0 ? channelQueries[activeIndex] : null
  const activeData = activeQuery?.data ?? null

  const zData = useMemo(() => {
    if (!activeData) return null
    return reshapeToZ(activeData)
  }, [activeData])

  const pixelSizeUm = metaQuery.data ? metaQuery.data.pixelSizeNm / 1000 : 0
  const widthUm = activeMeta ? activeMeta.width * pixelSizeUm : 0
  const heightUm = activeMeta ? activeMeta.height * pixelSizeUm : 0
  const visualMultiplier = zExagCommitted / 200
  const visualMultiplierLive = zExagLive / 200

  const xValues = useMemo(() => {
    if (!activeMeta) return null
    return Array.from({ length: activeMeta.width }, (_, i) => i * pixelSizeUm)
  }, [activeMeta, pixelSizeUm])

  const yValues = useMemo(() => {
    if (!activeMeta) return null
    return Array.from({ length: activeMeta.height }, (_, i) => i * pixelSizeUm)
  }, [activeMeta, pixelSizeUm])

  const plotData = useMemo(() => {
    if (!zData || !activeMeta || !xValues || !yValues) return null
    const trace = {
      type: 'surface',
      z: zData,
      colorscale: PLASMA_COLORSCALE,
      showscale: true,
      contours: { z: { show: false } },
      colorbar: {
        title: {
          text: activeMeta.unit === 'unknown' ? '' : activeMeta.unit,
        },
      },
      x: xValues,
      y: yValues,
      hovertemplate:
        `<b>${activeMeta.name}</b>` +
        '<br>x: %{x:.2f} µm' +
        '<br>y: %{y:.2f} µm' +
        `<br>z: %{z:.2f} ${activeMeta.unit}` +
        '<extra></extra>',
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return
    return [trace as any]
  }, [zData, activeMeta, xValues, yValues])

  const plotLayout = useMemo(() => {
    return {
      autosize: true,
      margin: { l: 0, r: 0, t: 0, b: 0 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      hoverlabel: {
        bgcolor: 'rgba(15,15,20,0.92)',
        bordercolor: 'rgba(255,255,255,0.15)',
        font: {
          family: 'var(--font-sans, ui-sans-serif)',
          size: 12,
          color: '#f5f5f7',
        },
        align: 'left' as const,
      },
      scene: {
        bgcolor: 'rgba(0,0,0,0)',
        camera: { eye: { x: 1.6, y: 1.6, z: 1.2 } },
        aspectmode: 'manual' as const,
        aspectratio: { x: 1, y: 1, z: visualMultiplier },
        xaxis: {
          range: [0, widthUm],
          showbackground: false,
          showgrid: false,
          showline: false,
          showticklabels: false,
          zeroline: false,
          ticks: '' as const,
          title: { text: '' },
        },
        yaxis: {
          range: [0, heightUm],
          showbackground: false,
          showgrid: false,
          showline: false,
          showticklabels: false,
          zeroline: false,
          ticks: '' as const,
          title: { text: '' },
        },
        zaxis: {
          showbackground: false,
          showgrid: false,
          showline: false,
          showticklabels: false,
          zeroline: false,
          ticks: '' as const,
          title: { text: '' },
        },
      },
    }
  }, [widthUm, heightUm, visualMultiplier])

  const plotConfig = useMemo(
    () => ({
      displaylogo: false,
      responsive: true,
      displayModeBar: false,
    }),
    [],
  )

  const plotStyle = useMemo(() => ({ width: '100%', height: '100%' }), [])

  if (metaQuery.isLoading) {
    return (
      <div className="flex h-full w-full flex-col gap-3 p-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-full w-full" />
      </div>
    )
  }

  if (metaQuery.isError) {
    return <ErrorCard message={metaQuery.error.message} />
  }

  if (!metaQuery.data || channelMetas.length === 0) {
    return (
      <div className="text-muted-foreground rounded-md border p-4 text-sm">
        No channels detected in this scan.
      </div>
    )
  }

  const meta = metaQuery.data
  const zRangeNm = activeMeta ? activeMeta.maxValue - activeMeta.minValue : 0
  const trueRatio = zRangeNm > 0 ? meta.scanSizeNm / zRangeNm : 1

  return (
    <GradientCard className="relative h-full w-full gap-0 py-0">
      <div className="absolute inset-0">
        {activeQuery?.isLoading || !activeQuery ? (
          <div className="flex h-full items-center justify-center"></div>
        ) : activeQuery.isError ? (
          <ErrorCard message={activeQuery.error.message} />
        ) : plotData && activeMeta ? (
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground text-sm">
                  Loading 3D engine…
                </p>
              </div>
            }
          >
            <Plot
              data={plotData}
              layout={plotLayout}
              config={plotConfig}
              useResizeHandler
              style={plotStyle}
            />
          </Suspense>
        ) : null}
      </div>

      <div
        className="bg-card/85 absolute top-3 left-3 z-10 flex w-72 flex-col gap-3 rounded-md border p-3 shadow-md backdrop-blur-sm"
        title={`True physical aspect: 1:${trueRatio.toFixed(0)}`}
      >
        <div className="flex flex-col gap-1">
          <label
            className="text-muted-foreground text-xs font-medium"
            htmlFor={`channel-${rawImageId}`}
          >
            Channel
          </label>
          <select
            id={`channel-${rawImageId}`}
            value={activeChannel}
            onChange={(e) => {
              setSelectedChannel(e.target.value)
            }}
            className="border-input bg-background text-foreground h-9 rounded-md border px-3 text-sm"
          >
            {channelMetas.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name} ({c.unit})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label
            className="text-muted-foreground text-xs font-medium"
            htmlFor={`zexag-${rawImageId}`}
          >
            Z exaggeration: {visualMultiplierLive.toFixed(3)}× visual
          </label>
          <Slider
            id={`zexag-${rawImageId}`}
            min={1}
            max={200}
            step={1}
            value={[zExagLive]}
            onValueChange={(value: number | readonly number[]) => {
              const next = typeof value === 'number' ? value : value[0]
              if (typeof next === 'number') setZExagLive(next)
            }}
            onValueCommitted={(value: number | readonly number[]) => {
              const next = typeof value === 'number' ? value : value[0]
              if (typeof next === 'number') setZExagCommitted(next)
            }}
            className="w-full"
          />
        </div>

        {activeMeta && (
          <div className="text-muted-foreground text-xs">
            {activeMeta.width}×{activeMeta.height} ·{' '}
            {meta.scanSizeNm >= 1000
              ? `${(meta.scanSizeNm / 1000).toFixed(2)} µm`
              : `${meta.scanSizeNm.toFixed(0)} nm`}{' '}
            scan · Rq {activeMeta.rms.toFixed(2)} {activeMeta.unit}
          </div>
        )}
      </div>
    </GradientCard>
  )
}
