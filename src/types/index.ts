export interface Profile {
  id: string
  name: string
  age?: number
  gender?: 'male' | 'female' | 'other'
  weight?: number
  height?: number
  activity_type?: 'gym' | 'pilates' | 'walking' | 'lagree' | 'other'
  goal?: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'endurance'
  target_weight?: number
  target_date?: string
  units?: 'metric' | 'imperial'
  avatar_url?: string
  created_at?: string
  updated_at?: string
}

export interface BodyMeasurement {
  id: string
  user_id: string
  date: string
  weight?: number
  height?: number
  waist?: number
  hips?: number
  arms?: number
  chest?: number
  bmi?: number
  notes?: string
  created_at?: string
}

export interface WorkoutSession {
  id: string
  user_id: string
  date: string
  activity_type?: 'gym' | 'pilates' | 'walking' | 'lagree' | 'other'
  duration_mins?: number
  calories_burned?: number
  mood?: number
  energy_level?: number
  notes?: string
  created_at?: string
  exercises?: Exercise[]
}

export interface Exercise {
  id: string
  session_id: string
  user_id: string
  name: string
  sets?: number
  reps?: number
  weight_kg?: number
  is_pr?: boolean
  notes?: string
  created_at?: string
}

export interface Meal {
  id: string
  user_id: string
  date: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  name: string
  calories?: number
  protein_g?: number
  carbs_g?: number
  fat_g?: number
  is_favorite?: boolean
  created_at?: string
}

export interface WaterLog {
  id: string
  user_id: string
  date: string
  amount_ml: number
  created_at?: string
}

export interface MoodLog {
  id: string
  user_id: string
  date: string
  mood?: number
  energy_level?: number
  notes?: string
  created_at?: string
}

export interface Goal {
  id: string
  user_id: string
  type: 'weight' | 'workouts_per_week' | 'calories_per_day' | 'water_per_day' | 'steps'
  target_value: number
  current_value?: number
  deadline?: string
  is_achieved?: boolean
  created_at?: string
  updated_at?: string
}
