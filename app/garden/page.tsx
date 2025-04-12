'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/solid'

const gardenItems = [
  { id: 1, name: '竹林小径', description: '静谧幽深的竹林', unlocked: true },
  { id: 2, name: '古琴亭台', description: '抚琴修心的场所', unlocked: true },
  { id: 3, name: '书画阁楼', description: '创作艺术的空间', unlocked: false },
  { id: 4, name: '茶道小筑', description: '品茶悟道之处', unlocked: false },
]

export default function Garden() {
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

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">我的家园</h1>

        {/* Garden Stats */}
        <div className="bg-white bg-opacity-10 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-gray-400">解锁建筑</p>
              <p className="text-2xl font-bold text-white">2/4</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400">收集文物</p>
              <p className="text-2xl font-bold text-white">5</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400">文化值</p>
              <p className="text-2xl font-bold text-white">320</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400">访客数</p>
              <p className="text-2xl font-bold text-white">12</p>
            </div>
          </div>
        </div>

        {/* Garden Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {gardenItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-6 rounded-lg ${
                item.unlocked
                  ? 'bg-gradient-to-br from-green-600 to-teal-600 cursor-pointer hover:from-green-700 hover:to-teal-700'
                  : 'bg-gray-700 cursor-not-allowed'
              } transition-all`}
            >
              <h2 className="text-xl font-bold text-white mb-2">{item.name}</h2>
              <p className="text-gray-200 mb-4">{item.description}</p>
              {item.unlocked ? (
                <button className="bg-white bg-opacity-20 text-white px-4 py-2 rounded hover:bg-opacity-30 transition-all">
                  查看详情
                </button>
              ) : (
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
                  需要解锁
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
} 