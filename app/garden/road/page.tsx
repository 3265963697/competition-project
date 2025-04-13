'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/solid'

// Types
type ItemType = 'npc' | 'building';

interface GameItem {
  id: string;
  name: string;
  description: string;
  size: number;
  type: ItemType;
  icon: string;
}

interface NPC extends GameItem {
  type: 'npc';
  bonusMultiplier?: number; // 增加建筑每次的消费量倍数
  bonusPrice?: number; // 增加建筑每次消费的价格
}

interface Building extends GameItem {
  type: 'building';
  shape: number[][];
  baseConsumption?: number; // 基础消费量
  basePrice?: number; // 基础价格
}

interface PlacedItem extends GameItem {
  position: {
    row: number;
    col: number;
  };
  // 如果是建筑，添加消费相关属性
  baseConsumption?: number;
  basePrice?: number;
  // 如果是NPC，添加加成相关属性
  bonusMultiplier?: number;
  bonusPrice?: number;
}

interface GardenCell {
  id: string;
  row: number;
  col: number;
  content: GameItem | null;
}

interface GridCell {
  id: string;
  row: number;
  col: number;
  isRoad: boolean;
  isStartPoint: boolean;
  isEndPoint: boolean;
  isValidNextCell?: boolean;
  content: GameItem | null; // Add content from garden layout
}

interface RoadUser {
  id: string;
  type: 'normal' | 'wealthy';
  position: number; // Index in the path array
  icon: string;
  speed: number; // Cells per second
  coins: number; // Coins earned/carried by the user
  lastConsumedBuilding?: string; // 最后消费的建筑ID
  lastConsumeTime?: number; // 最后消费的时间
  consumeCooldown: number; // 消费冷却时间（秒）
}

// Constants
const GRID_ROWS = 8;
const GRID_COLS = 15;

// Create empty grid
const createEmptyGrid = (): GridCell[][] => {
  const grid: GridCell[][] = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    const currentRow: GridCell[] = [];
    for (let col = 0; col < GRID_COLS; col++) {
      currentRow.push({
        id: `cell-${row}-${col}`,
        row,
        col,
        isRoad: false,
        isStartPoint: false,
        isEndPoint: false,
        isValidNextCell: false,
        content: null
      });
    }
    grid.push(currentRow);
  }
  return grid;
};

// Load garden layout from localStorage
const loadGardenLayout = (): GardenCell[][] | null => {
  if (typeof window === 'undefined') return null;
  
  const savedLayout = localStorage.getItem('gardenLayout');
  return savedLayout ? JSON.parse(savedLayout) : null;
};

export default function BusinessManagement() {
  const [grid, setGrid] = useState<GridCell[][]>([]);
  const [selectedCells, setSelectedCells] = useState<{row: number, col: number}[]>([]);
  const [startPoint, setStartPoint] = useState<{row: number, col: number} | null>(null);
  const [endPoint, setEndPoint] = useState<{row: number, col: number} | null>(null);
  const [businessStarted, setBusinessStarted] = useState(false);
  const businessStartedRef = useRef(false);
  const [users, setUsers] = useState<RoadUser[]>([]);
  const [isEditing, setIsEditing] = useState(true);
  const [totalCoins, setTotalCoins] = useState(0);
  const [gardenLoaded, setGardenLoaded] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const coinUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [consumptionEvents, setConsumptionEvents] = useState<Array<{
    buildingId: string;
    buildingName: string;
    amount: number;
    position: {row: number, col: number};
    timestamp: number;
    isSpecial?: boolean;
  }>>([]);
  const [activeConsumptions, setActiveConsumptions] = useState<{
    [key: string]: {
      amount: number;
      timestamp: number;
      isSpecial?: boolean;
    }
  }>({});

  // Initialize the grid with garden layout
  useEffect(() => {
    // Start with an empty grid
    const newGrid = createEmptyGrid();
    setGrid(newGrid);
    
    // Get the garden layout from the main page
    // For this to work properly, the garden page should save its state to localStorage
    // We're simulating this by creating a copy of the grid with some content
    if (typeof window !== 'undefined') {
      try {
        // Try to get garden grid from localStorage - this would be set by the garden page
        const gardenGrid = localStorage.getItem('gardenLayout');
        
        if (gardenGrid) {
          const parsedGrid: GardenCell[][] = JSON.parse(gardenGrid);
          
          // Copy content from garden grid to our grid with added economic properties
          const gridWithContent = newGrid.map((row, rowIndex) => 
            row.map((cell, colIndex) => {
              const content = parsedGrid[rowIndex]?.[colIndex]?.content;
              if (!content) return { ...cell, content: null };
              
              // Add economic properties based on item type
              if (content.type === 'building') {
                // Add consumption and price values based on building type
                const buildingContent = { 
                  ...content,
                  baseConsumption: getBuildingBaseConsumption(content.id),
                  basePrice: getBuildingBasePrice(content.id)
                };
                return { ...cell, content: buildingContent };
              } else if (content.type === 'npc') {
                // Add bonus multiplier and price based on NPC type
                const npcContent = {
                  ...content,
                  bonusMultiplier: getNPCBonusMultiplier(content.id),
                  bonusPrice: getNPCBonusPrice(content.id)
                };
                return { ...cell, content: npcContent };
              }
              
              return { ...cell, content };
            })
          );
          
          setGrid(gridWithContent);
          setGardenLoaded(true);
        }
      } catch (error) {
        console.error('Failed to load garden layout', error);
      }
    }
  }, []);
  
  // Handle cell click for road building
  const handleCellClick = (row: number, col: number) => {
    if (!isEditing) return;
    
    // Check if cell is adjacent to last selected cell or is the first selection
    const isValidSelection = selectedCells.length === 0 || 
      isAdjacent(row, col, selectedCells[selectedCells.length - 1].row, selectedCells[selectedCells.length - 1].col);
    
    if (!isValidSelection) return;
    
    // Check if cell is already selected
    const isCellSelected = selectedCells.some(cell => cell.row === row && cell.col === col);
    if (isCellSelected) return;
    
    const newSelectedCells = [...selectedCells, { row, col }];
    setSelectedCells(newSelectedCells);
    
    // Update grid
    const newGrid = [...grid];
    newGrid[row][col].isRoad = true;
    
    // If this is first cell, set as start point only
    if (newSelectedCells.length === 1) {
      newGrid[row][col].isStartPoint = true;
      setStartPoint({ row, col });
    } 
    // If this is the second cell or later
    else {
      // Previous end point is now just a road
      if (endPoint) {
        newGrid[endPoint.row][endPoint.col].isEndPoint = false;
      }
      
      // Current cell is the new end point
      newGrid[row][col].isEndPoint = true;
      setEndPoint({ row, col });
    }
    
    // Clear previous valid next cells
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        newGrid[r][c].isValidNextCell = false;
      }
    }
    
    // Mark valid next cells for the next selection
    if (isEditing && newSelectedCells.length > 0) {
      const lastCell = newSelectedCells[newSelectedCells.length - 1];
      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          // Skip if already a road
          if (newGrid[r][c].isRoad) continue;
          
          // Check if adjacent to last selected cell
          if (isAdjacent(r, c, lastCell.row, lastCell.col)) {
            newGrid[r][c].isValidNextCell = true;
          }
        }
      }
    }
    
    setGrid(newGrid);
  };

  // Check if two cells are adjacent in a hexagonal grid
  const isAdjacent = (row1: number, col1: number, row2: number, col2: number): boolean => {
    // In a hexagonal grid with offset coordinates, each cell has 6 neighbors
    // The pattern depends on whether the column is even or odd
    
    // Check if it's the same cell
    if (row1 === row2 && col1 === col2) return false;
    
    // Check if column is even or odd for first cell
    const isEvenCol1 = col1 % 2 === 0;
    
    // Define neighbor offsets based on column parity
    // For even columns
    const evenColNeighbors = [
      [-1, 0], // Top
      [-1, 1], // Top Right
      [0, 1],  // Right
      [1, 0],  // Bottom
      [0, -1], // Left
      [-1, -1] // Top Left
    ];
    
    // For odd columns
    const oddColNeighbors = [
      [-1, 0], // Top
      [0, 1],  // Top Right
      [1, 1],  // Bottom Right
      [1, 0],  // Bottom
      [1, -1], // Bottom Left
      [0, -1]  // Left
    ];
    
    // Select appropriate neighbor pattern
    const neighbors = isEvenCol1 ? evenColNeighbors : oddColNeighbors;
    
    // Check if second cell is a neighbor of first cell
    for (const [rowOffset, colOffset] of neighbors) {
      if (row1 + rowOffset === row2 && col1 + colOffset === col2) {
        return true;
      }
    }
    
    return false;
  };

  // 使用useEffect同步businessStarted状态到ref
  useEffect(() => {
    businessStartedRef.current = businessStarted;
    console.log('businessStarted状态已更新到:', businessStarted ? 'true' : 'false');
  }, [businessStarted]);

  // Start business with visitors moving on the road
  const startBusiness = () => {
    if (selectedCells.length < 2) return;
    
    console.log('开始经营函数被调用，设置businessStarted为true');
    
    // Generate random users
    const newUsers: RoadUser[] = [];
    const userCount = Math.floor(Math.random() * 5) + 3; // 3-7 users
    
    for (let i = 0; i < userCount; i++) {
      const isWealthy = Math.random() > 0.7; // 30% chance for wealthy user
      newUsers.push({
        id: `user-${i}`,
        type: isWealthy ? 'wealthy' : 'normal',
        position: Math.random() * selectedCells.length, // Random position on the path
        icon: isWealthy ? '💰' : '👤',
        speed: (Math.random() * 0.3 + 0.1), // 降低速度，允许更多消费机会
        coins: isWealthy ? Math.floor(Math.random() * 30) + 20 : Math.floor(Math.random() * 10) + 1, // Wealthy users have 20-50 coins, normal users 1-10
        consumeCooldown: 5 // 降低消费冷却时间到5秒
      });
    }
    
    console.log(`生成了${userCount}个游客`);
    setUsers(newUsers);
    
    // 直接设置ref的值，确保立即更新
    businessStartedRef.current = true;
    // 同时更新状态，保持UI一致
    setBusinessStarted(true);
    setIsEditing(false);
    
    // 不再需要setTimeout，可以立即启动定时器
    console.log('启动定时器，businessStartedRef.current:', businessStartedRef.current ? 'true' : 'false');
    // Start interval to process building consumption and earnings
    coinUpdateIntervalRef.current = setInterval(() => {
      console.log('定时器触发，businessStartedRef.current:', businessStartedRef.current ? 'true' : 'false');
      // Check for users near buildings and process consumption
      handleBuildingConsumption();
    }, 1000); // Check every second
  };

  // Helper function to check if a building has NPCs nearby
  const getNPCsNearBuilding = (buildingPosition: {row: number, col: number}) => {
    const nearbyNPCs: PlacedItem[] = [];
    
    // Get all NPCs from the grid
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const cell = grid[row][col];
        if (cell.content && cell.content.type === 'npc') {
          // Check if this NPC is adjacent to the building
          if (isAdjacent(row, col, buildingPosition.row, buildingPosition.col)) {
            // Get the full PlacedItem data from the original garden layout
            const npcItem = { 
              ...cell.content as NPC, 
              position: { row, col },
              bonusMultiplier: 0.2, // Default bonus multiplier for all NPCs
              bonusPrice: Math.floor(Math.random() * 5) + 1 // Random bonus price between 1-5
            };
            nearbyNPCs.push(npcItem);
          }
        }
      }
    }
    
    return nearbyNPCs;
  };

  // New function to handle building consumption
  const handleBuildingConsumption = () => {
    console.log('handleBuildingConsumption被调用，businessStartedRef.current状态:', businessStartedRef.current ? 'true' : 'false');
    
    // 使用ref而不是state进行检查
    if (!businessStartedRef.current) {
      console.log('由于businessStartedRef.current为false，退出消费处理');
      return;
    }
    
    const now = Date.now();
    console.log('===== 开始处理建筑消费 =====');
    console.log('当前游客数量:', users.length);
    console.log('道路格子数量:', selectedCells.length);
    
    let totalEarned = 0;
    const newConsumptionEvents: Array<{
      buildingId: string;
      buildingName: string;
      amount: number;
      position: {row: number, col: number};
      timestamp: number;
      isSpecial?: boolean;
    }> = [];
    
    // Process each user
    setUsers(prevUsers => {
      console.log('处理所有游客位置:', prevUsers.map(u => Math.floor(u.position)));
      
      return prevUsers.map(user => {
        // Skip if user is on cooldown
        const userLastConsumeTime = user.lastConsumeTime || 0;
        if (now - userLastConsumeTime < user.consumeCooldown * 1000) {
          console.log(`游客 ${user.id} 在冷却中, 剩余 ${((user.consumeCooldown * 1000) - (now - userLastConsumeTime))/1000}秒`);
          return user;
        }
        
        // Get user's current position on the path
        const userPosition = Math.floor(user.position);
        if (userPosition >= selectedCells.length) {
          console.log(`游客 ${user.id} 位置超出范围:`, userPosition);
          return user;
        }
        
        const userCell = selectedCells[userPosition];
        console.log(`游客 ${user.id} 在位置: [${userCell.row},${userCell.col}]`);
        
        // 检查用户所在的路径格子周围是否有建筑
        let foundBuilding = false;
        let consumptionAmount = 0;
        console.log(`检查用户周围的建筑...`);
        
        // 记录相邻的建筑数量，便于调试
        let adjacentBuildingCount = 0;
        
        for (let row = 0; row < GRID_ROWS; row++) {
          for (let col = 0; col < GRID_COLS; col++) {
            const cell = grid[row][col];
            
            // 只检查含有建筑的格子
            if (cell.content && cell.content.type === 'building') {
              // 检查此建筑格子是否与用户所在的路径格子相邻
              if (isAdjacent(userCell.row, userCell.col, row, col)) {
                adjacentBuildingCount++;
                console.log(`找到相邻建筑: ${cell.content.name} [${row},${col}]`);
                
                // Skip if user already consumed this building recently
                if (user.lastConsumedBuilding === cell.content.id) {
                  console.log(`用户已经消费过此建筑，跳过`);
                  continue;
                }
                
                // 有一定概率进行消费（70%的概率）
                const consumeChance = Math.random();
                const willConsume = consumeChance > 0.3;
                console.log(`消费概率检查: ${consumeChance.toFixed(2)}, 是否消费: ${willConsume}`);
                
                if (willConsume) {
                  foundBuilding = true;
                  
                  // Calculate consumption amount based on building type and user type
                  const building = cell.content as Building;
                  const baseConsumption = building.baseConsumption || 5; // Default to 5 if not set
                  const basePrice = building.basePrice || 10; // Default to 10 if not set
                  
                  // Check for nearby NPCs that can boost the building's consumption/price
                  const nearbyNPCs = getNPCsNearBuilding({ row, col });
                  console.log(`NPC加成: 找到 ${nearbyNPCs.length} 个相邻NPC`);
                  
                  // Calculate bonus multiplier from all nearby NPCs
                  const bonusMultiplier = nearbyNPCs.reduce((total, npc) => 
                    total + (npc.bonusMultiplier || 0), 1); // Start with 1 (100%)
                  
                  // Calculate bonus price from all nearby NPCs
                  const bonusPrice = nearbyNPCs.reduce((total, npc) => 
                    total + (npc.bonusPrice || 0), 0);
                  
                  // Special event - wealthy users might make large purchases (10% chance)
                  const isSpecialPurchase = user.type === 'wealthy' && Math.random() > 0.9;
                  const specialMultiplier = isSpecialPurchase ? Math.floor(Math.random() * 3) + 2 : 1; // 2-4x multiplier
                  
                  // Final consumption calculation, influenced by user type and special events
                  consumptionAmount = Math.floor((baseConsumption * bonusMultiplier + bonusPrice) * 
                    (user.type === 'wealthy' ? 2 : 1) * specialMultiplier); // Wealthy users pay double
                  
                  console.log(`消费计算: 基础${baseConsumption}*加成${bonusMultiplier.toFixed(2)}+额外${bonusPrice} * ${user.type === 'wealthy' ? '2(富裕)' : '1(普通)'} * ${isSpecialPurchase ? `${specialMultiplier}(特殊)` : '1'} = ${consumptionAmount}`);
                  
                  // Update user data
                  totalEarned += consumptionAmount;
                  
                  // Add consumption event
                  newConsumptionEvents.push({
                    buildingId: building.id,
                    buildingName: building.name,
                    amount: consumptionAmount,
                    position: { row, col },
                    timestamp: now,
                    isSpecial: isSpecialPurchase
                  });
                  
                  // Add visual feedback for this building
                  setActiveConsumptions(prev => ({
                    ...prev,
                    [`${row}-${col}`]: {
                      amount: consumptionAmount,
                      timestamp: now,
                      isSpecial: isSpecialPurchase
                    }
                  }));
                  
                  console.log(`消费成功! 用户 ${user.id} 在 ${building.name} 消费了 ${consumptionAmount} 金币`);
                  
                  // Return updated user object
                  return {
                    ...user,
                    lastConsumedBuilding: cell.content.id,
                    lastConsumeTime: now,
                    // Wealthy users might leave with some coins, normal users spend all
                    coins: user.type === 'wealthy' ? Math.max(0, user.coins - consumptionAmount/2) : 0
                  };
                }
              }
            }
          }
        }
        
        if (adjacentBuildingCount === 0) {
          console.log(`用户 ${user.id} 周围没有找到建筑`);
        } else if (!foundBuilding) {
          console.log(`用户 ${user.id} 周围有 ${adjacentBuildingCount} 个建筑，但未触发消费`);
        }
        
        return user;
      });
    });
    
    // Update total coins
    if (totalEarned > 0) {
      console.log(`本次总收入: ${totalEarned} 金币，${newConsumptionEvents.length} 次消费`);
      setTotalCoins(prev => prev + totalEarned);
      
      // Update consumption events
      setConsumptionEvents(prev => {
        // Add new events
        const combined = [...prev, ...newConsumptionEvents];
        // Keep only the latest 10 events
        return combined.slice(-10);
      });
    } else {
      // If no building consumption occurred, still add some baseline income
      const baseIncome = Math.floor(Math.random() * users.length) + 1;
      console.log(`无消费发生，添加基础收入: ${baseIncome} 金币`);
      setTotalCoins(prev => prev + baseIncome);
    }
    
    console.log('===== 建筑消费处理结束 =====');
  };

  // Reset business simulation
  const resetBusiness = () => {
    // Cancel any animation frame and interval
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (coinUpdateIntervalRef.current) {
      clearInterval(coinUpdateIntervalRef.current);
      coinUpdateIntervalRef.current = null;
    }
    
    // Reset state but keep the garden content
    const currentGrid = [...grid];
    const newGrid = currentGrid.map(row => 
      row.map(cell => ({
        ...cell,
        isRoad: false,
        isStartPoint: false,
        isEndPoint: false,
        isValidNextCell: false
      }))
    );
    
    setGrid(newGrid);
    setSelectedCells([]);
    setStartPoint(null);
    setEndPoint(null);
    
    // 同时更新状态和ref
    businessStartedRef.current = false;
    setBusinessStarted(false);
    
    setUsers([]);
    setIsEditing(true);
    lastUpdateTimeRef.current = 0;
    console.log('业务已重置，businessStartedRef.current:', businessStartedRef.current ? 'true' : 'false');
    // Don't reset total coins - they are accumulated
  };

  // Animation loop for user movement
  useEffect(() => {
    if (!businessStarted || selectedCells.length < 2) return;
    
    const animate = (time: number) => {
      if (!lastUpdateTimeRef.current) {
        lastUpdateTimeRef.current = time;
      }
      
      const deltaTime = (time - lastUpdateTimeRef.current) / 1000; // Convert to seconds
      lastUpdateTimeRef.current = time;
      
      // Update all users' positions
      setUsers(prevUsers => 
        prevUsers.map(user => {
          const newPosition = user.position + user.speed * deltaTime;
          
          // If user reached the end, wrap around to the start
          if (newPosition >= selectedCells.length) {
            return { ...user, position: 0 };
          }
          
          return { ...user, position: newPosition };
        })
      );
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    // Cleanup animation frame on unmount
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (coinUpdateIntervalRef.current) {
        clearInterval(coinUpdateIntervalRef.current);
      }
    };
  }, [businessStarted, selectedCells.length]);

  // Helper functions to get economic values for buildings and NPCs
  const getBuildingBaseConsumption = (buildingId: string): number => {
    // Define base consumption values for each building type
    switch (buildingId) {
      case 'building-1': // 茶艺馆
        return 8;
      case 'building-2': // 戏曲舞台
        return 15;
      case 'building-3': // 瓷器工坊
        return 12;
      case 'building-4': // 刺绣坊
        return 10;
      case 'building-5': // 剪纸馆
        return 6;
      default:
        return 5; // Default value
    }
  };

  const getBuildingBasePrice = (buildingId: string): number => {
    // Define base price values for each building type
    switch (buildingId) {
      case 'building-1': // 茶艺馆
        return 12;
      case 'building-2': // 戏曲舞台
        return 20;
      case 'building-3': // 瓷器工坊
        return 18;
      case 'building-4': // 刺绣坊
        return 15;
      case 'building-5': // 剪纸馆
        return 10;
      default:
        return 10; // Default value
    }
  };

  const getNPCBonusMultiplier = (npcId: string): number => {
    // Define bonus multiplier values for each NPC type
    switch (npcId) {
      case 'npc-1': // 剪纸艺人
        return 0.2;
      case 'npc-2': // 瓷器匠人
        return 0.3;
      case 'npc-3': // 戏曲表演者
        return 0.5;
      case 'npc-4': // 刺绣大师
        return 0.25;
      case 'npc-5': // 茶艺师
        return 0.4;
      default:
        return 0.2; // Default value
    }
  };

  const getNPCBonusPrice = (npcId: string): number => {
    // Define bonus price values for each NPC type
    switch (npcId) {
      case 'npc-1': // 剪纸艺人
        return 2;
      case 'npc-2': // 瓷器匠人
        return 4;
      case 'npc-3': // 戏曲表演者
        return 6;
      case 'npc-4': // 刺绣大师
        return 3;
      case 'npc-5': // 茶艺师
        return 5;
      default:
        return 2; // Default value
    }
  };

  // Add useEffect for expiring visual feedback after a delay
  useEffect(() => {
    // Clean up expired consumption animations after 2 seconds
    const animationCleanupInterval = setInterval(() => {
      const now = Date.now();
      setActiveConsumptions(prev => {
        const newActive = { ...prev };
        let hasChanges = false;
        
        Object.entries(newActive).forEach(([key, consumption]) => {
          if (now - consumption.timestamp > 2000) { // Remove after 2 seconds
            delete newActive[key];
            hasChanges = true;
          }
        });
        
        return hasChanges ? newActive : prev;
      });
    }, 500); // Check every 500ms
    
    return () => {
      clearInterval(animationCleanupInterval);
    };
  }, []);

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
        <h1 className="text-3xl font-bold text-white mb-8">家园经营管理</h1>

        {/* Business Stats */}
        <div className="bg-white bg-opacity-10 rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white">经营详情</h2>
              <p className="text-gray-300 text-sm mt-2">
                {isEditing 
                  ? '选择相邻的格子来修建游客参观道路，选择的第一个格子为起点，最后一个格子为终点。'
                  : `经营中，游客流量: ${users.length} 人，已获得金币: ${totalCoins}`}
              </p>
            </div>
            <div>
              {isEditing ? (
                <button
                  onClick={startBusiness}
                  disabled={selectedCells.length < 2}
                  className={`px-4 py-2 rounded-lg text-white ${
                    selectedCells.length < 2 
                      ? 'bg-gray-500 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  开始经营
                </button>
              ) : (
                <button
                  onClick={resetBusiness}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                >
                  重设道路
                </button>
              )}
            </div>
          </div>
          
          {/* Consumption Events Display */}
          {businessStarted && (
            <div className="mt-4">
              <h3 className="text-white font-semibold mb-2">最近消费记录</h3>
              <div className="bg-black bg-opacity-30 rounded-lg p-3 max-h-40 overflow-y-auto">
                {consumptionEvents.length > 0 ? (
                  <ul className="space-y-2">
                    {consumptionEvents.map((event, index) => (
                      <li key={index} className={`text-sm flex justify-between items-center ${event.isSpecial ? 'special-event p-1 rounded-md' : ''}`}>
                        <span className="text-gray-300">
                          游客在 <span className="text-amber-300">{event.buildingName}</span> 
                          {event.isSpecial && <span className="text-pink-500 font-bold ml-1">豪华消费</span>}
                        </span>
                        <span className={`font-bold ${event.isSpecial ? 'text-yellow-300 text-base' : 'text-yellow-400'}`}>
                          {event.amount} 金币
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400 text-sm">暂无消费记录，游客还未在建筑内消费</p>
                )}
              </div>
            </div>
          )}
          
          {/* Building and NPC info */}
          {businessStarted && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-white font-semibold mb-2">建筑收益信息</h3>
                <div className="bg-black bg-opacity-30 rounded-lg p-3">
                  <ul className="text-xs space-y-1">
                    <li className="text-gray-300">茶艺馆: 基础收益 <span className="text-yellow-400">{getBuildingBaseConsumption('building-1')} × {getBuildingBasePrice('building-1')}</span> 金币</li>
                    <li className="text-gray-300">戏曲舞台: 基础收益 <span className="text-yellow-400">{getBuildingBaseConsumption('building-2')} × {getBuildingBasePrice('building-2')}</span> 金币</li>
                    <li className="text-gray-300">瓷器工坊: 基础收益 <span className="text-yellow-400">{getBuildingBaseConsumption('building-3')} × {getBuildingBasePrice('building-3')}</span> 金币</li>
                    <li className="text-gray-300">刺绣坊: 基础收益 <span className="text-yellow-400">{getBuildingBaseConsumption('building-4')} × {getBuildingBasePrice('building-4')}</span> 金币</li>
                    <li className="text-gray-300">剪纸馆: 基础收益 <span className="text-yellow-400">{getBuildingBaseConsumption('building-5')} × {getBuildingBasePrice('building-5')}</span> 金币</li>
                  </ul>
                  <p className="mt-2 text-xs text-amber-300">提示: 当游客路过建筑相邻格子时，有70%的概率进行消费!</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-white font-semibold mb-2">NPC加成信息</h3>
                <div className="bg-black bg-opacity-30 rounded-lg p-3">
                  <ul className="text-xs space-y-1">
                    <li className="text-gray-300">剪纸艺人: 提升收益 <span className="text-green-400">{Math.round(getNPCBonusMultiplier('npc-1') * 100)}%</span> 和 <span className="text-green-400">{getNPCBonusPrice('npc-1')}</span> 金币</li>
                    <li className="text-gray-300">瓷器匠人: 提升收益 <span className="text-green-400">{Math.round(getNPCBonusMultiplier('npc-2') * 100)}%</span> 和 <span className="text-green-400">{getNPCBonusPrice('npc-2')}</span> 金币</li>
                    <li className="text-gray-300">戏曲表演者: 提升收益 <span className="text-green-400">{Math.round(getNPCBonusMultiplier('npc-3') * 100)}%</span> 和 <span className="text-green-400">{getNPCBonusPrice('npc-3')}</span> 金币</li>
                    <li className="text-gray-300">刺绣大师: 提升收益 <span className="text-green-400">{Math.round(getNPCBonusMultiplier('npc-4') * 100)}%</span> 和 <span className="text-green-400">{getNPCBonusPrice('npc-4')}</span> 金币</li>
                    <li className="text-gray-300">茶艺师: 提升收益 <span className="text-green-400">{Math.round(getNPCBonusMultiplier('npc-5') * 100)}%</span> 和 <span className="text-green-400">{getNPCBonusPrice('npc-5')}</span> 金币</li>
                  </ul>
                  <p className="mt-2 text-xs text-amber-300">提示: 将NPC放置在建筑旁边可以大幅提高建筑的收益能力!</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Hexagonal Grid */}
        <div className="bg-white bg-opacity-10 rounded-lg p-6">
          <div className="grid-container-wrapper">
            <div className="grid-container">
              {grid.map((row, rowIndex) => (
                <div key={`row-${rowIndex}`} className="hex-row">
                  {row.map((cell, colIndex) => {
                    // Constants for hexagon dimensions
                    const hexSize = 40; // Size of hexagon (can be thought of as radius)
                    const width = hexSize * 2; // Width of the hexagon
                    const height = Math.sqrt(3) * hexSize; // Height factor for regular hexagon
                    
                    // Calculate position based on hexagonal grid math
                    let x, y;
                    
                    // For even columns: cells align vertically
                    // For odd columns: cells are offset vertically to create interlocking pattern
                    if (colIndex % 2 === 0) {
                      // Even columns
                      x = colIndex * width * 0.75;
                      y = rowIndex * height;
                    } else {
                      // Odd columns - offset vertically to create honeycomb
                      x = colIndex * width * 0.75;
                      y = (rowIndex * height) + (height * 0.5); // Offset by half height
                    }
                    
                    // Find users on this cell
                    const cellUsers = users.filter(user => {
                      const userPosition = Math.floor(user.position);
                      if (userPosition >= selectedCells.length) return false;
                      
                      const userCell = selectedCells[userPosition];
                      return userCell.row === cell.row && userCell.col === cell.col;
                    });
                    
                    return (
                      <div 
                        key={cell.id}
                        className={`hex-cell ${
                          cell.isRoad 
                            ? cell.isStartPoint 
                              ? 'start-point' 
                              : cell.isEndPoint 
                                ? 'end-point' 
                                : 'road-cell' 
                            : cell.isValidNextCell
                              ? 'valid-next-cell'
                              : cell.content
                                ? 'has-content'
                                : 'bg-gray-700'
                        } ${cell.content?.type === 'npc' ? 'npc-cell' : ''}
                        ${activeConsumptions[`${cell.row}-${cell.col}`] ? 'has-consumption' : ''}`}
                        onClick={() => handleCellClick(cell.row, cell.col)}
                        style={{
                          position: 'absolute',
                          left: `${x}px`,
                          top: `${y}px`,
                          width: `${width}px`,
                          height: `${height}px`,
                        }}
                      >
                        {cell.isStartPoint && <div className="point-label">起点</div>}
                        {cell.isEndPoint && <div className="point-label">终点</div>}
                        
                        {cell.content && !cell.isRoad && (
                          <div className="hex-content">
                            <span className="item-icon">{cell.content.icon}</span>
                            <span className="item-name">{cell.content.name}</span>
                          </div>
                        )}
                        
                        {cellUsers.length > 0 && (
                          <div className="users-container">
                            {cellUsers.map(user => (
                              <div 
                                key={user.id} 
                                className={`user-icon ${user.type === 'wealthy' ? 'wealthy-user' : 'normal-user'}`}
                                title={`${user.type === 'wealthy' ? '富裕游客' : '普通游客'} - 携带金币: ${user.coins}`}
                              >
                                {user.icon}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Consumption animation */}
                        {activeConsumptions[`${cell.row}-${cell.col}`] && (
                          <div className="consumption-animation">
                            <div className={`coin-animation ${activeConsumptions[`${cell.row}-${cell.col}`].isSpecial ? 'special-purchase' : ''}`}>
                              +{activeConsumptions[`${cell.row}-${cell.col}`].amount}
                              {activeConsumptions[`${cell.row}-${cell.col}`].isSpecial && 
                                <span className="special-label">豪华消费!</span>
                              }
                            </div>
                          </div>
                        )}
                        
                        <div className="hex-coordinates">
                          {rowIndex},{colIndex}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .grid-container-wrapper {
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          padding: 30px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          overflow: hidden;
        }
        
        .grid-container {
          position: relative;
          width: 100%;
          height: 600px; /* Fixed height to contain all hexagons */
          margin: 0 auto;
        }
        
        .hex-row {
          position: relative;
        }
        
        .hex-cell {
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
          transition: all 0.2s ease;
          cursor: ${isEditing ? 'pointer' : 'default'};
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-sizing: border-box;
        }
        
        .hex-cell:hover {
          ${isEditing ? 'transform: scale(1.05);' : ''}
          ${isEditing ? 'background-color: rgba(74, 222, 128, 0.3) !important;' : ''}
          ${isEditing ? 'z-index: 10;' : ''}
          ${isEditing ? 'border-color: rgba(255, 255, 255, 0.8);' : ''}
        }
        
        .road-cell {
          background-color: #8B4513 !important; /* Brown for road */
          border: 1px solid rgba(255, 255, 255, 0.5);
        }
        
        .start-point {
          background-color: #22C55E !important; /* Green for start */
          border: 2px solid rgba(255, 255, 255, 0.8);
        }
        
        .end-point {
          background-color: #EF4444 !important; /* Red for end */
          border: 2px solid rgba(255, 255, 255, 0.8);
        }
        
        .has-content {
          background-color: rgba(59, 130, 246, 0.5) !important;
          border: 1px solid rgba(255, 255, 255, 0.5);
        }
        
        .npc-cell {
          background-color: rgba(124, 58, 237, 0.5) !important;
        }
        
        .hex-coordinates {
          position: absolute;
          bottom: 5px;
          font-size: 10px;
          color: rgba(255, 255, 255, 0.6);
          font-weight: 300;
          text-shadow: 0 0 2px rgba(0, 0, 0, 0.8);
        }
        
        .point-label {
          position: absolute;
          top: 10px;
          font-size: 12px;
          font-weight: bold;
          color: white;
          text-shadow: 0 0 3px black;
        }
        
        .users-container {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          max-width: 100%;
          padding: 2px;
        }
        
        .user-icon {
          font-size: 16px;
          margin: 2px;
          filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.8));
        }
        
        .wealthy-user {
          transform: scale(1.2);
          z-index: 5;
        }
        
        .valid-next-cell {
          background-color: rgba(74, 222, 128, 0.3) !important; /* Light green for valid next cells */
          border: 1px dashed rgba(255, 255, 255, 0.8);
          animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
          0% { opacity: 0.7; }
          50% { opacity: 1; }
          100% { opacity: 0.7; }
        }
        
        .hex-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          z-index: 2;
        }
        
        .item-icon {
          font-size: 20px;
          margin-bottom: 2px;
        }
        
        .item-name {
          font-size: 10px;
          color: white;
          max-width: 60px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .consumption-animation {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          pointer-events: none;
          z-index: 20;
        }
        
        .coin-animation {
          font-size: 18px;
          font-weight: bold;
          color: gold;
          text-shadow: 0 0 6px black, 0 0 10px rgba(255, 215, 0, 0.7);
          animation: coin-float 2s ease-out;
          position: absolute;
        }
        
        @keyframes coin-float {
          0% {
            transform: translateY(0) scale(0.8);
            opacity: 0;
          }
          10% {
            transform: translateY(-5px) scale(1.2);
            opacity: 1;
          }
          50% {
            transform: translateY(-15px) scale(1.1);
            opacity: 1;
          }
          90% {
            transform: translateY(-25px) scale(1);
            opacity: 0.8;
          }
          100% {
            transform: translateY(-35px) scale(0.8);
            opacity: 0;
          }
        }
        
        .has-consumption {
          animation: pulse-gold 1.5s;
          box-shadow: 0 0 15px 8px rgba(255, 215, 0, 0.7) !important;
          z-index: 15;
          transform: scale(1.1);
          transition: transform 0.3s ease-out;
        }
        
        @keyframes pulse-gold {
          0% {
            box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.7);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 20px 12px rgba(255, 215, 0, 0.8);
            transform: scale(1.15);
          }
          100% {
            box-shadow: 0 0 15px 8px rgba(255, 215, 0, 0.7);
            transform: scale(1.1);
          }
        }
        
        .special-purchase {
          font-size: 22px !important;
          color: #FFD700 !important;
          text-shadow: 0 0 8px black, 0 0 15px rgba(255, 215, 0, 0.9) !important;
          animation: special-coin-float 2.5s ease-out !important;
        }
        
        .special-label {
          display: block;
          font-size: 12px;
          color: #FF4500;
          text-shadow: 0 0 4px black;
          margin-top: -4px;
        }
        
        @keyframes special-coin-float {
          0% {
            transform: translateY(0) scale(0.8);
            opacity: 0;
          }
          10% {
            transform: translateY(-5px) scale(1.5);
            opacity: 1;
          }
          50% {
            transform: translateY(-20px) scale(1.3);
            opacity: 1;
          }
          90% {
            transform: translateY(-35px) scale(1.1);
            opacity: 0.8;
          }
          100% {
            transform: translateY(-45px) scale(0.9);
            opacity: 0;
          }
        }
        
        .special-event {
          background-color: rgba(255, 215, 0, 0.15);
          border-left: 3px solid #FFD700;
          animation: special-event-glow 2s infinite alternate;
        }
        
        @keyframes special-event-glow {
          from {
            box-shadow: 0 0 5px rgba(255, 215, 0, 0.3);
          }
          to {
            box-shadow: 0 0 10px rgba(255, 215, 0, 0.6);
          }
        }
      `}</style>
    </div>
  )
} 