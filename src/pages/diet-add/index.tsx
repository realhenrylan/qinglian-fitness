import React, { useMemo, useState } from 'react'
import { View, Text, Image, Input, Button, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import { foods } from '@/data/foods'
import { useFitnessStore } from '@/store/useFitnessStore'
import type { FoodCategory, MealType } from '@/types'

type CategoryFilter = '全部' | FoodCategory
const CATEGORIES: CategoryFilter[] = [
  '全部',
  '主食',
  '肉蛋奶',
  '蔬菜',
  '水果',
  '坚果零食',
  '饮品'
]

const resolveMeal = (): MealType => {
  const raw = Taro.getCurrentInstance().router?.params?.meal
  const decoded = raw ? decodeURIComponent(raw) : ''
  const allowed: MealType[] = ['早餐', '午餐', '晚餐', '加餐']
  return (allowed as string[]).includes(decoded) ? (decoded as MealType) : '早餐'
}

const DietAddPage: React.FC = () => {
  const meal = useMemo(() => resolveMeal(), [])
  const addDietEntry = useFitnessStore((s) => s.addDietEntry)

  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('全部')
  const [servingsMap, setServingsMap] = useState<Record<string, number>>({})
  const [addedCount, setAddedCount] = useState(0)

  const filteredFoods = useMemo(() => {
    const kw = keyword.trim()
    return foods.filter((food) => {
      const matchCategory = category === '全部' || food.category === category
      const matchKeyword = !kw || food.name.includes(kw)
      return matchCategory && matchKeyword
    })
  }, [keyword, category])

  const getServings = (id: string) => servingsMap[id] || 1

  const changeServings = (id: string, delta: number) => {
    setServingsMap((prev) => {
      const next = Math.max(1, Math.min(9, (prev[id] || 1) + delta))
      return { ...prev, [id]: next }
    })
  }

  const handleAdd = (food: (typeof foods)[number]) => {
    const servings = getServings(food.id)
    addDietEntry({
      meal,
      foodId: food.id,
      foodName: food.name,
      servings,
      kcal: food.kcal,
      protein: food.protein,
      carb: food.carb,
      fat: food.fat
    })
    setAddedCount((prev) => prev + 1)
    Taro.showToast({ title: `已添加到${meal}`, icon: 'none' })
  }

  const handleDone = () => {
    Taro.navigateBack()
  }

  return (
    <View className={styles.page}>
      <Text className={styles.mealInfo}>添加到 · {meal}</Text>
      <Text className={styles.mealSub}>选择食物并调整份数，按份估算更简单</Text>

      {/* 搜索 */}
      <View className={styles.searchCard}>
        <Text className={styles.searchIcon}>🔍</Text>
        <Input
          className={styles.searchInput}
          value={keyword}
          placeholder="搜索食物名称"
          confirmType="search"
          onInput={(e) => setKeyword(e.detail.value)}
        />
      </View>

      {/* 分类 */}
      <ScrollView scrollX className={styles.chipScroll}>
        {CATEGORIES.map((item) => (
          <Text
            key={item}
            className={classnames(styles.chip, category === item && styles.chipActive)}
            onClick={() => setCategory(item)}
          >
            {item}
          </Text>
        ))}
      </ScrollView>

      {/* 食物列表 */}
      <View className={styles.foodList}>
        {filteredFoods.map((food) => {
          const servings = getServings(food.id)
          return (
            <View key={food.id} className={styles.foodItem}>
              <Image
                className={styles.foodCover}
                src={food.cover}
                mode="aspectFill"
                onError={(e) => console.error('[DietAdd] 食物图片加载失败:', food.id, e)}
              />
              <View className={styles.foodInfo}>
                <Text className={styles.foodName}>{food.name}</Text>
                <Text className={styles.foodUnit}>{food.unit}</Text>
                <Text className={styles.foodKcal}>
                  {food.kcal}千卡/份 · 蛋{food.protein} 碳{food.carb} 脂{food.fat}
                </Text>
              </View>
              <View className={styles.stepper}>
                <View
                  className={classnames(
                    styles.stepBtn,
                    servings === 1 && styles.stepBtnDisabled
                  )}
                  onClick={() => changeServings(food.id, -1)}
                >
                  <Text>−</Text>
                </View>
                <Text className={styles.stepNum}>{servings}</Text>
                <View className={styles.stepBtn} onClick={() => changeServings(food.id, 1)}>
                  <Text>＋</Text>
                </View>
              </View>
              <Button className={styles.addBtn} onClick={() => handleAdd(food)}>
                添加
              </Button>
            </View>
          )
        })}
        {filteredFoods.length === 0 ? (
          <View className={styles.empty}>
            <Text className={styles.emptyIcon}>🍽️</Text>
            <Text className={styles.emptyText}>没有找到相关食物</Text>
          </View>
        ) : null}
      </View>

      {/* 底部完成栏 */}
      <View className={styles.bottomBar}>
        <Text className={styles.doneBtnText}>
          {addedCount > 0 ? `本次已添加 ${addedCount} 项食物` : '选择好食物后点击添加'}
        </Text>
        <Button className={styles.doneBtn} onClick={handleDone}>
          完成
        </Button>
      </View>
    </View>
  )
}

export default DietAddPage
