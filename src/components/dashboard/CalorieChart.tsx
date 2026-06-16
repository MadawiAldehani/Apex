'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card'

interface DataPoint { day: string; calories: number; protein: number; carbs: number; fat: number }

export default function CalorieChart({ data }: { data: DataPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Calorie Intake</CardTitle>
        <p className="text-xs text-[rgb(var(--muted-foreground))] mt-1">Last 7 days</p>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-[rgb(var(--muted-foreground))] text-sm">
            No meals logged yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'rgb(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'rgb(var(--muted-foreground))' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgb(var(--card))',
                  border: '1px solid rgb(var(--border))',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: 'rgb(var(--foreground))',
                }}
              />
              <Bar dataKey="calories" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
