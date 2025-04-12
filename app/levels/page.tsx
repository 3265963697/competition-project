'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/solid'

const levels = [
  { id: 1, name: '第一章', description: '诗经的智慧', locked: false },
  { id: 2, name: '第二章', description: '论语的启示', locked: false },
  { id: 3, name: '第三章', description: '道德经的玄妙', locked: true },
  { id: 4, name: '第四章', description: '庄子的逍遥', locked: true },
]

export default function Levels() {
  return (
    <div className="min-h-screen p-6">
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

      <h1 className="text-3xl font-bold text-white mb-8">关卡选择</h1>

      {/* Levels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {levels.map((level, index) => (
          <motion.div
            key={level.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-6 rounded-lg ${
              level.locked
                ? 'bg-gray-700 cursor-not-allowed'
                : 'bg-gradient-to-br from-purple-600 to-indigo-600 cursor-pointer hover:from-purple-700 hover:to-indigo-700'
            } transition-all`}
          >
            <h2 className="text-xl font-bold text-white mb-2">{level.name}</h2>
            <p className="text-gray-200 mb-4">{level.description}</p>
            {level.locked ? (
              <div className="flex items-center text-gray-400">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m0 0v2m0-2h2m-2 0H8"
                  />
                </svg>
                待解锁
              </div>
            ) : (
              <button className="bg-white bg-opacity-20 text-white px-4 py-2 rounded hover:bg-opacity-30 transition-all">
                开始游戏
              </button>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
} 