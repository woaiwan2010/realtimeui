import { ReactNode, useState } from 'react';
import { 
  Undo, Redo, Save, FolderOpen, Settings, HelpCircle, 
  Move, Rotate3d, ZoomIn, Eye, Grid3x3, 
  Play, FileText, Layers, Box, Cpu, Activity, Database,
  ChevronDown, Plus, Search,
  Maximize2, X, Check, FileSpreadsheet,
  Wrench, Scissors, Copy, MonitorPlay
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
type PageType = 'model' | 'simulation' | 'automation';
type SimulationMode = 'instant' | 'detailed';
type Tab = { id: string; name: string; type: string };

// Mock Data
const SCENARIOS = [
  { id: 1, name: '结构AB板刚强度分析', status: 'ready' },
  { id: 2, name: '结构撑头排布优化分析', status: 'processing' },
  { id: 3, name: '注塑镶件强度及疲劳分析', status: 'completed' },
  { id: 4, name: '双色转后模马达扭矩计算', status: 'ready' },
  { id: 5, name: '开合模导向机构变形分析', status: 'ready' },
];

const TREE_DATA = [
  {
    id: 'model', name: '几何模型 (Geometry)', type: 'folder', children: [
      { id: 'part1', name: '机壳 (Housing)', type: 'part' },
      { id: 'part2', name: '支架 (Bracket)', type: 'part' },
      { id: 'part3', name: '螺栓 (Bolts)', type: 'part_group' },
    ]
  },
  {
    id: 'materials', name: '材料 (Materials)', type: 'folder', children: [
      { id: 'mat1', name: '结构钢 (Structural Steel)', type: 'material' },
      { id: 'mat2', name: '铝合金 (Aluminum Alloy)', type: 'material' },
    ]
  },
  {
    id: 'connections', name: '连接 (Connections)', type: 'folder', children: [
      { id: 'cont1', name: '接触 (Contacts)', type: 'contact' },
      { id: 'joint1', name: '关节 (Joints)', type: 'joint' },
    ]
  },
  {
    id: 'mesh', name: '网格 (Mesh)', type: 'folder', visibleIn: 'detailed', children: [
      { id: 'mesh_settings', name: '全局设置', type: 'setting' },
      { id: 'mesh_stats', name: '统计信息', type: 'info' },
    ]
  },
  {
    id: 'physics', name: '物理场 (Physics)', type: 'folder', children: [
      { id: 'load1', name: '力载荷 (Force)', type: 'load' },
      { id: 'bc1', name: '固定约束 (Fixed Support)', type: 'constraint' },
      { id: 'temp1', name: '温度 (Temperature)', type: 'load' },
    ]
  },
  {
    id: 'solution', name: '求解 (Solution)', type: 'folder', children: [
      { id: 'sol_set', name: '求解设置', type: 'setting' },
    ]
  },
  {
    id: 'results', name: '结果 (Results)', type: 'folder', children: [
      { id: 'res1', name: '总变形 (Total Deformation)', type: 'result' },
      { id: 'res2', name: '等效应力 (Equivalent Stress)', type: 'result' },
    ]
  },
];

// Components

const ViewCube = () => (
  <div className="relative w-24 h-24 bg-white/10 rounded-lg border border-white/20 shadow-lg flex items-center justify-center transform hover:scale-105 transition-transform cursor-pointer">
    <div className="text-xs font-bold text-white/80">TOP</div>
    <div className="absolute bottom-1 text-[10px] text-white/50">FRONT</div>
    <div className="absolute right-1 text-[10px] text-white/50 rotate-90">RIGHT</div>
    {/* Decorative cube lines */}
    <div className="absolute inset-2 border border-white/10 opacity-50"></div>
    <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-blue-500/50 rotate-45 transform"></div>
    </div>
  </div>
);

const RibbonButton = ({ icon: Icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex flex-col items-center justify-center px-3 py-2 h-20 min-w-[70px] rounded-md transition-colors gap-1",
      active ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100 text-gray-700"
    )}
  >
    <Icon className="w-6 h-6" />
    <span className="text-xs font-medium text-center leading-tight">{label}</span>
  </button>
);

const RibbonGroup = ({ title, children }: { title: string, children: ReactNode }) => (
  <div className="flex flex-col h-full px-2 border-r border-gray-200 last:border-r-0">
    <div className="flex flex-row gap-1 flex-1 items-center">
      {children}
    </div>
    <div className="text-[10px] text-gray-400 text-center uppercase tracking-wider py-0.5 bg-gray-50/50 mt-1 rounded">
      {title}
    </div>
  </div>
);

export default function App() {
  const [activePage, setActivePage] = useState<PageType>('simulation');
  const [simMode, setSimMode] = useState<SimulationMode>('instant');
  const [activeTabs, setActiveTabs] = useState<Tab[]>([
    { id: '1', name: '机壳分析_v1.prt', type: 'model' },
    { id: '2', name: '支架优化_v2.step', type: 'model' }
  ]);
  const [currentTab, setCurrentTab] = useState('1');
  const [showGridSettings, setShowGridSettings] = useState(false);

  // Toggle Simulation Mode
  const toggleSimMode = () => {
    setSimMode(prev => prev === 'instant' ? 'detailed' : 'instant');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
      {/* 1. Top Title Bar */}
      <header className="h-10 bg-[#1e293b] flex items-center justify-between px-4 text-white select-none">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center font-bold text-sm">I</div>
          <span className="font-semibold tracking-wide text-sm">INTESIM 高易用结构仿真软件</span>
        </div>
        
        {/* Page Switcher */}
        <div className="flex bg-black/20 rounded-lg p-1 gap-1">
          {[
            { id: 'model', label: '模型处理' },
            { id: 'simulation', label: '仿真分析' },
            { id: 'automation', label: '自动化仿真' }
          ].map(page => (
            <button
              key={page.id}
              onClick={() => setActivePage(page.id as PageType)}
              className={cn(
                "px-4 py-1 text-xs rounded-md transition-all",
                activePage === page.id 
                  ? "bg-blue-600 text-white shadow-sm font-medium" 
                  : "text-gray-300 hover:text-white hover:bg-white/10"
              )}
            >
              {page.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2 text-gray-400">
            <span>单位: mm, kg, N, s, °C</span>
            <ChevronDown className="w-3 h-3" />
          </div>
          <div className="h-4 w-px bg-white/20"></div>
          <button className="hover:text-blue-400"><Settings className="w-4 h-4" /></button>
          <button className="hover:text-blue-400"><HelpCircle className="w-4 h-4" /></button>
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-[10px]">User</div>
        </div>
      </header>

      {/* 2. Ribbon Toolbar */}
      <div className="h-28 bg-white border-b border-gray-200 flex items-center px-2 shadow-sm overflow-x-auto">
        {activePage === 'model' && (
          <>
            <RibbonGroup title="文件">
              <RibbonButton icon={FolderOpen} label="打开" />
              <RibbonButton icon={Save} label="保存" />
              <RibbonButton icon={FileSpreadsheet} label="BOM导入" />
            </RibbonGroup>
            <RibbonGroup title="几何操作">
              <RibbonButton icon={Box} label="几何清理" />
              <RibbonButton icon={Wrench} label="几何修复" />
              <RibbonButton icon={Scissors} label="布尔运算" />
              <RibbonButton icon={Layers} label="图层管理" />
            </RibbonGroup>
            <RibbonGroup title="视图">
              <RibbonButton icon={Eye} label="显示/隐藏" />
              <RibbonButton icon={Grid3x3} label="背景网格" />
            </RibbonGroup>
          </>
        )}

        {activePage === 'simulation' && (
          <>
            <RibbonGroup title="模式选择">
              <div className="flex flex-col items-center justify-center px-2 gap-2">
                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                  <button 
                    onClick={() => setSimMode('instant')}
                    className={cn(
                      "px-3 py-1.5 text-xs rounded-md transition-all flex items-center gap-1",
                      simMode === 'instant' ? "bg-green-600 text-white shadow" : "text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    <MonitorPlay className="w-3 h-3" /> 即时仿真 (无网格)
                  </button>
                  <button 
                    onClick={() => setSimMode('detailed')}
                    className={cn(
                      "px-3 py-1.5 text-xs rounded-md transition-all flex items-center gap-1",
                      simMode === 'detailed' ? "bg-blue-600 text-white shadow" : "text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    <Grid3x3 className="w-3 h-3" /> 精细仿真 (需网格)
                  </button>
                </div>
                <span className="text-[10px] text-gray-500">当前: {simMode === 'instant' ? '八叉树自适应 (无需划分)' : '有限元网格 (需划分)'}</span>
              </div>
            </RibbonGroup>

            <RibbonGroup title="通用">
              <RibbonButton icon={Undo} label="撤销" />
              <RibbonButton icon={Redo} label="重做" />
              <RibbonButton icon={Copy} label="方案复制" />
            </RibbonGroup>

            {simMode === 'detailed' && (
              <RibbonGroup title="网格">
                <RibbonButton icon={Grid3x3} label="网格划分" />
                <RibbonButton icon={Settings} label="全局设置" />
                <RibbonButton icon={Search} label="质量检查" />
              </RibbonGroup>
            )}

            <RibbonGroup title="物理场">
              <RibbonButton icon={Activity} label="材料" />
              <RibbonButton icon={Box} label="边界条件" />
              <RibbonButton icon={Move} label="载荷" />
              <RibbonButton icon={Layers} label="接触" />
            </RibbonGroup>

            <RibbonGroup title="求解">
              <RibbonButton icon={Play} label="提交计算" />
              <RibbonButton icon={Settings} label="求解设置" />
            </RibbonGroup>

            <RibbonGroup title="后处理">
              <RibbonButton icon={FileText} label="生成报告" />
              <RibbonButton icon={Search} label="探针" />
              <RibbonButton icon={Eye} label="云图设置" />
            </RibbonGroup>
          </>
        )}

        {activePage === 'automation' && (
          <>
            <RibbonGroup title="自动化流程">
              <RibbonButton icon={Play} label="运行场景" />
              <RibbonButton icon={Settings} label="场景配置" />
              <RibbonButton icon={Database} label="AI识别" />
            </RibbonGroup>
            <RibbonGroup title="数据">
              <RibbonButton icon={FileSpreadsheet} label="BOM管理" />
              <RibbonButton icon={FileText} label="批量报告" />
            </RibbonGroup>
          </>
        )}
      </div>

      {/* 3. Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar: Tree */}
        <div className="w-72 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-2 bg-gray-50 border-b border-gray-200 font-medium text-sm flex justify-between items-center">
            <span>模型树</span>
            <div className="flex gap-1">
               <button className="p-1 hover:bg-gray-200 rounded"><Maximize2 className="w-3 h-3" /></button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {TREE_DATA.map((node) => {
              if (node.visibleIn && node.visibleIn !== simMode) return null;
              return (
                <div key={node.id} className="mb-1">
                  <div className="flex items-center gap-1 py-1 px-2 hover:bg-blue-50 rounded cursor-pointer text-sm font-medium text-gray-700">
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                    {node.id === 'model' && <Box className="w-4 h-4 text-orange-500" />}
                    {node.id === 'materials' && <Database className="w-4 h-4 text-purple-500" />}
                    {node.id === 'connections' && <Layers className="w-4 h-4 text-green-500" />}
                    {node.id === 'mesh' && <Grid3x3 className="w-4 h-4 text-blue-500" />}
                    {node.id === 'physics' && <Activity className="w-4 h-4 text-red-500" />}
                    {node.id === 'solution' && <Cpu className="w-4 h-4 text-gray-600" />}
                    {node.id === 'results' && <FileText className="w-4 h-4 text-yellow-600" />}
                    <span>{node.name}</span>
                  </div>
                  <div className="pl-6 border-l border-gray-200 ml-3">
                    {node.children?.map(child => (
                      <div key={child.id} className="flex items-center gap-2 py-1 px-2 hover:bg-blue-50 rounded cursor-pointer text-xs text-gray-600">
                        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                        {child.name}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center: Canvas / Workspace */}
        <div className="flex-1 flex flex-col bg-gray-100 relative">
          {/* Tabs */}
          <div className="h-9 bg-gray-200 flex items-end px-2 gap-1 border-b border-gray-300">
            {activeTabs.map(tab => (
              <div 
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={cn(
                  "px-4 py-1.5 rounded-t-md text-xs flex items-center gap-2 cursor-pointer select-none max-w-[200px]",
                  currentTab === tab.id 
                    ? "bg-white text-blue-700 font-medium shadow-sm" 
                    : "bg-gray-300 text-gray-600 hover:bg-gray-200"
                )}
              >
                <span className="truncate">{tab.name}</span>
                <button className="hover:bg-gray-400/20 rounded-full p-0.5"><X className="w-3 h-3" /></button>
              </div>
            ))}
            <button className="p-1.5 mb-1 hover:bg-gray-300 rounded"><Plus className="w-4 h-4 text-gray-500" /></button>
          </div>

          {/* 3D Viewport Placeholder */}
          <div className="flex-1 relative bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
            {/* Grid Lines (Fake) */}
            <div className="absolute inset-0" style={{ 
              backgroundImage: 'linear-gradient(#00000005 1px, transparent 1px), linear-gradient(90deg, #00000005 1px, transparent 1px)', 
              backgroundSize: '40px 40px' 
            }}></div>

            {/* Content based on Page */}
            {activePage === 'automation' ? (
              <div className="absolute inset-0 bg-white p-8 overflow-y-auto">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <MonitorPlay className="w-6 h-6 text-blue-600" />
                  自动化仿真场景库
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {SCENARIOS.map(scenario => (
                    <div key={scenario.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow bg-white group cursor-pointer">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <Activity className="w-6 h-6" />
                        </div>
                        <span className={cn(
                          "px-2 py-1 rounded text-[10px] font-medium uppercase",
                          scenario.status === 'ready' ? "bg-green-100 text-green-700" :
                          scenario.status === 'processing' ? "bg-blue-100 text-blue-700" :
                          "bg-gray-100 text-gray-600"
                        )}>
                          {scenario.status}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-800 mb-2">{scenario.name}</h3>
                      <p className="text-xs text-gray-500 mb-4">自动识别BOM结构，智能匹配边界条件与载荷，一键输出报告。</p>
                      <button className="w-full py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 text-sm font-medium">
                        启动流程
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Simulation / Model View */
              <>
                {/* 3D Object Placeholder */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                   <div className="w-64 h-64 border-4 border-blue-500/30 bg-blue-500/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <span className="text-blue-800 font-medium">3D 模型渲染区域</span>
                   </div>
                   {/* Axis Indicator */}
                   <div className="absolute -bottom-20 -left-20 w-20 h-20 border-l-2 border-b-2 border-gray-400">
                      <div className="absolute bottom-0 left-full text-xs font-bold text-red-500">X</div>
                      <div className="absolute bottom-full left-0 text-xs font-bold text-green-500">Y</div>
                   </div>
                </div>

                {/* Overlay Controls */}
                <div className="absolute top-4 right-4 flex flex-col gap-4 items-end">
                  <ViewCube />
                  <div className="flex flex-col gap-2 bg-white/90 p-2 rounded-lg shadow-sm border border-gray-200 backdrop-blur">
                    <button className="p-2 hover:bg-gray-100 rounded text-gray-600" title="Fit View"><Maximize2 className="w-4 h-4" /></button>
                    <button className="p-2 hover:bg-gray-100 rounded text-gray-600" title="Zoom In"><ZoomIn className="w-4 h-4" /></button>
                    <button className="p-2 hover:bg-gray-100 rounded text-gray-600" title="Rotate"><Rotate3d className="w-4 h-4" /></button>
                    <button className="p-2 hover:bg-gray-100 rounded text-gray-600" title="Pan"><Move className="w-4 h-4" /></button>
                  </div>
                </div>

                {/* Instant Sim Specific Overlay */}
                {activePage === 'simulation' && simMode === 'instant' && (
                  <div className="absolute top-4 left-4 bg-green-50/90 border border-green-200 p-3 rounded-lg shadow-sm backdrop-blur max-w-xs">
                    <h4 className="text-xs font-bold text-green-800 mb-1 flex items-center gap-1">
                      <MonitorPlay className="w-3 h-3" /> 即时仿真模式
                    </h4>
                    <p className="text-[10px] text-green-700 leading-tight">
                      无需划分网格。系统将使用八叉树自适应算法自动计算。
                      <br/>
                      <span className="opacity-75 mt-1 block">背景网格: 标准 (自动)</span>
                    </p>
                    <button 
                      onClick={() => setShowGridSettings(!showGridSettings)}
                      className="mt-2 text-[10px] text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Grid3x3 className="w-3 h-3" /> 背景网格设置
                    </button>
                    
                    {showGridSettings && (
                      <div className="mt-2 pt-2 border-t border-green-200">
                        <div className="flex items-center justify-between text-[10px] mb-1">
                          <span>网格密度:</span>
                          <select className="bg-white border border-gray-300 rounded px-1">
                            <option>标准</option>
                            <option>精细</option>
                            <option>极细</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          <input type="checkbox" id="showGrid" defaultChecked />
                          <label htmlFor="showGrid">显示背景网格</label>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Sidebar: Properties */}
        <div className="w-64 bg-white border-l border-gray-200 flex flex-col">
          <div className="p-2 bg-gray-50 border-b border-gray-200 font-medium text-sm">
            属性面板
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">名称</label>
                <input type="text" value="机壳_Part1" className="w-full text-sm border border-gray-300 rounded px-2 py-1" readOnly />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">材料</label>
                <div className="flex gap-1">
                  <select className="flex-1 text-sm border border-gray-300 rounded px-2 py-1">
                    <option>结构钢</option>
                    <option>铝合金</option>
                    <option>ABS塑料</option>
                  </select>
                  <button className="p-1 bg-gray-100 border border-gray-300 rounded"><Database className="w-4 h-4 text-gray-500" /></button>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-2">
                <h4 className="text-xs font-bold text-gray-700 mb-2">统计信息</h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <span>体积:</span>
                  <span className="text-right">1240 mm³</span>
                  <span>质量:</span>
                  <span className="text-right">0.45 kg</span>
                  <span>节点数:</span>
                  <span className="text-right">-</span>
                </div>
              </div>

              {simMode === 'instant' && activePage === 'simulation' && (
                <div className="bg-green-50 border border-green-100 rounded p-2 mt-4">
                  <h4 className="text-xs font-bold text-green-800 mb-1">即时仿真状态</h4>
                  <div className="flex items-center gap-2 text-xs text-green-700">
                    <Check className="w-3 h-3" /> 几何检查通过
                  </div>
                  <div className="flex items-center gap-2 text-xs text-green-700">
                    <Check className="w-3 h-3" /> 边界条件完整
                  </div>
                  <button className="w-full mt-2 bg-green-600 text-white text-xs py-1 rounded hover:bg-green-700">
                    立即求解
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Footer Status Bar */}
      <footer className="h-6 bg-[#1e293b] text-gray-400 text-[10px] flex items-center justify-between px-2 select-none">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> 就绪</span>
          <span>选定对象: 1</span>
          <span>内存使用: 1.2 GB / 16 GB</span>
        </div>
        <div className="flex items-center gap-4">
          {simMode === 'instant' && <span className="text-green-400 font-medium">即时仿真模式 (无需网格)</span>}
          {simMode === 'detailed' && <span className="text-blue-400 font-medium">精细仿真模式 (需网格)</span>}
          <span>求解器: INTESIM-Solver v5.0</span>
        </div>
      </footer>
    </div>
  );
}
