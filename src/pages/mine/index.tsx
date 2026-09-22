import React, { useMemo } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import { useFitnessStore } from '@/store/useFitnessStore'
import { bmiLevel, calcBMI } from '@/utils/format'
import type { GoalType } from '@/types'

interface Achievement {
  icon: string
  name: string
  unlocked: boolean
}

const MinePage: React.FC = () => {
  const records = useFitnessStore((s) => s.records)
  const profile = useFitnessStore((s) => s.profile)
  const updateProfile = useFitnessStore((s) => s.updateProfile)

  const totals = useMemo(() => {
    const duration = records.reduce((sum, r) => sum + r.duration, 0)
    const kcal = records.reduce((sum, r) => sum + r.kcal, 0)
    const trainDays = new Set(records.map((r) => r.date)).size
    return { count: records.length, duration, kcal, trainDays }
  }, [records])

  const bmi = calcBMI(profile.height, profile.weight)
  const weightGap = Number(Math.abs(profile.weight - profile.targetWeight).toFixed(1))

  const achievements: Achievement[] = [
    { icon: '🎯', name: '初次训练', unlocked: totals.count >= 1 },
    { icon: '📅', name: '坚持7天', unlocked: totals.trainDays >= 7 },
    { icon: '💪', name: '累计10次', unlocked: totals.count >= 10 },
    { icon: '🔥', name: '燃脂1000', unlocked: totals.kcal >= 1000 },
    { icon: '🏆', name: '累计30次', unlocked: totals.count >= 30 },
    { icon: '⭐', name: '训练50次', unlocked: totals.count >= 50 }
  ]

  const editNumber = (
    title: string,
    value: number,
    onConfirm: (num: number) => void
  ) => {
    Taro.showModal({
      title,
      editable: true,
      placeholderText: String(value),
      content: String(value),
      success: (res) => {
        if (!res.confirm) return
        const num = Number(res.content)
        if (!num || num <= 0) {
          Taro.showToast({ title: '请输入有效数字', icon: 'none' })
          return
        }
        onConfirm(num)
        Taro.showToast({ title: '已保存', icon: 'success' })
      }
    })
  }

  const editNickname = () => {
    Taro.showModal({
      title: '修改昵称',
      editable: true,
      content: profile.nickname,
      success: (res) => {
        if (res.confirm && res.content) {
          updateProfile({ nickname: res.content.slice(0, 12) })
        }
      }
    })
  }

  const chooseGoal = () => {
    const goals: GoalType[] = ['减脂', '增肌', '塑形', '入门']
    Taro.showActionSheet({
      itemList: goals,
      success: (res) => {
        updateProfile({ goal: goals[res.tapIndex] })
        Taro.showToast({ title: '目标已更新', icon: 'success' })
      }
    })
  }

  return (
    <View className={styles.page}>
      {/* 个人资料 */}
      <View className={styles.profileCard}>
        <Image
          className={styles.avatar}
          src={profile.avatar}
          mode="aspectFill"
          onError={(e) => console.error('[Mine] 头像加载失败:', e)}
        />
        <View className={styles.profileInfo}>
          <Text className={styles.nickname}>{profile.nickname}</Text>
          <View className={styles.profileSub}>
            <Text className={styles.profileTag}>{profile.goal}</Text>
            <Text className={styles.profileTag}>{profile.gender}</Text>
          </View>
        </View>
        <Text className={styles.editBtn} onClick={editNickname}>
          编辑
        </Text>
      </View>

      {/* 累计数据 */}
      <View className={styles.totalRow}>
        <View className={styles.totalItem}>
          <Text className={styles.totalNum}>{totals.count}</Text>
          <Text className={styles.totalLabel}>总次数</Text>
        </View>
        <View className={styles.totalItem}>
          <Text className={styles.totalNum}>{totals.duration}</Text>
          <Text className={styles.totalLabel}>总分钟</Text>
        </View>
        <View className={styles.totalItem}>
          <Text className={styles.totalNum}>{totals.kcal}</Text>
          <Text className={styles.totalLabel}>总千卡</Text>
        </View>
      </View>

      {/* BMI 与身体数据 */}
      <View className={styles.card}>
        <Text className={styles.cardTitle}>身体数据</Text>
        <View className={styles.bmiBody}>
          <View className={styles.bmiValueBox}>
            <Text className={styles.bmiNum}>{bmi || '--'}</Text>
            <Text className={styles.bmiTag}>BMI · {bmiLevel(bmi)}</Text>
          </View>
          <View className={styles.bmiRows}>
            <View
              className={styles.bmiRow}
              onClick={() =>
                editNumber('年龄', profile.age, (num) => updateProfile({ age: num }))
              }
            >
              <Text className={styles.bmiLabel}>年龄</Text>
              <Text className={styles.bmiValue}>
                {profile.age} 岁<Text className={styles.bmiArrow}>›</Text>
              </Text>
            </View>
            <View
              className={styles.bmiRow}
              onClick={() =>
                editNumber('身高（cm）', profile.height, (num) => updateProfile({ height: num }))
              }
            >
              <Text className={styles.bmiLabel}>身高</Text>
              <Text className={styles.bmiValue}>
                {profile.height} cm<Text className={styles.bmiArrow}>›</Text>
              </Text>
            </View>
            <View
              className={styles.bmiRow}
              onClick={() =>
                editNumber('体重（kg）', profile.weight, (num) => updateProfile({ weight: num }))
              }
            >
              <Text className={styles.bmiLabel}>体重</Text>
              <Text className={styles.bmiValue}>
                {profile.weight} kg<Text className={styles.bmiArrow}>›</Text>
              </Text>
            </View>
            <View
              className={styles.bmiRow}
              onClick={() =>
                editNumber('目标体重（kg）', profile.targetWeight, (num) =>
                  updateProfile({ targetWeight: num })
                )
              }
            >
              <Text className={styles.bmiLabel}>目标体重</Text>
              <Text className={styles.bmiValue}>
                {profile.targetWeight} kg<Text className={styles.bmiArrow}>›</Text>
              </Text>
            </View>
          </View>
        </View>
        <Text className={styles.bmiTip}>
          距离目标体重还差 {weightGap} kg，合理训练 + 均衡饮食，每周减重 0.5-1kg
          更健康可持续。
        </Text>
      </View>

      {/* 成就徽章 */}
      <View className={styles.card}>
        <Text className={styles.cardTitle}>我的成就</Text>
        <View className={styles.achievementGrid}>
          {achievements.map((item) => (
            <View key={item.name} className={styles.achievement}>
              <View
                className={classnames(
                  styles.achievementIcon,
                  !item.unlocked && styles.achievementLocked
                )}
              >
                <Text>{item.icon}</Text>
              </View>
              <Text className={styles.achievementName}>{item.name}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 设置列表 */}
      <View className={styles.cellList}>
        <View className={styles.cell} onClick={chooseGoal}>
          <Text className={styles.cellIcon}>🎯</Text>
          <Text className={styles.cellLabel}>健身目标</Text>
          <Text className={styles.cellValue}>{profile.goal}</Text>
          <Text className={styles.cellArrow}>›</Text>
        </View>
        <View
          className={styles.cell}
          onClick={() => Taro.showToast({ title: '提醒功能开发中', icon: 'none' })}
        >
          <Text className={styles.cellIcon}>⏰</Text>
          <Text className={styles.cellLabel}>训练提醒</Text>
          <Text className={styles.cellArrow}>›</Text>
        </View>
        <View
          className={styles.cell}
          onClick={() =>
            Taro.showModal({
              title: '关于轻练',
              content: '轻练 v1.0.0\n倡导科学合理健身：循序渐进、劳逸结合，陪你养成可持续的运动习惯。',
              showCancel: false
            })
          }
        >
          <Text className={styles.cellIcon}>ℹ️</Text>
          <Text className={styles.cellLabel}>关于轻练</Text>
          <Text className={styles.cellArrow}>›</Text>
        </View>
      </View>
    </View>
  )
}

export default MinePage
