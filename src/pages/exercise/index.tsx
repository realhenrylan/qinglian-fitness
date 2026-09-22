import React, { useMemo, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import ExerciseCard from '@/components/ExerciseCard'
import { exercises } from '@/data/exercises'
import type { Exercise, PartType } from '@/types'

type FilterKey = '全部' | PartType
const FILTERS: FilterKey[] = ['全部', '胸部', '背部', '腿部', '肩部', '手臂', '核心', '有氧']

const ExercisePage: React.FC = () => {
  const [active, setActive] = useState<FilterKey>('全部')

  const filtered = useMemo(
    () => (active === '全部' ? exercises : exercises.filter((e) => e.part === active)),
    [active]
  )

  const viewDetail = (exercise: Exercise) => {
    Taro.navigateTo({ url: `/pages/exercise-detail/index?id=${exercise.id}` })
  }

  return (
    <View className={styles.page}>
      <Text className={styles.pageTitle}>动作库</Text>
      <Text className={styles.pageDesc}>标准动作示范，练对才有效</Text>

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

      <View className={styles.exerciseList}>
        {filtered.map((exercise) => (
          <View key={exercise.id} className={styles.exerciseItem}>
            <ExerciseCard exercise={exercise} onClick={viewDetail} />
          </View>
        ))}
        {filtered.length === 0 ? (
          <View className={styles.empty}>
            <Text className={styles.emptyIcon}>🤸</Text>
            <Text className={styles.emptyText}>暂无相关动作</Text>
          </View>
        ) : null}
      </View>
    </View>
  )
}

export default ExercisePage
