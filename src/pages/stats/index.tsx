import React, { useMemo, useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import dayjs from 'dayjs'
import classnames from 'classnames'
import styles from './index.module.scss'
import {
  WEEK_LABELS,
  calcStreak,
  getWeekDates,
  summarizeRecords
} from '@/utils/format'
import { useFitnessStore } from '@/store/useFitnessStore'
import type { WorkoutRecord } from '@/types'

interface CalCell {
  date?: string
  day?: number
}

const buildCalendar = (month: dayjs.Dayjs): CalCell[] => {
  const first = month.startOf('month')
  const lead = (first.day() + 6) % 7
  const cells: CalCell[] = []
  for (let i = 0; i < lead; i += 1) {
    cells.push({})
  }
  for (let d = 1; d <= month.daysInMonth(); d += 1) {
    cells.push({ date: month.date(d).format('YYYY-MM-DD'), day: d })
  }
  return cells
}

const formatRecordTime = (ts: number): string => dayjs(ts).format('HH:mm')

const StatsPage: React.FC = () => {
  const records = useFitnessStore((s) => s.records)
  const removeRecord = useFitnessStore((s) => s.removeRecord)
  const [month, setMonth] = useState<dayjs.Dayjs>(dayjs())

  const weekDates = useMemo(() => getWeekDates(), [])
  const weekSummary = useMemo(
    () => summarizeRecords(records, weekDates),
    [records, weekDates]
  )

  const recordDateSet = useMemo(() => new Set(records.map((r) => r.date)), [records])
  const streak = useMemo(() => calcStreak(recordDateSet), [recordDateSet])

  // 按日汇总本周耗能，用于柱状图
  const weekBars = useMemo(() => {
    return weekDates.map((date) => {
      const kcal = records.filter((r) => r.date === date).reduce((sum, r) => sum + r.kcal, 0)
      return { date, kcal }
    })
  }, [records, weekDates])
  const maxKcal = Math.max(...weekBars.map((b) => b.kcal), 1)

  const calendarCells = useMemo(() => buildCalendar(month), [month])
  const todayStr = dayjs().format('YYYY-MM-DD')

  const recentRecords = records.slice(0, 20)

  const handleDelete = (record: WorkoutRecord) => {
    Taro.showModal({
      title: '删除记录',
      content: `确定删除「${record.planTitle}」的训练记录吗？`,
      confirmColor: '#f53f3f',
      success: (res) => {
        if (res.confirm) {
          removeRecord(record.id)
          Taro.showToast({ title: '已删除', icon: 'none' })
        }
      }
    })
  }

  return (
    <View className={styles.page}>
      <Text className={styles.pageTitle}>训练数据</Text>

      {/* 本周概览 */}
      <View className={styles.overview}>
        <View className={styles.overviewItem}>
          <Text className={styles.overviewNum}>{weekSummary.count}</Text>
          <Text className={styles.overviewLabel}>本周次数</Text>
        </View>
        <View className={styles.overviewItem}>
          <Text className={styles.overviewNum}>{weekSummary.duration}</Text>
          <Text className={styles.overviewLabel}>本周分钟</Text>
        </View>
        <View className={styles.overviewItem}>
          <Text className={styles.overviewNum}>{weekSummary.kcal}</Text>
          <Text className={styles.overviewLabel}>本周千卡</Text>
        </View>
      </View>

      {/* 连续打卡 */}
      <View className={styles.streakCard}>
        <Text className={styles.streakIcon}>🔥</Text>
        <View className={styles.streakInfo}>
          <Text className={styles.streakNum}>已连续打卡 {streak} 天</Text>
          <Text className={styles.streakText}>坚持就是胜利，继续保持节奏</Text>
          <View className={styles.streakBar}>
            <View
              className={styles.streakBarInner}
              style={{ width: `${Math.min(100, (streak / 7) * 100)}%` }}
            />
          </View>
        </View>
      </View>

      {/* 本周耗能柱状图 */}
      <View className={styles.card}>
        <Text className={styles.cardTitle}>本周耗能（千卡）</Text>
        <View className={styles.chart}>
          {weekBars.map((bar, idx) => (
            <View key={bar.date} className={styles.barCol}>
              <View
                className={classnames(
                  styles.bar,
                  bar.date === todayStr && styles.barToday
                )}
                style={{ height: `${Math.max(bar.kcal === 0 ? 4 : 8, (bar.kcal / maxKcal) * 84)}%` }}
              />
              <Text
                className={classnames(
                  styles.barLabel,
                  bar.date === todayStr && styles.barLabelToday
                )}
              >
                {WEEK_LABELS[idx]}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* 训练日历 */}
      <View className={styles.card}>
        <View className={styles.calHeader}>
          <Text className={styles.calArrow} onClick={() => setMonth(month.subtract(1, 'month'))}>
            ‹
          </Text>
          <Text className={styles.calMonth}>{month.format('YYYY年M月')}</Text>
          <Text className={styles.calArrow} onClick={() => setMonth(month.add(1, 'month'))}>
            ›
          </Text>
        </View>
        <View className={styles.calWeek}>
          {WEEK_LABELS.map((label) => (
            <Text key={label} className={styles.calWeekLabel}>
              {label}
            </Text>
          ))}
        </View>
        <View className={styles.calGrid}>
          {calendarCells.map((cell, idx) => (
            <View key={`${cell.date || 'empty'}_${idx}`} className={styles.calCell}>
              {cell.date ? (
                <Text
                  className={classnames(
                    styles.calDay,
                    recordDateSet.has(cell.date) && styles.calDot,
                    cell.date === todayStr && styles.calDayToday
                  )}
                >
                  {cell.day}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      </View>

      {/* 最近训练记录 */}
      <View className={styles.card}>
        <Text className={styles.cardTitle}>最近训练</Text>
        <View className={styles.recordList}>
          {recentRecords.map((record) => (
            <View key={record.id} className={styles.recordItem}>
              <View className={styles.recordIcon}>
                <Text>🏋️</Text>
              </View>
              <View className={styles.recordInfo}>
                <Text className={styles.recordTitle}>{record.planTitle}</Text>
                <Text className={styles.recordMeta}>
                  {record.date} {formatRecordTime(record.ts)} · {record.duration}分钟 ·{' '}
                  {record.kcal}千卡
                </Text>
              </View>
              <Text className={styles.recordDel} onClick={() => handleDelete(record)}>
                删除
              </Text>
            </View>
          ))}
          {recentRecords.length === 0 ? (
            <View className={styles.empty}>
              <Text className={styles.emptyIcon}>📝</Text>
              <Text className={styles.emptyText}>还没有训练记录，去完成第一次训练吧</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  )
}

export default StatsPage
