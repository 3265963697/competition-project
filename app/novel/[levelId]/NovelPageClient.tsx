'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/solid'
import React from 'react'
import { Stats } from '../../levels/page'

type Choice = {
  text: string
  effect: Partial<Stats>
}

type DialogStep = {
  text: string
  choices?: Choice[]
}

// 第一章的对话内容
const CHAPTER_ONE_DIALOG: DialogStep[] = [
  {
    text: '一个宁静的午后，你漫步在竹林小径上。微风拂过竹叶，发出沙沙的响声。突然，你看到一位老者正在路边休息。',
  },
  {
    text: '老者看起来有些疲惫，手中拄着一根竹杖。他注意到了你的到来，抬头微笑。',
  },
  {
    text: '"年轻人，能否帮我一个小忙？"老者和蔼地问道。',
    choices: [
      {
        text: '立即上前帮助老者',
        effect: { 仁: 2, 礼: 1 },
      },
      {
        text: '询问老者需要什么帮助',
        effect: { 道: 1, 德: 1 },
      },
      {
        text: '抱歉，我还有要事在身',
        effect: { 义: -1, 礼: -1 },
      },
    ],
  },
  {
    text: '老者露出欣慰的笑容："不错，年轻人。修身养性，首重仁义。今日一面，老夫就教你一些为人处世的道理。"',
  },
]

export default function NovelPageClient({ levelId }: { levelId: string }) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [accumulatedEffects, setAccumulatedEffects] = useState<Partial<Stats>>({})

  const currentDialog = CHAPTER_ONE_DIALOG[currentStep]

  const handleChoice = (choice: Choice) => {
    // 累加选择的效果
    const newEffects = { ...accumulatedEffects }
    Object.entries(choice.effect).forEach(([key, value]) => {
      const currentValue = newEffects[key as keyof Stats] || 0
      newEffects[key as keyof Stats] = currentValue + value
    })
    setAccumulatedEffects(newEffects)

    // 进入下一步
    handleNext()
  }

  const handleNext = () => {
    if (currentStep < CHAPTER_ONE_DIALOG.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // 对话结束，将效果保存到 localStorage
      const levelEffects = JSON.parse(localStorage.getItem('levelEffects') || '{}')
      levelEffects[levelId] = accumulatedEffects
      localStorage.setItem('levelEffects', JSON.stringify(levelEffects))
      
      // 更新已完成关卡
      const completed = JSON.parse(localStorage.getItem('completedLevels') || '[]')
      if (!completed.includes(Number(levelId))) {
        completed.push(Number(levelId))
        localStorage.setItem('completedLevels', JSON.stringify(completed))
      }
      
      // 返回关卡页面
      router.push('/levels')
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <Link href="/levels">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="mb-8 flex items-center text-white hover:text-gray-300"
        >
          <ArrowLeftIcon className="h-6 w-6 mr-2" />
          返回关卡
        </motion.button>
      </Link>

      <div className="max-w-2xl mx-auto mt-20">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-2xl p-8 shadow-xl"
        >
          {/* 对话文本 */}
          <div className="text-white text-xl mb-8 leading-relaxed">
            {currentDialog.text}
          </div>

          {/* 选项或继续按钮 */}
          <div className="mt-8">
            {currentDialog.choices ? (
              <div className="space-y-4">
                {currentDialog.choices.map((choice, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handleChoice(choice)}
                    className="w-full p-4 text-left bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors text-lg"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {choice.text}
                  </motion.button>
                ))}
              </div>
            ) : (
              <motion.button
                onClick={handleNext}
                className="w-full p-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors text-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                继续
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
} 