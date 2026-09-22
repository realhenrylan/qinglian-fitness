import React from 'react'
import { View, Text } from '@tarojs/components'
import classnames from 'classnames'
import styles from './index.module.scss'

interface SectionTitleProps {
  title: string
  desc?: string
  actionText?: string
  onAction?: () => void
  className?: string
}

const SectionTitle: React.FC<SectionTitleProps> = ({ title, desc, actionText, onAction, className }) => {
  return (
    <View className={classnames(styles.header, className)}>
      <View className={styles.left}>
        <Text className={styles.title}>{title}</Text>
        {desc ? <Text className={styles.desc}>{desc}</Text> : null}
      </View>
      {actionText ? (
        <Text className={styles.action} onClick={onAction}>
          {actionText}
        </Text>
      ) : null}
    </View>
  )
}

export default SectionTitle
