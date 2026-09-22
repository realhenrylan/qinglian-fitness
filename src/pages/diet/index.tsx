import React, { useMemo } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import dayjs from 'dayjs'
import classnames from 'classnames'
import styles from './index.module.scss'
import StatRing from '@/components/StatRing'
import { useFitnessStore } from '@/store/useFitnessStore'
import { calcCaloriePlan, sumNutrition } from '@/utils/format'
import type { MealType } from '@/types'

const MEALS: { meal: MealType; icon: string }[] = [
  { meal: '早餐', icon: '🌅' },
  { meal: '午餐', icon: '☀️' },
  { meal: '晚餐', icon: '🌙' },
  { meal: '加餐', icon: '🍎' }
]

const DietPage: React.FC = () => {
  const dietEntries = useFitnessStore((s) => s.dietEntries)
  const records = useFitnessStore((s) => s.records)
  const waterMap = useFitnessStore((s) => s.waterMap)
  const profile = useFitnessStore((s) => s.profile)
  const removeDietEntry = useFitnessStore((s) => s.removeDietEntry)
  const setWaterCups = useFitnessStore((s) => s.setWaterCups)

  const today = dayjs().format('YYYY-MM-DD')

  const todayEntries = useMemo(
    () => dietEntries.filter((e) => e.date === today),
    [dietEntries, today]
  )
  const nutrition = useMemo(() => sumNutrition(todayEntries), [todayEntries])

  const caloriePlan = useMemo(() => calcCaloriePlan(profile), [profile])

  // 今日运动消耗自动增加可摄入额度
  const workoutKcal = useMemo(
    () => records.filter((r) => r.date === today).reduce((sum, r) => sum + r.kcal, 0),
    [records, today]
  )
  const budget = caloriePlan.target + workoutKcal
  const remaining = budget - nutrition.kcal

  const entriesByMeal = useMemo(() => {
    const map: Record<MealType, typeof todayEntries> = {
      早餐: [],
      午餐: [],
      晚餐: [],
      加餐: []
    }
    todayEntries.forEach((e) => map[e.meal].push(e))
    return map
  }, [todayEntries])

  const cups = waterMap[today] || 0

  const goAdd = (meal: MealType) => {
    Taro.navigateTo({ url: `/pages/diet-add/index?meal=${encodeURIComponent(meal)}` })
  }

  const handleDelete = (id: string, name: string) => {
    Taro.showModal({
      title: '移除食物',
      content: `确定移除「${name}」这条记录吗？`,
      confirmColor: '#f53f3f',
      success: (res) => {
        if (res.confirm) {
          removeDietEntry(id)
          Taro.showToast({ title: '已移除', icon: 'none' })
        }
      }
    })
  }

  const toggleCup = (index: number) => {
    // 点击当前最后一杯则取消，否则填满到该杯
    const next = cups === index + 1 ? index : index + 1
    setWaterCups(today, next)
  }

  const nutriRows = [
    {
      key: 'protein',
      name: '蛋白质',
      value: Math.round(nutrition.protein),
      target: caloriePlan.proteinTarget,
      barClass: styles.nutriBarProtein
    },
    {
      key: 'carb',
      name: '碳水化合物',
      value: Math.round(nutrition.carb),
      target: caloriePlan.carbTarget,
      barClass: styles.nutriBarCarb
    },
    {
      key: 'fat',
      name: '脂肪',
      value: Math.round(nutrition.fat),
      target: caloriePlan.fatTarget,
      barClass: styles.nutriBarFat
    }
  ]

  return (
    <View className={styles.page}>
      <Text className={styles.pageTitle}>饮食控制</Text>
      <Text className={styles.pageDesc}>吃动平衡，记录每日热量与营养</Text>

      {/* 今日热量概览 */}
      <View className={styles.hero}>
        <View className={styles.heroLeft}>
          <Text className={styles.heroLabel}>今日已摄入</Text>
          <Text className={styles.heroNum}>
            {nutrition.kcal}
            <Text className={styles.heroUnit}> 千卡</Text>
          </Text>
          <Text className={styles.heroTarget}>基础目标 {caloriePlan.target} 千卡</Text>
        </View>
        <StatRing
          size={176}
          thickness={13}
          percent={(nutrition.kcal / Math.max(budget, 1)) * 100}
          color="#ffffff"
          trackColor="rgba(255,255,255,0.28)"
          insetBg="transparent"
        >
          <Text className={styles.ringNum}>{Math.min(999, Math.round((nutrition.kcal / Math.max(budget, 1)) * 100))}%</Text>
          <Text className={styles.ringLabel}>热量进度</Text>
        </StatRing>
      </View>

      {/* 剩余可摄入 */}
      <View className={styles.budgetRow}>
        <Text className={styles.budgetIcon}>⚖️</Text>
        <Text className={styles.budgetText}>
          {remaining >= 0 ? '今日还可摄入' : '已超出目标'}
        </Text>
        <Text className={classnames(styles.budgetNum, remaining < 0 && styles.budgetOver)}>
          {Math.abs(remaining)} 千卡
        </Text>
      </View>
      {workoutKcal > 0 ? (
        <Text className={styles.pageDesc}>
          今日运动消耗 {workoutKcal} 千卡，已自动计入可摄入额度
        </Text>
      ) : null}

      {/* 三大营养素 */}
      <View className={styles.card}>
        <Text className={styles.cardTitle}>营养素概览</Text>
        {nutriRows.map((row) => (
          <View key={row.key} className={styles.nutriRow}>
            <View className={styles.nutriHead}>
              <Text className={styles.nutriName}>{row.name}</Text>
              <Text className={styles.nutriValue}>
                {row.value}
                <Text className={styles.nutriValueTarget}> / {row.target} g</Text>
              </Text>
            </View>
            <View className={styles.nutriBar}>
              <View
                className={classnames(styles.nutriBarInner, row.barClass)}
                style={{ width: `${Math.min(100, (row.value / Math.max(row.target, 1)) * 100)}%` }}
              />
            </View>
          </View>
        ))}
      </View>

      {/* 三餐 + 加餐 */}
      <View className={styles.card}>
        {MEALS.map(({ meal, icon }) => {
          const list = entriesByMeal[meal]
          const mealKcal = list.reduce((sum, e) => sum + e.kcal * e.servings, 0)
          return (
            <View key={meal} className={styles.meal}>
              <View className={styles.mealHead}>
                <Text className={styles.mealIcon}>{icon}</Text>
                <Text className={styles.mealName}>{meal}</Text>
                {mealKcal > 0 ? (
                  <Text className={styles.mealKcal}>{mealKcal} 千卡</Text>
                ) : null}
                <View className={styles.mealAdd} onClick={() => goAdd(meal)}>
                  <Text>＋</Text>
                </View>
              </View>
              {list.length > 0 ? (
                <View className={styles.entryList}>
                  {list.map((entry) => (
                    <View key={entry.id} className={styles.entry}>
                      <View className={styles.entryDot} />
                      <Text className={styles.entryName}>
                        {entry.foodName} ×{entry.servings}
                      </Text>
                      <Text className={styles.entryKcal}>{entry.kcal * entry.servings} 千卡</Text>
                      <Text
                        className={styles.entryDel}
                        onClick={() => handleDelete(entry.id, entry.foodName)}
                      >
                        删除
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text className={styles.mealEmpty} onClick={() => goAdd(meal)}>
                  点击 + 记录{meal}
                </Text>
              )}
            </View>
          )
        })}
      </View>

      {/* 饮水打卡 */}
      <View className={styles.card}>
        <Text className={styles.cardTitle}>每日饮水（目标 8 杯 · 约 2000ml）</Text>
        <View className={styles.waterCups}>
          {Array.from({ length: 8 }, (_, i) => (
            <Text
              key={i}
              className={classnames(styles.cup, i < cups && styles.cupFilled)}
              onClick={() => toggleCup(i)}
            >
              💧
            </Text>
          ))}
        </View>
        <Text className={styles.waterText}>已喝 {cups}/8 杯，少量多次更健康</Text>
      </View>

      {/* 饮食小贴士 */}
      <View className={styles.tipsCard}>
        <Text className={styles.tipsIcon}>🥗</Text>
        <Text className={styles.tipsText}>
          建议每餐有一拳主食、一掌优质蛋白、两拳蔬菜；控油限糖、细嚼慢咽，减脂期每日热量缺口控制在
          300-500 千卡更可持续。
        </Text>
      </View>
    </View>
  )
}

export default DietPage
