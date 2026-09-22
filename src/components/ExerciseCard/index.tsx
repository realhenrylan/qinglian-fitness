import React from 'react'
import { View, Text, Image } from '@tarojs/components'
import type { Exercise } from '@/types'
import styles from './index.module.scss'

interface ExerciseCardProps {
  exercise: Exercise
  onClick?: (exercise: Exercise) => void
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise, onClick }) => {
  return (
    <View className={styles.card} onClick={() => onClick?.(exercise)}>
      <Image
        className={styles.cover}
        src={exercise.cover}
        mode="aspectFill"
        onError={(e) => console.error('[ExerciseCard] 图片加载失败:', exercise.id, e)}
      />
      <View className={styles.info}>
        <Text className={styles.name}>{exercise.name}</Text>
        <View className={styles.tags}>
          <Text className={styles.part}>{exercise.part}</Text>
          <Text className={styles.level}>{exercise.level}</Text>
        </View>
      </View>
      <View className={styles.right}>
        <Text className={styles.duration}>{exercise.duration}秒</Text>
        <Text className={styles.kcal}>{exercise.kcal}千卡</Text>
      </View>
    </View>
  )
}

export default ExerciseCard
