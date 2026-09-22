import dayjs from 'dayjs'
import type { DietEntry, UserProfile, WorkoutRecord } from '@/types'

export interface Nutrition {
  kcal: number
  protein: number
  carb: number
  fat: number
}

/** 汇总饮食条目的营养总量（含份数） */
export const sumNutrition = (entries: DietEntry[]): Nutrition => {
  return entries.reduce<Nutrition>(
    (acc, e) => ({
      kcal: acc.kcal + e.kcal * e.servings,
      protein: acc.protein + e.protein * e.servings,
      carb: acc.carb + e.carb * e.servings,
      fat: acc.fat + e.fat * e.servings
    }),
    { kcal: 0, protein: 0, carb: 0, fat: 0 }
  )
}

export interface CaloriePlan {
  bmr: number
  tdee: number
  target: number
  proteinTarget: number
  carbTarget: number
  fatTarget: number
}

/**
 * Mifflin-St Jeor 公式估算每日所需热量
 * 并按健身目标调整，同时给出三大营养素目标（克）
 */
export const calcCaloriePlan = (profile: UserProfile): CaloriePlan => {
  const { weight, height, age, gender, goal } = profile
  const base = 10 * weight + 6.25 * height - 5 * age
  const bmr = Math.round(gender === '男' ? base + 5 : base - 161)
  // 轻度~中度活动：每周规律训练 3 次左右
  const tdee = Math.round(bmr * 1.4)

  let target = tdee
  if (goal === '减脂') target = Math.round(tdee * 0.8)
  else if (goal === '增肌') target = tdee + 300
  else if (goal === '塑形') target = Math.round(tdee * 0.88)
  else target = Math.round(tdee * 0.9)

  const proteinFactor = goal === '增肌' || goal === '减脂' ? 1.8 : goal === '塑形' ? 1.5 : 1.2
  const proteinTarget = Math.round(weight * proteinFactor)
  const fatTarget = Math.round((target * 0.25) / 9)
  const carbTarget = Math.max(0, Math.round((target - proteinTarget * 4 - fatTarget * 9) / 4))

  return { bmr, tdee, target, proteinTarget, carbTarget, fatTarget }
}

/** 秒 -> mm:ss */
export const formatClock = (seconds: number): string => {
  const safe = Math.max(0, Math.floor(seconds))
  const m = Math.floor(safe / 60)
  const s = safe % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** 根据当前时间返回问候语 */
export const getGreeting = (): string => {
  const h = dayjs().hour()
  if (h < 6) return '夜深了'
  if (h < 11) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
}

/** 计算 BMI */
export const calcBMI = (heightCm: number, weightKg: number): number => {
  if (!heightCm || !weightKg) return 0
  const m = heightCm / 100
  return Number((weightKg / (m * m)).toFixed(1))
}

/** BMI 等级 */
export const bmiLevel = (bmi: number): string => {
  if (!bmi) return '--'
  if (bmi < 18.5) return '偏瘦'
  if (bmi < 24) return '正常'
  if (bmi < 28) return '超重'
  return '肥胖'
}

/** 生成简单唯一 id */
export const genId = (): string => `${Date.now()}_${Math.floor(Math.random() * 1e6)}`

export const WEEK_LABELS = ['一', '二', '三', '四', '五', '六', '日']

/** 获取本周（周一为起点）的 7 个日期 YYYY-MM-DD */
export const getWeekDates = (base = dayjs()): string[] => {
  const offset = (base.day() + 6) % 7
  const monday = base.subtract(offset, 'day')
  return Array.from({ length: 7 }, (_, i) => monday.add(i, 'day').format('YYYY-MM-DD'))
}

/** 汇总某组日期内的训练数据 */
export const summarizeRecords = (records: WorkoutRecord[], dates: string[]) => {
  const dateSet = new Set(dates)
  const list = records.filter((r) => dateSet.has(r.date))
  const trainDays = new Set(list.map((r) => r.date)).size
  return {
    trainDays,
    count: list.length,
    duration: list.reduce((sum, r) => sum + r.duration, 0),
    kcal: list.reduce((sum, r) => sum + r.kcal, 0),
    list
  }
}

/** 计算连续打卡天数（今天未打卡则从昨天起算） */
export const calcStreak = (dateSet: Set<string>): number => {
  let streak = 0
  let cursor = dayjs()
  if (!dateSet.has(cursor.format('YYYY-MM-DD'))) {
    cursor = cursor.subtract(1, 'day')
  }
  while (dateSet.has(cursor.format('YYYY-MM-DD'))) {
    streak += 1
    cursor = cursor.subtract(1, 'day')
  }
  return streak
}
