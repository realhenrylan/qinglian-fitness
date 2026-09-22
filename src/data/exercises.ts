import type { Exercise } from '@/types'

const PERSON_IDS = [177, 338, 91, 1027, 64]

const cover = (i: number) =>
  `https://picsum.photos/id/${PERSON_IDS[i % PERSON_IDS.length]}/300/300`

export const exercises: Exercise[] = [
  {
    id: 'ex_01',
    name: '标准俯卧撑',
    part: '胸部',
    level: '初级',
    duration: 45,
    kcal: 6,
    cover: cover(0),
    desc: '经典上肢推力动作，锻炼胸大肌、肱三头肌与核心稳定性。'
  },
  {
    id: 'ex_02',
    name: '跪姿俯卧撑',
    part: '胸部',
    level: '初级',
    duration: 40,
    kcal: 5,
    cover: cover(1),
    desc: '降低难度的俯卧撑变式，适合力量较弱的健身新手。'
  },
  {
    id: 'ex_03',
    name: '哑铃卧推',
    part: '胸部',
    level: '中级',
    duration: 60,
    kcal: 9,
    cover: cover(2),
    desc: '胸肌增肌的王牌动作，注意肩胛后缩下沉、控制下放速度。'
  },
  {
    id: 'ex_04',
    name: '引体向上',
    part: '背部',
    level: '高级',
    duration: 30,
    kcal: 8,
    cover: cover(3),
    desc: '锻炼背阔肌与上肢拉力的黄金动作，核心收紧避免借力摆动。'
  },
  {
    id: 'ex_05',
    name: '俯身哑铃划船',
    part: '背部',
    level: '中级',
    duration: 45,
    kcal: 8,
    cover: cover(4),
    desc: '强化背阔肌与斜方肌中下部，注意腰背挺直、肘部贴身。'
  },
  {
    id: 'ex_06',
    name: '徒手深蹲',
    part: '腿部',
    level: '初级',
    duration: 45,
    kcal: 7,
    cover: cover(5),
    desc: '下肢训练之母，锻炼股四头肌与臀部，膝盖方向与脚尖一致。'
  },
  {
    id: 'ex_07',
    name: '交替箭步蹲',
    part: '腿部',
    level: '初级',
    duration: 40,
    kcal: 7,
    cover: cover(6),
    desc: '单腿力量动作，同时改善下肢平衡与左右力量差异。'
  },
  {
    id: 'ex_08',
    name: '仰卧臀桥',
    part: '腿部',
    level: '初级',
    duration: 45,
    kcal: 6,
    cover: cover(7),
    desc: '激活臀部、保护腰椎，顶部夹紧臀部停留一秒效果更佳。'
  },
  {
    id: 'ex_09',
    name: '坐姿哑铃推举',
    part: '肩部',
    level: '中级',
    duration: 45,
    kcal: 8,
    cover: cover(8),
    desc: '锻炼三角肌前束与中束，避免过度挺腰借力。'
  },
  {
    id: 'ex_10',
    name: '哑铃侧平举',
    part: '肩部',
    level: '初级',
    duration: 40,
    kcal: 5,
    cover: cover(9),
    desc: '塑造肩部立体线条，小重量、慢节奏，肘部微屈。'
  },
  {
    id: 'ex_11',
    name: '平板支撑',
    part: '核心',
    level: '初级',
    duration: 60,
    kcal: 5,
    cover: cover(10),
    desc: '核心稳定性训练，保持头、背、臀一条直线，均匀呼吸。'
  },
  {
    id: 'ex_12',
    name: '卷腹',
    part: '核心',
    level: '初级',
    duration: 45,
    kcal: 6,
    cover: cover(11),
    desc: '安全高效的腹部训练，下背部贴地，用腹部力量抬起上背。'
  },
  {
    id: 'ex_13',
    name: '俄罗斯转体',
    part: '核心',
    level: '中级',
    duration: 40,
    kcal: 7,
    cover: cover(12),
    desc: '强化腹斜肌与核心抗旋转能力，保持双脚离地、节奏稳定。'
  },
  {
    id: 'ex_14',
    name: '开合跳',
    part: '有氧',
    level: '初级',
    duration: 45,
    kcal: 8,
    cover: cover(13),
    desc: '经典热身与燃脂动作，前脚掌着地缓冲，保持轻快节奏。'
  },
  {
    id: 'ex_15',
    name: '原地高抬腿',
    part: '有氧',
    level: '初级',
    duration: 40,
    kcal: 8,
    cover: cover(14),
    desc: '快速提升心率的燃脂动作，大腿抬至与地面平行，摆臂配合。'
  },
  {
    id: 'ex_16',
    name: '哑铃二头弯举',
    part: '手臂',
    level: '初级',
    duration: 40,
    kcal: 5,
    cover: cover(15),
    desc: '锻炼肱二头肌，大臂贴紧身体固定，顶峰收缩一秒。'
  }
]

export const getExerciseById = (id: string): Exercise | undefined =>
  exercises.find((item) => item.id === id)
