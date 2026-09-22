import type { Food } from '@/types'

const FOOD_IMG_IDS = [292, 312, 326, 401, 431, 570, 580, 625, 835, 1080]

const cover = (i: number) =>
  `https://picsum.photos/id/${FOOD_IMG_IDS[i % FOOD_IMG_IDS.length]}/200/200`

export const foods: Food[] = [
  // ---------- 主食 ----------
  {
    id: 'food_rice',
    name: '米饭',
    category: '主食',
    kcal: 232,
    protein: 5.2,
    carb: 52,
    fat: 0.6,
    unit: '1碗 / 约200g',
    cover: cover(0)
  },
  {
    id: 'food_noodle',
    name: '清汤面条',
    category: '主食',
    kcal: 280,
    protein: 9,
    carb: 55,
    fat: 2,
    unit: '1碗 / 约250g',
    cover: cover(1)
  },
  {
    id: 'food_bread',
    name: '全麦面包',
    category: '主食',
    kcal: 75,
    protein: 4,
    carb: 13,
    fat: 1,
    unit: '1片 / 约30g',
    cover: cover(2)
  },
  {
    id: 'food_oat',
    name: '燕麦片（干）',
    category: '主食',
    kcal: 150,
    protein: 5,
    carb: 26,
    fat: 3,
    unit: '1份 / 40g',
    cover: cover(3)
  },
  {
    id: 'food_sweetpotato',
    name: '蒸红薯',
    category: '主食',
    kcal: 172,
    protein: 2.4,
    carb: 40,
    fat: 0.2,
    unit: '1个 / 约200g',
    cover: cover(4)
  },
  {
    id: 'food_corn',
    name: '水煮玉米',
    category: '主食',
    kcal: 112,
    protein: 4,
    carb: 22,
    fat: 1.2,
    unit: '1根 / 约200g',
    cover: cover(5)
  },

  // ---------- 肉蛋奶 / 豆制品 ----------
  {
    id: 'food_egg',
    name: '水煮蛋',
    category: '肉蛋奶',
    kcal: 78,
    protein: 6.5,
    carb: 0.6,
    fat: 5.5,
    unit: '1个 / 约50g',
    cover: cover(6)
  },
  {
    id: 'food_chicken',
    name: '鸡胸肉（熟）',
    category: '肉蛋奶',
    kcal: 118,
    protein: 21,
    carb: 0,
    fat: 3,
    unit: '1份 / 100g',
    cover: cover(7)
  },
  {
    id: 'food_beef',
    name: '瘦牛肉（熟）',
    category: '肉蛋奶',
    kcal: 125,
    protein: 20,
    carb: 2,
    fat: 4,
    unit: '1份 / 100g',
    cover: cover(8)
  },
  {
    id: 'food_salmon',
    name: '三文鱼',
    category: '肉蛋奶',
    kcal: 139,
    protein: 19,
    carb: 0,
    fat: 6.5,
    unit: '1份 / 100g',
    cover: cover(9)
  },
  {
    id: 'food_shrimp',
    name: '白灼虾',
    category: '肉蛋奶',
    kcal: 87,
    protein: 18,
    carb: 0.5,
    fat: 1.2,
    unit: '1份 / 100g',
    cover: cover(0)
  },
  {
    id: 'food_milk',
    name: '纯牛奶',
    category: '肉蛋奶',
    kcal: 135,
    protein: 8,
    carb: 10,
    fat: 7.5,
    unit: '1盒 / 250ml',
    cover: cover(1)
  },
  {
    id: 'food_yogurt',
    name: '无糖酸奶',
    category: '肉蛋奶',
    kcal: 90,
    protein: 9,
    carb: 7.5,
    fat: 3,
    unit: '1杯 / 150g',
    cover: cover(2)
  },
  {
    id: 'food_tofu',
    name: '北豆腐',
    category: '肉蛋奶',
    kcal: 120,
    protein: 12,
    carb: 4,
    fat: 7,
    unit: '1份 / 150g',
    cover: cover(3)
  },

  // ---------- 蔬菜 ----------
  {
    id: 'food_broccoli',
    name: '西兰花',
    category: '蔬菜',
    kcal: 68,
    protein: 5.6,
    carb: 9,
    fat: 0.8,
    unit: '1份 / 约200g',
    cover: cover(4)
  },
  {
    id: 'food_tomato',
    name: '番茄',
    category: '蔬菜',
    kcal: 22,
    protein: 1.1,
    carb: 4.8,
    fat: 0.2,
    unit: '1个 / 约150g',
    cover: cover(5)
  },
  {
    id: 'food_cucumber',
    name: '黄瓜',
    category: '蔬菜',
    kcal: 32,
    protein: 1.6,
    carb: 6,
    fat: 0.4,
    unit: '1根 / 约200g',
    cover: cover(6)
  },
  {
    id: 'food_lettuce',
    name: '生菜',
    category: '蔬菜',
    kcal: 15,
    protein: 1.4,
    carb: 2,
    fat: 0.2,
    unit: '1份 / 100g',
    cover: cover(7)
  },

  // ---------- 水果 ----------
  {
    id: 'food_apple',
    name: '苹果',
    category: '水果',
    kcal: 95,
    protein: 0.5,
    carb: 25,
    fat: 0.3,
    unit: '1个 / 约200g',
    cover: cover(8)
  },
  {
    id: 'food_banana',
    name: '香蕉',
    category: '水果',
    kcal: 105,
    protein: 1.3,
    carb: 27,
    fat: 0.4,
    unit: '1根 / 约120g',
    cover: cover(9)
  },
  {
    id: 'food_orange',
    name: '橙子',
    category: '水果',
    kcal: 62,
    protein: 1.2,
    carb: 15,
    fat: 0.2,
    unit: '1个 / 约150g',
    cover: cover(0)
  },

  // ---------- 坚果零食 ----------
  {
    id: 'food_nuts',
    name: '混合坚果',
    category: '坚果零食',
    kcal: 180,
    protein: 6,
    carb: 6,
    fat: 15,
    unit: '1小把 / 30g',
    cover: cover(1)
  },
  {
    id: 'food_darkchoco',
    name: '黑巧克力（70%）',
    category: '坚果零食',
    kcal: 108,
    protein: 1.2,
    carb: 9,
    fat: 7,
    unit: '2小块 / 20g',
    cover: cover(2)
  },

  // ---------- 饮品 ----------
  {
    id: 'food_coffee',
    name: '黑咖啡（无糖）',
    category: '饮品',
    kcal: 5,
    protein: 0,
    carb: 0,
    fat: 0,
    unit: '1杯 / 约300ml',
    cover: cover(3)
  },
  {
    id: 'food_soymilk',
    name: '无糖豆浆',
    category: '饮品',
    kcal: 80,
    protein: 7,
    carb: 4,
    fat: 3.5,
    unit: '1杯 / 250ml',
    cover: cover(4)
  },
  {
    id: 'food_cola',
    name: '可乐',
    category: '饮品',
    kcal: 140,
    protein: 0,
    carb: 35,
    fat: 0,
    unit: '1罐 / 330ml',
    cover: cover(5)
  }
]

export const getFoodById = (id: string): Food | undefined =>
  foods.find((item) => item.id === id)
