import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { heightDistributionMock } from '@/lib/mock-height-distribution'
import { Bar, BarChart, XAxis, YAxis } from 'recharts'

const chartConfig = {
  occurrenceFrequency: {
    label: 'Occurrence',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig

export function HeightDistributionChart() {
  return (
    <ChartContainer config={chartConfig} className="h-full w-full">
      <BarChart
        accessibilityLayer
        data={heightDistributionMock}
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
          radius={[2, 2, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  )
}
