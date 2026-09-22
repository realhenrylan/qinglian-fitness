import React from 'react'
import { View, Text, Image, Button } from '@tarojs/components'
import classnames from 'classnames'
import type { WorkoutPlan } from '@/types'
import styles from './index.module.scss'

interface PlanCardProps {
  plan: WorkoutPlan
  onClick?: (plan: WorkoutPlan) => void
  onStart?: (plan: WorkoutPlan) => void
}

const TAG_CLASS_MAP: Record<WorkoutPlan['goal'], string> = {
  减脂: 'tagFat',
  增肌: 'tagMuscle',
  塑形: 'tagShape',
  入门: 'tagBegin'
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, onClick, onStart }) => {
  const handleStart = (e) => {
    e.stopPropagation()
    onStart?.(plan)
  }

  return (
    <View className={styles.card} onClick={() => onClick?.(plan)}>
      <Image
        className={styles.cover}
        src={plan.cover}
        mode="aspectFill"
        onError={(e) => console.error('[PlanCard] 封面加载失败:', plan.id, e)}
      />
      <View className={styles.info}>
        <Text className={styles.title}>{plan.title}</Text>
        <View className={styles.tags}>
          <Text className={classnames(styles.tag, styles[TAG_CLASS_MAP[plan.goal]])}>
            {plan.goal}
          </Text>
          <Text className={styles.level}>{plan.level}</Text>
        </View>
        <View className={styles.meta}>
          <Text className={styles.metaItem}>{plan.duration}分钟</Text>
          <Text className={styles.dot} />
          <Text className={styles.metaItem}>{plan.kcal}千卡</Text>
          <Text className={styles.dot} />
          <Text className={styles.metaItem}>每周{plan.days}练</Text>
        </View>
        {onStart ? (
          <Button className={styles.startBtn} onClick={handleStart}>
            开始训练
          </Button>
        ) : null}
      </View>
    </View>
  )
}

export default PlanCard
