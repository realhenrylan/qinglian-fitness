import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import { getPlanById, plans } from '@/data/plans'
import { getExerciseById } from '@/data/exercises'
import { useFitnessStore } from '@/store/useFitnessStore'
import { formatClock } from '@/utils/format'
import type { Exercise, WorkoutPlan } from '@/types'

const resolvePlan = (): WorkoutPlan => {
  const id = Taro.getCurrentInstance().router?.params?.id
  const found = id ? getPlanById(id) : undefined
  return found || plans[0]
}

const WorkoutPage: React.FC = () => {
  const addRecord = useFitnessStore((s) => s.addRecord)

  const plan = useMemo(() => resolvePlan(), [])
  const planExercises = useMemo<Exercise[]>(
    () =>
      plan.exerciseIds
        .map((id) => getExerciseById(id))
        .filter((item): item is Exercise => Boolean(item)),
    [plan]
  )

  const [checkedIds, setCheckedIds] = useState<string[]>([])
  const [elapsed, setElapsed] = useState(0)
  const [paused, setPaused] = useState(false)

  // 计时器
  useEffect(() => {
    if (paused) return
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [paused])

  const totalCount = planExercises.length
  const doneCount = checkedIds.length
  const allDone = doneCount === totalCount

  const toggleExercise = (id: string) => {
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleReset = () => {
    Taro.showModal({
      title: '重置计时',
      content: '确定要清空当前进度并重新开始吗？',
      success: (res) => {
        if (res.confirm) {
          setElapsed(0)
          setCheckedIds([])
          setPaused(false)
        }
      }
    })
  }

  const doFinish = () => {
    // 按完成比例计算时长与消耗，训练满 30 秒则以实际计时为准
    const ratio = doneCount / totalCount
    const minutes =
      elapsed >= 30
        ? Math.max(1, Math.round(elapsed / 60))
        : Math.max(1, Math.round(plan.duration * ratio))
    const kcal = Math.max(1, Math.round(plan.kcal * ratio))

    addRecord({
      planId: plan.id,
      planTitle: plan.title,
      duration: minutes,
      kcal,
      completedCount: doneCount,
      totalCount
    })

    Taro.showModal({
      title: '训练完成 🎉',
      content: `本次训练 ${minutes} 分钟，消耗约 ${kcal} 千卡。记得拉伸放松、补充水分哦！`,
      showCancel: false,
      confirmText: '查看数据',
      success: () => {
        Taro.switchTab({ url: '/pages/stats/index' })
      }
    })
  }

  const handleFinish = () => {
    if (doneCount === 0) {
      Taro.showToast({ title: '请至少完成一个动作', icon: 'none' })
      return
    }
    if (!allDone) {
      Taro.showModal({
        title: '提前结束训练？',
        content: `还有 ${totalCount - doneCount} 个动作未完成，确定结束并记录吗？`,
        confirmText: '结束',
        success: (res) => {
          if (res.confirm) doFinish()
        }
      })
      return
    }
    doFinish()
  }

  return (
    <View className={styles.page}>
      {/* 计划信息 */}
      <View className={styles.planCard}>
        <Text className={styles.planTitle}>{plan.title}</Text>
        <View className={styles.planMeta}>
          <Text className={styles.planMetaItem}>预计 {plan.duration} 分钟</Text>
          <Text className={styles.planMetaItem}>约 {plan.kcal} 千卡</Text>
          <Text className={styles.planMetaItem}>{plan.level}</Text>
        </View>
      </View>

      {/* 计时器 */}
      <View className={styles.timerCard}>
        <View className={styles.timerLeft}>
          <Text className={styles.timerLabel}>已训练时长</Text>
          <Text className={styles.timerValue}>{formatClock(elapsed)}</Text>
        </View>
        <View className={styles.timerBtns}>
          <Button
            className={classnames(
              styles.timerBtn,
              paused ? styles.timerResume : styles.timerPause
            )}
            onClick={() => setPaused((prev) => !prev)}
          >
            {paused ? '继续' : '暂停'}
          </Button>
          <Button className={classnames(styles.timerBtn, styles.timerReset)} onClick={handleReset}>
            重置
          </Button>
        </View>
      </View>

      {/* 热身提示 */}
      <View className={styles.warmup}>
        <Text className={styles.warmupIcon}>🔥</Text>
        <Text className={styles.warmupText}>
          训练前建议先热身 5 分钟（开合跳、关节环绕），动作之间休息 30-60 秒。
        </Text>
      </View>

      {/* 动作清单 */}
      <View className={styles.listCard}>
        <Text className={styles.listTitle}>动作清单（{totalCount} 个动作）</Text>
        {planExercises.map((exercise, idx) => {
          const checked = checkedIds.includes(exercise.id)
          return (
            <View key={exercise.id}>
              <View className={styles.exerciseItem} onClick={() => toggleExercise(exercise.id)}>
                <View className={classnames(styles.checkbox, checked && styles.checkboxChecked)}>
                  <Text>✓</Text>
                </View>
                <View className={styles.exerciseInfo}>
                  <Text
                    className={classnames(styles.exerciseName, checked && styles.exerciseDone)}
                  >
                    {idx + 1}. {exercise.name}
                  </Text>
                  <Text className={styles.exerciseMeta}>
                    {exercise.part} · {exercise.duration}秒/组 · {exercise.kcal}千卡
                  </Text>
                </View>
              </View>
              {idx < planExercises.length - 1 ? (
                <Text className={styles.restTip}>— 组间休息 30-60 秒 —</Text>
              ) : null}
            </View>
          )
        })}
      </View>

      {/* 底部完成栏 */}
      <View className={styles.bottomBar}>
        <Text className={styles.progressText}>
          已完成 {doneCount}/{totalCount} 个动作
        </Text>
        <Button
          className={classnames(styles.finishBtn, doneCount === 0 && styles.finishBtnDisabled)}
          onClick={handleFinish}
        >
          {allDone ? '完成训练' : '结束并记录'}
        </Button>
      </View>
    </View>
  )
}

export default WorkoutPage
