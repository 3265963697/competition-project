// Define types for NPC data
export interface NPCData {
  id: string;
  name: string;
  description: string;
  icon: string;
  size: number;
  type: 'npc';
  background: string;
  personality: string;
  interests: string[];
  favoriteResponse: (text: string) => boolean;
  relationship: number; // 0-100 relationship level
  dialogueOptions: DialogueOption[];
  conversationHistory: ConversationEntry[];
}

export interface DialogueOption {
  id: string;
  text: string;
  responseTexts: string[];
  relationshipEffect: number; // How much this affects relationship
}

export interface ConversationEntry {
  id: string;
  speaker: 'user' | 'npc';
  text: string;
  timestamp: number;
}

// NPC data collection
const npcData: Record<string, NPCData> = {
  'npc-1': {
    id: 'npc-1',
    name: '诗人',
    description: '能够创作诗词',
    icon: '👨‍🎓',
    size: 1,
    type: 'npc',
    background: '来自江南的才子，师从名家，致力于复兴传统诗词文化。',
    personality: '温文尔雅，善于观察，喜欢用诗词表达内心感受。',
    interests: ['古典诗词', '山水画', '品茶', '古琴音乐'],
    favoriteResponse: (text) => {
      return text.includes('诗') || text.includes('词') || text.includes('文学');
    },
    relationship: 50,
    dialogueOptions: [
      {
        id: 'poetry-1',
        text: '能否为我吟诵一首诗？',
        responseTexts: [
          '明月几时有，把酒问青天。不知天上宫阙，今夕是何年...',
          '东边日出西边雨，道是无晴却有晴...',
          '床前明月光，疑是地上霜。举头望明月，低头思故乡...'
        ],
        relationshipEffect: 5
      },
      {
        id: 'poetry-2',
        text: '请教我如何写诗',
        responseTexts: [
          '诗贵在意境，先观察周围，感受自然之美，再思考如何用简练的语言表达。',
          '学诗当从古人入手，熟读唐诗宋词，了解格律，再逐渐形成自己的风格。'
        ],
        relationshipEffect: 7
      },
      {
        id: 'poetry-3',
        text: '你觉得当代诗歌如何？',
        responseTexts: [
          '百花齐放是好事，但我更希望看到对传统的尊重与创新的结合。',
          '形式多样，内容丰富，但有些失去了诗的本质，成了散文的断句。'
        ],
        relationshipEffect: 3
      }
    ],
    conversationHistory: []
  },
  'npc-2': {
    id: 'npc-2',
    name: '画家',
    description: '能够绘制山水画',
    icon: '👨‍🎨',
    size: 1,
    type: 'npc',
    background: '自幼师从名家，云游四方，擅长用淡墨表现山水之间的空灵意境。',
    personality: '孤僻内敛，专注于艺术，对自然有独特感悟。',
    interests: ['山水画', '书法', '古琴', '收集奇石'],
    favoriteResponse: (text) => {
      return text.includes('画') || text.includes('山水') || text.includes('艺术');
    },
    relationship: 50,
    dialogueOptions: [
      {
        id: 'art-1',
        text: '如何欣赏山水画？',
        responseTexts: [
          '山水画贵在意境，观画如游山。先看整体构图，再观局部细节，最后体会画家想表达的意境。',
          '山水画讲究"外师造化，中得心源"，观画时应当用心感受自然之美与画家的情感。'
        ],
        relationshipEffect: 6
      },
      {
        id: 'art-2',
        text: '能否指点我学画？',
        responseTexts: [
          '初学应从临摹开始，掌握基本笔法，了解墨分五色，再逐步发展自己的风格。',
          '画山水须先知山水，建议多亲近自然，体会山水的气韵，再下笔作画。'
        ],
        relationshipEffect: 8
      },
      {
        id: 'art-3',
        text: '你最欣赏哪位古代画家？',
        responseTexts: [
          '北宋范宽，其"雄强刚劲"的风格令人叹服，尤其是《雪景寒林图》，将北方山水的雄浑表现得淋漓尽致。',
          '元代黄公望，其《富春山居图》气势磅礴又不失细腻，是山水画的巅峰之作。'
        ],
        relationshipEffect: 4
      }
    ],
    conversationHistory: []
  },
  'npc-3': {
    id: 'npc-3',
    name: '琴师',
    description: '能够演奏古琴',
    icon: '🧙‍♂️',
    size: 1,
    type: 'npc',
    background: '出身琴学世家，精通多种琴谱，致力于古琴艺术的传承与发展。',
    personality: '沉稳内敛，喜静不喜动，追求心灵的宁静与和谐。',
    interests: ['古琴演奏', '诗词', '茶道', '修心养性'],
    favoriteResponse: (text) => {
      return text.includes('琴') || text.includes('音乐') || text.includes('弹奏');
    },
    relationship: 50,
    dialogueOptions: [
      {
        id: 'music-1',
        text: '能否为我演奏一曲？',
        responseTexts: [
          '为您弹奏《高山流水》，此曲表现知音难觅的感慨，请静心聆听...',
          '《阳关三叠》道尽离别之情，且听...',
          '《梅花三弄》描绘傲雪凌霜的梅花，意境高远...'
        ],
        relationshipEffect: 7
      },
      {
        id: 'music-2',
        text: '如何入门学习古琴？',
        responseTexts: [
          '古琴学习首重心态，要有"静、雅、清、远"的追求。技术上，先学习基本指法，再逐步掌握各种复杂技巧。',
          '找一位好老师很重要，古琴不仅是器乐，更蕴含文化精髓，需要言传身教。'
        ],
        relationshipEffect: 5
      },
      {
        id: 'music-3',
        text: '琴棋书画，你最看重哪一项？',
        responseTexts: [
          '自然是琴。古人云："琴者，禁也。禁止邪心也。"琴乐能修身养性，平和心境。',
          '四艺皆通，但琴为首。琴中寓情，通过音乐表达内心世界，是最直接的艺术形式。'
        ],
        relationshipEffect: 3
      }
    ],
    conversationHistory: []
  },
  'npc-4': {
    id: 'npc-4',
    name: '儒者',
    description: '教授儒家经典',
    icon: '👴',
    size: 1,
    type: 'npc',
    background: '毕生致力于儒家经典研究，曾任国子监博士，退隐后专注于传道授业。',
    personality: '严谨持重，尊崇礼制，重视伦理道德。',
    interests: ['儒家经典', '历史研究', '教育', '书法'],
    favoriteResponse: (text) => {
      return text.includes('儒') || text.includes('经典') || text.includes('道德');
    },
    relationship: 50,
    dialogueOptions: [
      {
        id: 'confucian-1',
        text: '儒家思想的核心是什么？',
        responseTexts: [
          '仁义礼智信，其中尤以"仁"为核心。孔子曰："仁者爱人"，强调人与人之间的关爱与和谐。',
          '修身齐家治国平天下，从个人修养出发，推及家庭、国家乃至天下，是儒家的理想追求。'
        ],
        relationshipEffect: 6
      },
      {
        id: 'confucian-2',
        text: '如何理解"中庸之道"？',
        responseTexts: [
          '"中庸"不是平庸，而是指不偏不倚，恰到好处。孔子说："过犹不及"，做人做事要把握分寸。',
          '中庸之道强调和谐平衡，既不走极端，又不失原则，是一种高级的智慧。'
        ],
        relationshipEffect: 7
      },
      {
        id: 'confucian-3',
        text: '儒家思想在当代有何价值？',
        responseTexts: [
          '儒家强调的家庭伦理、社会责任、修身养性等理念，对当今社会仍有重要意义。',
          '儒家思想中的"和而不同"理念，对构建和谐社会、解决文化冲突有重要启示。'
        ],
        relationshipEffect: 8
      }
    ],
    conversationHistory: []
  },
  'npc-5': {
    id: 'npc-5',
    name: '茶艺师',
    description: '精通茶道',
    icon: '👩‍🍳',
    size: 1,
    type: 'npc',
    background: '出身茶叶世家，游历过各大茶区，精通各种茶类的鉴别与冲泡技艺。',
    personality: '温婉细腻，待人热情，对茶文化有深厚感情。',
    interests: ['茶艺', '花艺', '香道', '陶瓷收藏'],
    favoriteResponse: (text) => {
      return text.includes('茶') || text.includes('品茗') || text.includes('文化');
    },
    relationship: 50,
    dialogueOptions: [
      {
        id: 'tea-1',
        text: '能否为我泡一杯茶？',
        responseTexts: [
          '为您泡一杯龙井，产自西湖狮峰山，今年明前茶，清香扑鼻，滋味甘醇...',
          '这是武夷山大红袍，岩骨花香，醇厚回甘，请慢慢品尝...',
          '为您奉上普洱熟茶，陈香浓郁，汤色红浓，口感醇厚...'
        ],
        relationshipEffect: 6
      },
      {
        id: 'tea-2',
        text: '如何鉴别好茶？',
        responseTexts: [
          '好茶主要从外形、香气、滋味、汤色四方面鉴别。以龙井为例，外形扁平光滑，香气清高，滋味鲜爽，汤色嫩绿明亮。',
          '茶叶鉴别需要经验积累。初学者可从品尝知名产区的标准茶样开始，逐步培养自己的品鉴能力。'
        ],
        relationshipEffect: 7
      },
      {
        id: 'tea-3',
        text: '茶道与禅有何关联？',
        responseTexts: [
          '茶禅一味。品茶如参禅，都追求一种宁静致远的心境。茶道讲究"清、和、敬、寂"，与禅宗思想相通。',
          '唐代禅宗大师赵州和尚曾说"吃茶去"，意在破除执著，回归本心，体现了茶与禅的密切关系。'
        ],
        relationshipEffect: 8
      }
    ],
    conversationHistory: []
  }
};

// Helper functions
export const getNPCData = (id: string): NPCData | undefined => {
  return npcData[id];
};

export const getAllNPCs = (): NPCData[] => {
  return Object.values(npcData);
};

export const updateNPCRelationship = (id: string, change: number): boolean => {
  if (npcData[id]) {
    npcData[id].relationship = Math.max(0, Math.min(100, npcData[id].relationship + change));
    return true;
  }
  return false;
};

export const addConversationEntry = (
  npcId: string, 
  entry: Omit<ConversationEntry, 'id' | 'timestamp'>
): boolean => {
  if (npcData[npcId]) {
    const newEntry: ConversationEntry = {
      ...entry,
      id: `conv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: Date.now()
    };
    npcData[npcId].conversationHistory.push(newEntry);
    return true;
  }
  return false;
}; 