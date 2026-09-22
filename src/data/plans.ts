import type { WorkoutPlan } from '@/types'

const PERSON_IDS = [177, 64, 91, 338, 1027]

const cover = (i: number) =>
  `https://picsum.photos/id/${PERSON_IDS[i % PERSON_IDS.length]}/750/400`

export const plans: WorkoutPlan[] = [
  {
    id: 'plan_01',
    title: '零基础唤醒全身',
    goal: '入门',
    level: '初级',
    duration: 20,
    kcal: 160,
    days: 3,
    cover: cover(0),
    desc: '为完全没有训练基础的新手设计，用简单动作唤醒全身肌群，建立运动习惯。',
    exerciseIds: ['ex_02', 'ex_06', 'ex_08', 'ex_11', 'ex_14'],
    popular: true
  },
  {
    id: 'plan_02',
    title: '7天减脂燃动',
    goal: '减脂',
    level: '初级',
    duration: 30,
    kcal: 280,
    days: 5,
    cover: cover(1),
    desc: '有氧与自重力量结合，持续燃脂的同时保留肌肉，适合减脂期每周循环。',
    exerciseIds: ['ex_14', 'ex_15', 'ex_06', 'ex_07', 'ex_12', 'ex_13', 'ex_01'],
    popular: true
  },
  {
    id: 'plan_03',
    title: '居家增肌基础',
    goal: '增肌',
    level: '中级',
    duration: 40,
    kcal: 300,
    days: 4,
    cover: cover(2),
    desc: '一副哑铃即可完成的全身增肌计划，推拉平衡，循序渐进提升负重。',
    exerciseIds: ['ex_01', 'ex_03', 'ex_05', 'ex_09', 'ex_16', 'ex_06'],
    popular: true
  },
  {
    id: 'plan_04',
    title: '核心强化训练',
    goal: '塑形',
    level: '初级',
    duration: 25,
    kcal: 200,
    days: 4,
    cover: cover(3),
    desc: '针对腰腹核心的雕刻计划，强化稳定、收紧腰腹，让体态更挺拔。',
    exerciseIds: ['ex_11', 'ex_12', 'ex_13', 'ex_08', 'ex_15']
  },
  {
    id: 'plan_05',
    title: '下肢力量塑形',
    goal: '塑形',
    level: '中级',
    duration: 35,
    kcal: 270,
    days: 3,
    cover: cover(4),
    desc: '臀腿专项塑形，提升下肢力量与臀部线条，兼顾膝盖周围稳定肌群。',
    exerciseIds: ['ex_06', 'ex_07', 'ex_08', 'ex_15']
  },
  {
    id: 'plan_06',
    title: '上肢力量进阶',
    goal: '增肌',
    level: '高级',
    duration: 45,
    kcal: 340,
    days: 4,
    cover: cover(5),
    desc: '有一定训练基础后的上肢推拉进阶计划，全面强化胸背肩臂。',
    exerciseIds: ['ex_04', 'ex_01', 'ex_03', 'ex_05', 'ex_09', 'ex_10', 'ex_16']
  },
  {
    id: 'plan_07',
    title: '办公室肩颈放松',
    goal: '入门',
    level: '初级',
    duration: 15,
    kcal: 90,
    days: 3,
    cover: cover(6),
    desc: '久坐人群的肩颈舒缓方案，激活薄弱肌群、放松紧张上斜方肌。',
    exerciseIds: ['ex_10', 'ex_05', 'ex_11', 'ex_14']
  },
  {
    id: 'plan_08',
    title: 'HIIT 高效燃脂',
    goal: '减脂',
    level: '高级',
    duration: 25,
    kcal: 300,
    days: 5,
    cover: cover(7),
    desc: '高强度间歇训练，短时高效燃烧热量，运动后仍有持续燃脂效应。',
    exerciseIds: ['ex_14', 'ex_15', 'ex_06', 'ex_01', 'ex_13'],
    popular: true
  }
]

export const getPlanById = (id: string): WorkoutPlan | undefined =>
  plans.find((item) => item.id === id)
