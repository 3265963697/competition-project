'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/solid'
import { getAllNPCs, NPCData } from '../data/npcData'

export default function NPCPage() {
  const [npcs, setNpcs] = useState<NPCData[]>([])

  useEffect(() => {
    // Get all NPCs
    const allNPCs = getAllNPCs()
    setNpcs(allNPCs)
  }, [])

  return (
    <div className="min-h-screen p-6">
      {/* Back Button */}
      <Link href="/garden">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="mb-8 flex items-center text-white hover:text-gray-300"
        >
          <ArrowLeftIcon className="h-6 w-6 mr-2" />
          返回家园
        </motion.button>
      </Link>

      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">家园NPC</h1>
        
        <p className="text-gray-300 mb-6">
          与您家园中的NPC互动，了解他们的背景故事，提升好感度，解锁更多互动内容。
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {npcs.map(npc => (
            <Link href={`/npc/${npc.id}`} key={npc.id}>
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg overflow-hidden shadow-xl cursor-pointer h-full"
              >
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="text-4xl mr-4">{npc.icon}</div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{npc.name}</h2>
                      <p className="text-gray-300">{npc.description}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm font-medium text-gray-400">背景</h3>
                      <p className="text-gray-300 text-sm line-clamp-2">{npc.background}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-400">好感度</h3>
                      <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                        <div 
                          className="bg-gradient-to-r from-red-500 to-pink-500 h-2 rounded-full"
                          style={{ width: `${npc.relationship}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-400">兴趣</h3>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {npc.interests.map((interest, index) => (
                          <span 
                            key={index} 
                            className="px-2 py-1 bg-gray-700 text-gray-200 text-xs rounded-full"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-center">
                    <span className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white text-sm transition-colors">
                      开始对话
                    </span>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
} 