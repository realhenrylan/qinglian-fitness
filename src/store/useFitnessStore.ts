import Taro from '@tarojs/taro'
import dayjs from 'dayjs'
import { create } from 'zustand'
import type { DietEntry, UserProfile, WorkoutRecord } from '@/types'
import { genId } from '@/utils/format'

const RECORDS_KEY = 'qinglian_records'
const PROFILE_KEY = 'qinglian_profile'
const DIET_KEY = 'qinglian_diet_entries'
const WATER_KEY = 'qinglian_water'

const defaultProfile: UserProfile = {
  nickname: '健身新人',
  avatar: 'https://picsum.photos/id/64/200/200',
  gender: '男',
  age: 25,
  goal: '入门',
  height: 175,
  weight: 70,
  targetWeight: 65
}

const loadArray = <T>(key: string): T[] => {
  try {
    const value = Taro.getStorageSync(key)
    return Array.isArray(value) ? (value as T[]) : []
  } catch (e) {
    console.error(`[Store] 读取 ${key} 失败:`, e)
    return []
  }
}

const loadProfile = (): UserProfile => {
  try {
    const cached = Taro.getStorageSync(PROFILE_KEY) as Partial<UserProfile>
    // 与默认值合并，保证旧版本缓存缺失的新字段（如 age）有兜底
    return cached ? { ...defaultProfile, ...cached } : { ...defaultProfile }
  } catch (e) {
    console.error('[Store] 读取用户档案失败:', e)
    return { ...defaultProfile }
  }
}

const loadWater = (): Record<string, number> => {
  try {
    const value = Taro.getStorageSync(WATER_KEY)
    return value && typeof value === 'object' ? (value as Record<string, number>) : {}
  } catch (e) {
    console.error('[Store] 读取饮水记录失败:', e)
    return {}
  }
}

interface FitnessState {
  records: WorkoutRecord[]
  dietEntries: DietEntry[]
  waterMap: Record<string, number>
  profile: UserProfile
  addRecord: (data: Omit<WorkoutRecord, 'id' | 'ts' | 'date'>) => WorkoutRecord
  removeRecord: (id: string) => void
  addDietEntry: (data: Omit<DietEntry, 'id' | 'ts' | 'date'>) => void
  removeDietEntry: (id: string) => void
  setWaterCups: (date: string, cups: number) => void
  updateProfile: (patch: Partial<UserProfile>) => void
}

export const useFitnessStore = create<FitnessState>((set) => ({
  records: loadArray<WorkoutRecord>(RECORDS_KEY),
  dietEntries: loadArray<DietEntry>(DIET_KEY),
  waterMap: loadWater(),
  profile: loadProfile(),

  addRecord: (data) => {
    const record: WorkoutRecord = {
      ...data,
      id: genId(),
      date: dayjs().format('YYYY-MM-DD'),
      ts: Date.now()
    }
    console.info('[Store] 新增训练记录:', record.planTitle)
    set((state) => {
      const records = [record, ...state.records]
      try {
        Taro.setStorageSync(RECORDS_KEY, records)
      } catch (e) {
        console.error('[Store] 保存训练记录失败:', e)
      }
      return { records }
    })
    return record
  },

  removeRecord: (id) => {
    set((state) => {
      const records = state.records.filter((r) => r.id !== id)
      try {
        Taro.setStorageSync(RECORDS_KEY, records)
      } catch (e) {
        console.error('[Store] 删除训练记录失败:', e)
      }
      return { records }
    })
  },

  addDietEntry: (data) => {
    const entry: DietEntry = {
      ...data,
      id: genId(),
      date: dayjs().format('YYYY-MM-DD'),
      ts: Date.now()
    }
    console.info('[Store] 新增饮食记录:', entry.meal, entry.foodName, entry.servings, '份')
    set((state) => {
      const dietEntries = [...state.dietEntries, entry]
      try {
        Taro.setStorageSync(DIET_KEY, dietEntries)
      } catch (e) {
        console.error('[Store] 保存饮食记录失败:', e)
      }
      return { dietEntries }
    })
  },

  removeDietEntry: (id) => {
    set((state) => {
      const dietEntries = state.dietEntries.filter((e) => e.id !== id)
      try {
        Taro.setStorageSync(DIET_KEY, dietEntries)
      } catch (e) {
        console.error('[Store] 删除饮食记录失败:', e)
      }
      return { dietEntries }
    })
  },

  setWaterCups: (date, cups) => {
    set((state) => {
      const safeCups = Math.min(8, Math.max(0, cups))
      const waterMap = { ...state.waterMap, [date]: safeCups }
      try {
        Taro.setStorageSync(WATER_KEY, waterMap)
      } catch (e) {
        console.error('[Store] 保存饮水记录失败:', e)
      }
      return { waterMap }
    })
  },

  updateProfile: (patch) => {
    set((state) => {
      const profile = { ...state.profile, ...patch }
      try {
        Taro.setStorageSync(PROFILE_KEY, profile)
      } catch (e) {
        console.error('[Store] 保存用户档案失败:', e)
      }
      return { profile }
    })
  }
}))
