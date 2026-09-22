// 健身领域类型定义

export type GoalType = '减脂' | '增肌' | '塑形' | '入门'
export type LevelType = '初级' | '中级' | '高级'
export type PartType = '胸部' | '背部' | '腿部' | '肩部' | '手臂' | '核心' | '有氧'

/** 健身动作 */
export interface Exercise {
  id: string
  name: string
  part: PartType
  level: LevelType
  duration: number // 单组时长（秒）
  kcal: number // 单组消耗（千卡）
  cover: string
  desc: string
}

/** 训练计划 */
export interface WorkoutPlan {
  id: string
  title: string
  goal: GoalType
  level: LevelType
  duration: number // 预计时长（分钟）
  kcal: number // 预计消耗（千卡）
  days: number // 每周建议天数
  cover: string
  desc: string
  exerciseIds: string[]
  popular?: boolean
}

export type MealType = '早餐' | '午餐' | '晚餐' | '加餐'
export type FoodCategory = '主食' | '肉蛋奶' | '蔬菜' | '水果' | '坚果零食' | '饮品'

/** 食物（按份定义） */
export interface Food {
  id: string
  name: string
  category: FoodCategory
  kcal: number // 每份热量（千卡）
  protein: number // 每份蛋白质（克）
  carb: number // 每份碳水（克）
  fat: number // 每份脂肪（克）
  unit: string // 一份的描述，如 "1碗 / 200g"
  cover: string
}

/** 饮食记录条目 */
export interface DietEntry {
  id: string
  date: string // YYYY-MM-DD
  meal: MealType
  foodId: string
  foodName: string
  servings: number
  kcal: number // 每份热量
  protein: number // 每份
  carb: number // 每份
  fat: number // 每份
  ts: number
}

/** 训练记录 */
export interface WorkoutRecord {
  id: string
  date: string // YYYY-MM-DD
  planId: string
  planTitle: string
  duration: number // 分钟
  kcal: number
  completedCount: number
  totalCount: number
  ts: number
}

/** 用户档案 */
export interface UserProfile {
  nickname: string
  avatar: string
  gender: '男' | '女'
  age: number
  goal: GoalType
  height: number // cm
  weight: number // kg
  targetWeight: number // kg
}
