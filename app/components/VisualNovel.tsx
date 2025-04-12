import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { Dialog } from '@headlessui/react'

export type Stats = {
  道: number
  德: number
  仁: number
  义: number
  礼: number
}

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

export type VisualNovelProps = {
  isOpen: boolean
  onClose: () => void
  onComplete: (stats: Partial<Stats>) => void
}

export default function VisualNovel({ isOpen, onClose, onComplete }: VisualNovelProps) {
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
      // 对话结束，返回累积的效果
      onComplete(accumulatedEffects)
      onClose()
      // 重置状态
      setCurrentStep(0)
      setAccumulatedEffects({})
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog
          as={motion.div}
          static
          open={isOpen}
          onClose={onClose}
          className="fixed inset-0 z-50 overflow-y-auto"
        >
          <div className="flex min-h-screen items-center justify-center p-4">
            <Dialog.Panel>
              <div className="fixed inset-0 bg-black/75" aria-hidden="true" />
              <div className="fixed inset-0 flex items-center justify-center p-4">
                <div className="relative w-full max-w-2xl rounded-2xl bg-gray-800 p-6 shadow-xl">
                  {/* 对话文本 */}
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-white text-lg mb-8"
                  >
                    {currentDialog.text}
                  </motion.div>

                  {/* 选项或继续按钮 */}
                  <div className="mt-4">
                    {currentDialog.choices ? (
                      <div className="space-y-2">
                        {currentDialog.choices.map((choice, index) => (
                          <motion.button
                            key={index}
                            onClick={() => handleChoice(choice)}
                            className="w-full p-3 text-left bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
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
                        className="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        继续
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  )
} 