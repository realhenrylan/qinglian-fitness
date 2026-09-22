import React, { useMemo, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import PlanCard from '@/components/PlanCard'
import { plans } from '@/data/plans'
import type { GoalType, WorkoutPlan } from '@/types'

type FilterKey = '全部' | GoalType
const FILTERS: FilterKey[] = ['全部', '减脂', '增肌', '塑形', '入门']

const PlanPage: React.FC = () => {
  const [active, setActive] = useState<FilterKey>('全部')

  const filtered = useMemo(
    () => (active === '全部' ? plans : plans.filter((p) => p.goal === active)),
    [active]
  )

  const startWorkout = (plan: WorkoutPlan) => {
    console.info('[Plan] 开始训练:', plan.id)
    Taro.navigateTo({ url: `/pages/workout/index?id=${plan.id}` })
  }

  const viewDetail = () => {
    Taro.showToast({ title: '详情页开发中', icon: 'none' })
  }

  return (
    <View className={styles.page}>
      <View className={styles.topBar}>
        <Text className={styles.pageTitle}>训练计划</Text>
        <Text className={styles.pageDesc}>选择适合你目标的计划，科学开练</Text>
      </View>

      <ScrollView scrollX className={styles.chipScroll}>
        {FILTERS.map((key) => (
          <Text
            key={key}
            className={classnames(styles.chip, active === key && styles.chipActive)}
            onClick={() => setActive(key)}
          >
            {key}
          </Text>
        ))}
      </ScrollView>

      <View className={styles.planList}>
        {filtered.map((plan) => (
          <View key={plan.id} className={styles.planItem}>
            <PlanCard plan={plan} onClick={viewDetail} onStart={startWorkout} />
          </View>
        ))}
        {filtered.length === 0 ? (
          <View className={styles.empty}>
            <Text className={styles.emptyIcon}>🏃</Text>
            <Text className={styles.emptyText}>暂无相关计划</Text>
          </View>
        ) : null}
      </View>
    </View>
  )
}

export default PlanPage
