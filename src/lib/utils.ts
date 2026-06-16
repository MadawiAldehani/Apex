import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateBMI(weight: number, height: number): number {
  const h = height / 100
  return Math.round((weight / (h * h)) * 10) / 10
}

export function calculateBMR(
  weight: number,
  height: number,
  age: number,
  gender: string
): number {
  if (gender === 'male') {
    return Math.round(88.362 + 13.397 * weight + 4.799 * height - 5.677 * age)
  }
  return Math.round(447.593 + 9.247 * weight + 3.098 * height - 4.33 * age)
}

export function getBMICategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-500' }
  if (bmi < 25) return { label: 'Normal', color: 'text-emerald-500' }
  if (bmi < 30) return { label: 'Overweight', color: 'text-yellow-500' }
  return { label: 'Obese', color: 'text-red-500' }
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function activityLabel(type: string): string {
  const map: Record<string, string> = {
    gym: 'Gym', pilates: 'Pilates', walking: 'Walking',
    lagree: 'Lagree', other: 'Other',
  }
  return map[type] ?? type
}

export function goalLabel(type: string): string {
  const map: Record<string, string> = {
    weight_loss: 'Weight Loss', muscle_gain: 'Muscle Gain',
    maintenance: 'Maintenance', endurance: 'Endurance',
  }
  return map[type] ?? type
}
