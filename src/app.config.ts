export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/plan/index',
    'pages/diet/index',
    'pages/stats/index',
    'pages/mine/index',
    'pages/workout/index',
    'pages/exercise/index',
    'pages/diet-add/index',
    'pages/plan-detail/index',
    'pages/exercise-detail/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: '轻练',
    navigationBarTextStyle: 'black',
    backgroundColor: '#f5f8f6'
  },
  tabBar: {
    color: '#86909c',
    selectedColor: '#00b578',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页',
        iconPath: 'assets/tabbar/home.svg',
        selectedIconPath: 'assets/tabbar/home-selected.svg'
      },
      {
        pagePath: 'pages/plan/index',
        text: '计划',
        iconPath: 'assets/tabbar/plan.svg',
        selectedIconPath: 'assets/tabbar/plan-selected.svg'
      },
      {
        pagePath: 'pages/diet/index',
        text: '饮食',
        iconPath: 'assets/tabbar/diet.svg',
        selectedIconPath: 'assets/tabbar/diet-selected.svg'
      },
      {
        pagePath: 'pages/stats/index',
        text: '数据',
        iconPath: 'assets/tabbar/stats.svg',
        selectedIconPath: 'assets/tabbar/stats-selected.svg'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的',
        iconPath: 'assets/tabbar/mine.svg',
        selectedIconPath: 'assets/tabbar/mine-selected.svg'
      }
    ]
  }
})
