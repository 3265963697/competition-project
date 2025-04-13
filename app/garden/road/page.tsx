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

interface PlacedItem extends GameItem {
  position: {
    row: number;
    col: number;
  };
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
  const [users, setUsers] = useState<RoadUser[]>([]);
  const [isEditing, setIsEditing] = useState(true);
  const [totalCoins, setTotalCoins] = useState(0);
  const [gardenLoaded, setGardenLoaded] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const coinUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
          
          // Copy content from garden grid to our grid
          const gridWithContent = newGrid.map((row, rowIndex) => 
            row.map((cell, colIndex) => ({
              ...cell,
              content: parsedGrid[rowIndex]?.[colIndex]?.content || null
            }))
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

  // Start business with visitors moving on the road
  const startBusiness = () => {
    if (selectedCells.length < 2) return;
    
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
        speed: (Math.random() * 0.5 + 0.2), // Random speed between 0.2-0.7 cells per second
        coins: isWealthy ? Math.floor(Math.random() * 30) + 20 : Math.floor(Math.random() * 10) + 1 // Wealthy users have 20-50 coins, normal users 1-10
      });
    }
    
    setUsers(newUsers);
    setBusinessStarted(true);
    setIsEditing(false);
    
    // Start interval to update coins earned
    coinUpdateIntervalRef.current = setInterval(() => {
      const earnedCoins = Math.floor(Math.random() * users.length) + 1;
      setTotalCoins(prev => prev + earnedCoins);
    }, 5000); // Every 5 seconds
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
    setBusinessStarted(false);
    setUsers([]);
    setIsEditing(true);
    lastUpdateTimeRef.current = 0;
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
                        } ${cell.content?.type === 'npc' ? 'npc-cell' : ''}`}
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
      `}</style>
    </div>
  )
} 