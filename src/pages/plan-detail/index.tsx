import React from 'react'
import { View, Text } from '@tarojs/components'
import styles from './index.module.scss'

const PlanDetailPage: React.FC = () => {
  return (
    <View className={styles.page}>
      <Text className={styles.icon}>📋</Text>
      <Text className={styles.title}>计划详情</Text>
      <Text className={styles.tip}>功能正在开发中，敬请期待...</Text>
    </View>
  )
}

export default PlanDetailPage
