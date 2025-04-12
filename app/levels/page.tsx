'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeftIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/solid'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export type Stats = {
  道: number
  德: number
  仁: number
  义: number
  礼: number
}

type LevelStatus = 'locked' | 'unlocked' | 'completed'

type Level = {
  id: number
  name: string
  description: string
  position: { x: number; y: number }
  requirements: Stats | null
  connections: number[]
}

// 定义关卡数据结构
const levels: Level[] = [
  {
    id: 1,
    name: '初入江湖',
    description: '你刚刚踏入这片充满智慧的土地...',
    position: { x: 50, y: 50 }, // 中心位置
    requirements: null, // 起始点无要求
    connections: [2, 3, 4], // 连接到的关卡ID
  },
  {
    id: 2,
    name: '仁者之道',
    description: '探索仁爱之道',
    position: { x: 30, y: 30 }, // 左上
    requirements: { 道: 3, 德: 2, 仁: 5, 义: 2, 礼: 3 },
    connections: [1],
  },
  {
    id: 3,
    name: '义之抉择',
    description: '在正义与私利之间...',
    position: { x: 70, y: 30 }, // 右上
    requirements: { 道: 4, 德: 3, 仁: 2, 义: 5, 礼: 2 },
    connections: [1],
  },
  {
    id: 4,
    name: '礼之准则',
    description: '礼节背后的深意',
    position: { x: 50, y: 70 }, // 下方
    requirements: { 道: 2, 德: 4, 仁: 3, 义: 2, 礼: 5 },
    connections: [1],
  },
]

export default function Levels() {
  const router = useRouter()
  // 玩家属性状态
  const [playerStats, setPlayerStats] = useState<Stats>({
    道: 3,
    德: 3,
    仁: 3,
    义: 3,
    礼: 3,
  })

  // 关卡完成状态
  const [completedLevels, setCompletedLevels] = useState<number[]>([])

  // 从 localStorage 加载状态
  useEffect(() => {
    const savedCompletedLevels = JSON.parse(localStorage.getItem('completedLevels') || '[]') as number[]
    setCompletedLevels(savedCompletedLevels)

    const levelEffects = JSON.parse(localStorage.getItem('levelEffects') || '{}') as Record<string, Partial<Stats>>
    // 计算总的属性效果
    const totalEffects = Object.values(levelEffects).reduce((acc: Partial<Stats>, curr: Partial<Stats>) => {
      Object.entries(curr).forEach(([key, value]) => {
        if (value) {
          acc[key as keyof Stats] = (acc[key as keyof Stats] || 3) + value
        }
      })
      return acc
    }, {} as Partial<Stats>)

    // 更新玩家属性
    setPlayerStats(prev => ({
      ...prev,
      ...Object.fromEntries(
        Object.entries(totalEffects).map(([key, value]) => [key, Math.max(0, Math.min(10, value || 3))])
      ) as Stats
    }))
  }, [])

  // 视觉小说状态
  const [isNovelOpen, setIsNovelOpen] = useState(false)
  const [currentLevel, setCurrentLevel] = useState<Level | null>(null)

  // 检查关卡是否可解锁
  const checkLevelAvailability = (level: Level): boolean => {
    if (!level.requirements) return true // 起始关卡总是可用
    
    // 检查前置关卡是否已完成
    const prerequisitesCompleted = level.connections.every(connectedId => 
      completedLevels.includes(connectedId)
    )
    
    if (!prerequisitesCompleted) return false
    
    // 计算属性差值的绝对值之和
    const getDifference = (stats: Stats, requirements: Stats): number => {
      return Object.keys(requirements).reduce((sum, key) => {
        return sum + Math.abs(stats[key as keyof Stats] - requirements[key as keyof Stats])
      }, 0)
    }

    // 获取所有关卡的差值
    const differences = levels
      .filter(l => l.requirements)
      .map(l => getDifference(playerStats, l.requirements as Stats))
    
    // 当前关卡的差值
    const currentDiff = getDifference(playerStats, level.requirements)
    
    // 如果当前关卡的差值是最小的，或者完全满足要求（差值为0），则可解锁
    return currentDiff === Math.min(...differences) || currentDiff === 0
  }

  // 获取关卡状态
  const getLevelStatus = (level: Level): LevelStatus => {
    if (completedLevels.includes(level.id)) return 'completed'
    if (checkLevelAvailability(level)) return 'unlocked'
    return 'locked'
  }

  // 获取关卡样式
  const getLevelStyle = (status: LevelStatus): string => {
    switch (status) {
      case 'completed':
        return 'bg-gradient-to-br from-green-600 to-green-700 cursor-pointer'
      case 'unlocked':
        return 'bg-gradient-to-br from-blue-600 to-blue-700 cursor-pointer'
      default:
        return 'bg-gray-700 cursor-not-allowed'
    }
  }

  // 调整玩家属性
  const adjustStat = (stat: keyof Stats, amount: number) => {
    setPlayerStats(prev => {
      const newValue = Math.max(0, Math.min(10, prev[stat] + amount));
      return {
        ...prev,
        [stat]: newValue
      };
    });
  };

  // 获取关卡背景颜色
  const getLevelBackgroundColor = (status: LevelStatus): string => {
    switch (status) {
      case 'completed':
        return 'rgba(16, 185, 129, 0.8)'; // 绿色
      case 'unlocked':
        return 'rgba(59, 130, 246, 0.8)'; // 蓝色
      default:
        return 'rgba(75, 85, 99, 0.8)'; // 灰色
    }
  };

  // 处理关卡点击
  const handleLevelClick = (level: Level) => {
    const status = getLevelStatus(level)
    if (status === 'locked') return
    router.push(`/novel/${level.id}`)
  }

  return (
    <div className="min-h-screen p-6 relative">
      {/* Back Button */}
      <Link href="/">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="mb-8 flex items-center text-white hover:text-gray-300"
        >
          <ArrowLeftIcon className="h-6 w-6 mr-2" />
          返回主页
        </motion.button>
      </Link>

      {/* Player Stats */}
      <div className="mb-8 p-4 bg-gray-800 rounded-lg">
        <h2 className="text-xl font-bold text-white mb-4">当前属性</h2>
        <div className="grid grid-cols-5 gap-4">
          {Object.entries(playerStats).map(([stat, value]) => (
            <div key={stat} className="text-center flex flex-col items-center">
              <div className="text-lg font-bold text-white">{stat}</div>
              <div className="text-purple-400 my-1">{value}</div>
              <div className="flex flex-col">
                <button 
                  onClick={() => adjustStat(stat as keyof Stats, 1)}
                  className="text-white bg-purple-700 hover:bg-purple-600 rounded-t px-2 py-0.5"
                >
                  <ChevronUpIcon className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => adjustStat(stat as keyof Stats, -1)}
                  className="text-white bg-purple-700 hover:bg-purple-600 rounded-b px-2 py-0.5"
                >
                  <ChevronDownIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Spider Web Level Map */}
      <div className="relative w-full h-[600px] bg-gray-900 rounded-lg overflow-hidden p-4">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500" />
        </div>

        {/* Connection Lines */}
        <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
          {levels.map(level =>
            level.connections.map(connectedId => {
              const connectedLevel = levels.find(l => l.id === connectedId)
              if (!connectedLevel) return null
              return (
                <line
                  key={`${level.id}-${connectedId}`}
                  x1={`${level.position.x}%`}
                  y1={`${level.position.y}%`}
                  x2={`${connectedLevel.position.x}%`}
                  y2={`${connectedLevel.position.y}%`}
                  stroke="#4B5563"
                  strokeWidth="3"
                  strokeDasharray="4 4"
                />
              )
            })
          )}
        </svg>

        {/* Level Nodes */}
        {levels.map((level) => {
          const status = getLevelStatus(level)
          return (
            <motion.div
              key={level.id}
              onClick={() => handleLevelClick(level)}
              className={`absolute w-48 p-4 rounded-xl border-2 backdrop-blur-sm shadow-lg transform -translate-x-1/2 -translate-y-1/2 ${getLevelStyle(status)}`}
              style={{
                left: `${level.position.x}%`,
                top: `${level.position.y}%`,
                zIndex: 2,
                backgroundColor: getLevelBackgroundColor(status),
                borderColor: status === 'completed' ? '#10B981' : status === 'unlocked' ? '#3B82F6' : '#4B5563',
              }}
              whileHover={status !== 'locked' ? { scale: 1.1, y: '-55%' } : {}}
            >
              <h3 className="text-lg font-bold text-white mb-1">{level.name}</h3>
              <p className="text-sm text-gray-200 mb-2">{level.description}</p>
              {level.requirements && (
                <div className="text-xs text-gray-300">
                  需求：
                  {Object.entries(level.requirements as Stats).map(([stat, value], index, array) => (
                    <span key={stat}>
                      {stat}:{value}
                      {index < array.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
} 