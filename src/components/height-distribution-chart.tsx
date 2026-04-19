import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Bar, BarChart, XAxis, YAxis } from 'recharts'

const chartConfig = {
  occurrenceFrequency: {
    label: 'Occurrence',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig

export interface HeightDistributionPoint {
  heightRange: number
  occurrenceFrequency: number
}

export function HeightDistributionChart({
  data = [],
}: {
  data?: HeightDistributionPoint[]
}) {
  if (data.length === 0) {
    return (
      <div className="text-muted-foreground flex h-full w-full items-center justify-center text-xs">
        No data yet
      </div>
    )
  }
  return (
    <ChartContainer config={chartConfig} className="h-full w-full">
      <BarChart
        accessibilityLayer
        data={data}
        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
      >
        <XAxis
          dataKey="heightRange"
          tickLine={false}
          axisLine={false}
          tickMargin={4}
          fontSize={10}
          unit=" nm"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          fontSize={10}
          width={36}
          tickFormatter={(v: number) => v.toFixed(3)}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(label) => `Height ${String(label)} nm`}
              formatter={(value) => (value as number).toFixed(4)}
            />
          }
        />
        <Bar
          dataKey="occurrenceFrequency"
          fill="var(--color-occurrenceFrequency)"
          fillOpacity={0.75}
          radius={[2, 2, 0, 0]}
          activeBar={{
            fillOpacity: 1,
            stroke: 'var(--color-occurrenceFrequency)',
            strokeWidth: 2,
            strokeOpacity: 0.5,
          }}
        />
      </BarChart>
    </ChartContainer>
  )
}
