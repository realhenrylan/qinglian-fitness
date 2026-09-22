import React, { useMemo } from 'react'
import { View, Text, Image, Button, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import dayjs from 'dayjs'
import styles from './index.module.scss'
import SectionTitle from '@/components/SectionTitle'
import StatRing from '@/components/StatRing'
import { plans } from '@/data/plans'
import { useFitnessStore } from '@/store/useFitnessStore'
import {
  getGreeting,
  getWeekDates,
  summarizeRecords
} from '@/utils/format'

const WEEK_TARGET = 5

const HomePage: React.FC = () => {
  const records = useFitnessStore((s) => s.records)
  const profile = useFitnessStore((s) => s.profile)

  const weekDates = useMemo(() => getWeekDates(), [])
  const weekSummary = useMemo(
    () => summarizeRecords(records, weekDates),
    [records, weekDates]
  )

  const todayPlan = plans[0]
  const recommended = useMemo(() => plans.filter((p) => p.popular).slice(0, 4), [])

  const goWorkout = (id: string) => {
    Taro.navigateTo({ url: `/pages/workout/index?id=${id}` })
  }

  const goExercise = () => {
    Taro.navigateTo({ url: '/pages/exercise/index' })
  }

  const quickEntries = [
    { label: '动作库', icon: '💪', iconClass: styles.quickIconGreen, action: goExercise },
    {
      label: '训练计划',
      icon: '📋',
      iconClass: styles.quickIconBlue,
      action: () => Taro.switchTab({ url: '/pages/plan/index' })
    },
    {
      label: '数据统计',
      icon: '📊',
      iconClass: styles.quickIconOrange,
      action: () => Taro.switchTab({ url: '/pages/stats/index' })
    },
    {
      label: '饮食记录',
      icon: '🍽️',
      iconClass: styles.quickIconPurple,
      action: () => Taro.switchTab({ url: '/pages/diet/index' })
    }
  ]

  return (
    <View className={styles.page}>
      {/* 顶部渐变问候区 */}
      <View className={styles.hero}>
        <View className={styles.heroTop}>
          <View>
            <Text className={styles.greeting}>
              {getGreeting()}，{profile.nickname}
            </Text>
            <Text className={styles.dateText}>
              {dayjs().format('M月D日 dddd').replace(/Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/, (d) => {
                const map = {
                  Monday: '星期一',
                  Tuesday: '星期二',
                  Wednesday: '星期三',
                  Thursday: '星期四',
                  Friday: '星期五',
                  Saturday: '星期六',
                  Sunday: '星期日'
                }
                return map[d]
              })}
            </Text>
          </View>
          <Image
            className={styles.avatar}
            src={profile.avatar}
            mode="aspectFill"
            onError={(e) => console.error('[Home] 头像加载失败:', e)}
          />
        </View>
      </View>

      {/* 本周数据卡 */}
      <View className={styles.weekCard}>
        <StatRing size={168} thickness={14} percent={(weekSummary.trainDays / WEEK_TARGET) * 100}>
          <Text className={styles.ringValue}>{weekSummary.trainDays}</Text>
          <Text className={styles.ringUnit}>/ {WEEK_TARGET} 天</Text>
        </StatRing>
        <View className={styles.weekStats}>
          <Text className={styles.weekTitle}>本周训练目标</Text>
          <View className={styles.weekRow}>
            <View className={styles.weekItem}>
              <Text className={styles.weekNum}>{weekSummary.duration}</Text>
              <Text className={styles.weekLabel}>分钟</Text>
            </View>
            <View className={styles.weekItem}>
              <Text className={styles.weekNum}>{weekSummary.kcal}</Text>
              <Text className={styles.weekLabel}>千卡</Text>
            </View>
            <View className={styles.weekItem}>
              <Text className={styles.weekNum}>{weekSummary.count}</Text>
              <Text className={styles.weekLabel}>次数</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 今日推荐 */}
      <View className={styles.section}>
        <SectionTitle title="今日推荐" desc="科学安排，循序渐进" />
        <View className={styles.todayCard}>
          <View className={styles.todayCoverWrap}>
            <Image
              className={styles.todayCover}
              src={todayPlan.cover}
              mode="aspectFill"
              onError={(e) => console.error('[Home] 今日推荐封面加载失败:', e)}
            />
            <View className={styles.todayMask}>
              <Text className={styles.todayTitle}>{todayPlan.title}</Text>
              <View className={styles.todayTags}>
                <Text className={styles.todayTag}>{todayPlan.goal}</Text>
                <Text className={styles.todayTag}>{todayPlan.level}</Text>
                <Text className={styles.todayTag}>每周{todayPlan.days}练</Text>
              </View>
            </View>
          </View>
          <View className={styles.todayBody}>
            <Text className={styles.todayDesc}>{todayPlan.desc}</Text>
            <View className={styles.todayMeta}>
              <View className={styles.todayMetaItem}>
                <View className={styles.todayMetaDot} />
                <Text>{todayPlan.duration} 分钟</Text>
              </View>
              <View className={styles.todayMetaItem}>
                <View className={`${styles.todayMetaDot} ${styles.todayMetaDotOrange}`} />
                <Text>{todayPlan.kcal} 千卡</Text>
              </View>
            </View>
            <Button className={styles.startBtn} onClick={() => goWorkout(todayPlan.id)}>
              开始今日训练
            </Button>
          </View>
        </View>
      </View>

      {/* 快捷入口 */}
      <View className={styles.section}>
        <View className={styles.quickGrid}>
          {quickEntries.map((item) => (
            <View key={item.label} className={styles.quickItem} onClick={item.action}>
              <View className={`${styles.quickIcon} ${item.iconClass}`}>
                <Text>{item.icon}</Text>
              </View>
              <Text className={styles.quickLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 热门计划 */}
      <View className={styles.section}>
        <SectionTitle
          title="热门训练计划"
          actionText="查看全部"
          onAction={() => Taro.switchTab({ url: '/pages/plan/index' })}
        />
        <ScrollView scrollX className={styles.planScroll} enhanced showScrollbar={false}>
          {recommended.map((plan) => (
            <View key={plan.id} className={styles.planSlide} onClick={() => goWorkout(plan.id)}>
              <Image
                className={styles.planSlideCover}
                src={plan.cover}
                mode="aspectFill"
                onError={(e) => console.error('[Home] 推荐计划封面加载失败:', plan.id, e)}
              />
              <View className={styles.planSlideBody}>
                <Text className={styles.planSlideTitle}>{plan.title}</Text>
                <Text className={styles.planSlideMeta}>
                  {plan.duration}分钟 · {plan.kcal}千卡
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* 合理健身小贴士 */}
      <View className={styles.section}>
        <View className={styles.tipsCard}>
          <Text className={styles.tipsIcon}>💡</Text>
          <Text className={styles.tipsText}>
            合理健身 = 循序渐进的训练 + 充足的休息与均衡饮食。建议训练前热身 5
            分钟，训练后拉伸放松，每周至少安排 1-2 天恢复。
          </Text>
        </View>
      </View>
    </View>
  )
}

export default HomePage
