'use client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card'

interface DataPoint { date: string; weight: number }

export default function WeightChart({ data }: { data: DataPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Weight Trend</CardTitle>
        <p className="text-xs text-[rgb(var(--muted-foreground))] mt-1">Last 30 days</p>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-[rgb(var(--muted-foreground))] text-sm">
            No measurements yet — add your first weight log
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'rgb(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'rgb(var(--muted-foreground))' }} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgb(var(--card))',
                  border: '1px solid rgb(var(--border))',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: 'rgb(var(--foreground))',
                }}
              />
              <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', strokeWidth: 0, r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
