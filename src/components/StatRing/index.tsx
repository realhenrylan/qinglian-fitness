import React from 'react'
import { View } from '@tarojs/components'
import classnames from 'classnames'
import styles from './index.module.scss'

interface StatRingProps {
  /** 直径 rpx */
  size: number
  /** 环厚度 rpx */
  thickness?: number
  /** 进度 0-100 */
  percent: number
  color?: string
  trackColor?: string
  insetBg?: string
  children?: React.ReactNode
}

const StatRing: React.FC<StatRingProps> = ({
  size,
  thickness = 14,
  percent,
  color = '#00b578',
  trackColor = '#e8edea',
  insetBg = '#ffffff',
  children
}) => {
  const p = Math.min(1, Math.max(0, percent / 100))
  const rightAngle = p <= 0.5 ? -180 + p * 360 : 0
  const leftAngle = p <= 0.5 ? -180 : -180 + (p - 0.5) * 360
  const circleSize = size - thickness
  const insetSize = size - 2 * thickness

  return (
    <View className={styles.ring} style={{ width: `${size}rpx`, height: `${size}rpx` }}>
      <View className={styles.track} style={{ backgroundColor: trackColor }} />
      <View className={classnames(styles.mask, styles.maskLeft)}>
        <View
          className={styles.halfCircle}
          style={{
            width: `${circleSize}rpx`,
            height: `${circleSize}rpx`,
            top: `${thickness / 2}rpx`,
            left: `${thickness / 2}rpx`,
            borderWidth: `${thickness}rpx`,
            borderBottomColor: color,
            borderLeftColor: color,
            transform: `rotate(${leftAngle}deg)`
          }}
        />
      </View>
      <View className={classnames(styles.mask, styles.maskRight)}>
        <View
          className={styles.halfCircle}
          style={{
            width: `${circleSize}rpx`,
            height: `${circleSize}rpx`,
            top: `${thickness / 2}rpx`,
            left: `${-(size - thickness) / 2}rpx`,
            borderWidth: `${thickness}rpx`,
            borderTopColor: color,
            borderRightColor: color,
            transform: `rotate(${rightAngle}deg)`
          }}
        />
      </View>
      <View
        className={styles.inset}
        style={{ width: `${insetSize}rpx`, height: `${insetSize}rpx`, backgroundColor: insetBg }}
      >
        {children}
      </View>
    </View>
  )
}

export default StatRing
