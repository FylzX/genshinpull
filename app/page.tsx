"use client"

import { useState, useEffect } from "react" 
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { runSimulation, SimulationTargets } from "@/lib/simulator"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const CHAR_LIST = ["茜特菈莉", "洛恩", "桑多涅", "尼可", "希诺宁", "恰斯卡", "玛薇卡", "莉奈娅", "法尔伽", "兹白", "哥伦比娅", "杜林", "奈芙尔", "菲林斯", "菈乌玛", "伊涅芙", "丝柯克", "爱可菲", "瓦蕾莎", "基尼奇", "玛拉妮", "艾梅莉埃", "希格雯", "克洛琳德", "阿蕾奇诺", "千织", "闲云", "娜维娅", "芙宁娜", "莱欧斯利", "那维莱特", "林尼", "白术", "艾尔海森", "流浪者", "纳西妲", "妮露", "赛诺", "提纳里", "夜兰", "神里绫人", "八重神子", "申鹤", "荒泷一斗", "珊瑚宫心海", "雷电将军", "宵宫", "神里绫华", "枫原万叶", "优菈", "胡桃", "魈", "甘雨", "阿贝多", "钟离", "达达利亚", "可莉", "温迪"];
const WEAP_LIST = ["祭星者之望", "灾悔", "尘光七谕", "岩峰巡歌", "星鹭赤羽", "焚曜千阳", "霜结的誓金枝", "狼的武功歌", "朏魄含光", "帷间夜曲", "黎明破晓之史", "黑蚀", "真语秘匣", "纺夜天镜", "血染荒城", "支离轮光", "苍耀", "香韵奏者", "溢彩心念", "寝正月初晴", "冲浪时光", "柔灯挽歌", "赦罪", "白雨心弦", "赤月之形", "有乐御藤切", "鹤鸣余音", "裁断", "静水流涌之辉", "金流监督", "万世流涌大典", "最初的大魔术", "碧落之珑", "苇海信标", "裁叶萃光", "图莱杜拉的回忆", "千夜浮梦", "圣显之钥", "赤沙之杖", "猎人之径", "若水", "波乱月白经津", "神乐之真意", "息灾", "赤角石溃杵", "冬极白星", "薙草之稻光", "不灭月华", "雾切之回光", "飞雷之振弦", "苍古自由之誓", "松籁响起之时", "终末嗟叹之诗", "护摩之杖", "磐岩结绿", "斫峰之刃", "贯虹之槊", "尘世之锁", "无工之剑", "和璞鸢"];

const BACKGROUND_IMAGES = [
  "/backgrounds/bg1.webp",
  "/backgrounds/bg2.webp",
  "/backgrounds/bg3.webp",
];

export default function GenshinSimulator() {
  const [bgImage, setBgImage] = useState("");
  const [fates, setFates] = useState(1100);
  const [simCount, setSimCount] = useState(100000);
  const [loading, setLoading] = useState(false);
  
  const [targets, setTargets] = useState<SimulationTargets>({ charA: 7, charB: 0, weapA: 1, weapB: 0 });
  const [names, setNames] = useState({ cA: "茜特菈莉", cB: "希诺宁", wA: "祭星者之望", wB: "岩峰巡歌" });
  
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    const randomBg = BACKGROUND_IMAGES[Math.floor(Math.random() * BACKGROUND_IMAGES.length)];
    setBgImage(randomBg);
  }, []);

  const startSim = async () => {
    if (names.cA === names.cB && targets.charB > 0) {
      alert("校验失败: 角色A与角色B不能重复选择");
      return;
    }

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 50)); 
    
    const results = await runSimulation(targets, simCount);
    
    const pulls = results.map(r => r.totalPulls).sort((a, b) => a - b);
    const successCount = pulls.filter(p => p <= fates).length;
    const prob = successCount / Math.max(1, simCount);
    
    const avgPulls = pulls.reduce((a, b) => a + b, 0) / simCount;
    const avgDust = results.reduce((a, b) => a + b.stardust, 0) / simCount;
    const avgBallsBack = avgDust >= 5 ? Math.floor(avgDust / 5) : 0;
    const theoryAvg = (targets.charA + targets.charB) * 93.46 + (targets.weapA + targets.weapB) * 66.5;

    const BINS_COUNT = 40; 
    const minPull = pulls[0];
    const maxPull = pulls[pulls.length - 1];
    const binSize = Math.max(1, Math.ceil((maxPull - minPull + 1) / BINS_COUNT)); 

    const histData = Array.from({length: BINS_COUNT}, (_, i) => {
      const start = minPull + i * binSize;
      return {
        name: `${start}~${start + binSize - 1}抽`,
        范围: `${start}抽 - ${start + binSize - 1}抽`,
        发生次数: 0,
      };
    });

    pulls.forEach(p => {
      const idx = Math.min(Math.floor((p - minPull) / binSize), BINS_COUNT - 1);
      histData[idx].发生次数++;
    });

    const trimmedHistData = histData.filter(d => d.发生次数 > 0 || Math.random() > 0);

    const comboMap: Record<string, number> = {};
    results.forEach(r => {
      const parts = [];
      if (r.inv.cA > 0) parts.push(`cA:${r.inv.cA}`);
      if (r.inv.cB > 0) parts.push(`cB:${r.inv.cB}`);
      if (r.inv.wA > 0) parts.push(`wA:${r.inv.wA}`);
      if (r.inv.wB > 0) parts.push(`wB:${r.inv.wB}`);
      const key = parts.length > 0 ? parts.join('|') : "none";
      comboMap[key] = (comboMap[key] || 0) + 1;
    });

    const topCombos = Object.entries(comboMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);

    setReport({ 
      prob, pulls, avgPulls, avgDust, avgBallsBack, theoryAvg, 
      netCost: avgPulls - avgDust / 5, topCombos, trimmedHistData 
    });
    setLoading(false);
  };

  const isPink = (name: string) => name === "茜特菈莉" || name === "祭星者之望";

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 dark:bg-zinc-900 border shadow-xl p-3 rounded-md">
          <p className="font-bold text-zinc-700 dark:text-zinc-200">{payload[0].payload.范围}</p>
          <p className="text-[#FFB7C5] font-black text-lg">落入人数: {payload[0].value.toLocaleString()} 次</p>
          <p className="text-sm text-zinc-500">占比: {(payload[0].value / simCount * 100).toFixed(2)}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      {/* 核心修复：独立出来的全屏固定背景层，完美兼容手机端浏览器 */}
      <div 
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat transition-all duration-700"
        style={{ backgroundImage: bgImage ? `url(${bgImage})` : 'none' }}
      />

      {/* 内容层：去掉了原来的 bg-fixed 与背景 style 属性 */}
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          
          <div className="text-center mb-8 space-y-2 bg-white/70 dark:bg-black/50 backdrop-blur-sm p-4 rounded-2xl shadow-sm inline-block mx-auto flex flex-col items-center">
            <h1 className="text-3xl font-bold tracking-tight">原神抽卡概率计算器</h1>
            <a 
              href="https://github.com/FylzX/genshinpull" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-[#FFB7C5] transition-colors duration-300"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
              奶奶给旅行者准备的使用教程
            </a>
          </div>

          <Card className="shadow-lg border-white/50 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md">
            <CardHeader><CardTitle>🎯 设定目标</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <Label>已有粉球:</Label>
                  <Input type="number" value={fates} onChange={e => setFates(Number(e.target.value))} className="w-28 bg-white/50 dark:bg-black/50" />
                </div>
                <div className="flex items-center gap-2">
                  <Label>模拟次数(一般10万就够了):</Label>
                  <Input type="number" value={simCount} onChange={e => setSimCount(Number(e.target.value))} className="w-32 bg-white/50 dark:bg-black/50" />
                </div>
                <Button onClick={startSim} disabled={loading} className="bg-[#FFB7C5] hover:bg-[#ff9eb2] text-zinc-900 font-bold transition-all shadow-md">
                  {loading ? "计算中..." : "开始计算"}
                </Button>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 border-t border-zinc-200/50 pt-5">
                {[
                  { label: "角色A", key: "cA", targetKey: "charA", list: CHAR_LIST, max: 7 },
                  { label: "角色B", key: "cB", targetKey: "charB", list: CHAR_LIST, max: 7 },
                  { label: "武器A", key: "wA", targetKey: "weapA", list: WEAP_LIST, max: 5 },
                  { label: "武器B", key: "wB", targetKey: "weapB", list: WEAP_LIST, max: 5 },
                ].map((item) => (
                  <div key={item.key} className="flex flex-col gap-2">
                    <Label>{item.label}</Label>
                    <div className="flex items-center gap-2">
                      <Select value={(names as any)[item.key]} onValueChange={v => setNames({...names,[item.key]: v})}>
                        <SelectTrigger className={`w-[130px] bg-white/50 dark:bg-black/50 ${isPink((names as any)[item.key]) ? 'text-[#FFB7C5] font-bold border-[#FFB7C5]' : ''}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {item.list.map(name => (
                            <SelectItem key={name} value={name} className={isPink(name) ? 'text-[#FFB7C5] font-bold' : ''}>{name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input type="number" min={0} max={item.max} 
                             value={(targets as any)[item.targetKey]} 
                             onChange={e => setTargets({...targets,[item.targetKey]: Number(e.target.value)})} 
                             className="w-16 bg-white/50 dark:bg-black/50" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {report && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
              <div className="text-center py-6 bg-white/70 dark:bg-black/50 backdrop-blur-sm rounded-2xl shadow-sm mx-auto max-w-sm">
                <h2 className={`text-6xl font-black tracking-tighter ${report.prob > 0.5 ? 'text-green-500' : 'text-orange-500'} drop-shadow-md`}>
                  {(report.prob * 100).toFixed(2)}%
                </h2>
                <p className="text-zinc-600 font-bold mt-2">预计成功率</p>
              </div>

              <Card className="shadow-lg border-white/50 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md w-full">
                <CardHeader>
                  <CardTitle className="flex justify-between items-end">
                    <span>📊 抽卡消耗偏态分布图</span>
                    <span className="text-sm font-normal text-zinc-500">
                      最欧: <b className="text-[#FFB7C5]">{report.pulls[0]}抽</b> ｜ 最非: <b className="text-orange-500">{report.pulls[report.pulls.length-1]}抽</b>
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={report.trimmedHistData} margin={{ top: 5, right: 20, left: 0, bottom: 20 }}>
                        <defs>
                          <linearGradient id="citlaliClash" x1="1" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f1aec9" stopOpacity={0.95} />
                            <stop offset="40%" stopColor="#fcccee" stopOpacity={0.95} />
                            <stop offset="100%" stopColor="#92e7ef" stopOpacity={0.95} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" />
                        <XAxis dataKey="name" tick={{fontSize: 12, fill: '#475569'}} angle={-35} textAnchor="end" />
                        <YAxis tick={{fontSize: 12, fill: '#475569'}} />
                        <Tooltip content={<CustomTooltip />} cursor={{fill: '#FFB7C5', opacity: 0.15}} />
                        <Bar dataKey="发生次数" fill="url(#citlaliClash)" radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={1000} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                <Card className="shadow-lg border-white/50 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md">
                  <CardHeader><CardTitle>📈 累积概率分布</CardTitle></CardHeader>
                  <CardContent>
                    <Table className="bg-white/40 rounded-md overflow-hidden">
                      <TableHeader><TableRow><TableHead>消耗抽数</TableHead><TableHead>累积成功率</TableHead></TableRow></TableHeader>
                      <TableBody>
                        <TableRow className="bg-[#fff0f5]/80 font-bold text-[#FFB7C5]">
                          <TableCell>{report.pulls[0]} 抽</TableCell><TableCell>天选之子记录</TableCell>
                        </TableRow>
                        {[0.1, 0.3, 0.5, 0.7, 0.9, 0.99].map(p => (
                          <TableRow key={p}>
                            <TableCell>{report.pulls[Math.max(0, Math.floor(report.pulls.length * p) - 1)]} 抽</TableCell>
                            <TableCell>前 {p * 100}% 水平</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-[#fff0f5]/80 font-bold text-[#FFB7C5]">
                          <TableCell>{report.pulls[report.pulls.length - 1]} 抽</TableCell><TableCell>最非保底记录</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-white/50 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md">
                  <CardHeader><CardTitle>📝 数学期望深度报告</CardTitle></CardHeader>
                  <CardContent className="bg-zinc-100/50 dark:bg-zinc-900/50 rounded-lg p-6 font-mono text-sm space-y-3 leading-relaxed border border-zinc-200/50">
                    <p>模拟平均总消耗: <span className="text-[#FFB7C5] font-bold text-base">{report.avgPulls.toFixed(1)} 抽</span></p>
                    <p>模型理论总期望: {report.theoryAvg.toFixed(1)} 抽</p>
                    <p>每金平均成本: {(report.avgPulls / Math.max(1, (targets.charA+targets.charB+targets.weapA+targets.weapB))).toFixed(1)} 抽</p>
                    <div className="h-px bg-zinc-300 dark:bg-zinc-700 my-4" />
                    <p>平均星辉返还: {report.avgDust.toFixed(1)}</p>
                    <p>平均粉球返还: {report.avgBallsBack} 抽 (约计)</p>
                    <p className="text-lg pt-3">实际净消耗期望: <br/><span className="text-[#FFB7C5] font-bold text-2xl">{report.netCost.toFixed(1)} 抽</span></p>
                    <p className="pt-2 text-zinc-600">
                      目标: {targets.charA > 0 && <span className={isPink(names.cA) ? 'text-[#FFB7C5] font-bold' : ''}>{names.cA} </span>}
                      {targets.charB > 0 && <span className={isPink(names.cB) ? 'text-[#FFB7C5] font-bold' : ''}>{names.cB} </span>}
                      {targets.weapA > 0 && <span className={isPink(names.wA) ? 'text-[#FFB7C5] font-bold' : ''}>{names.wA} </span>}
                      {targets.weapB > 0 && <span className={isPink(names.wB) ? 'text-[#FFB7C5] font-bold' : ''}>{names.wB} </span>}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className="shadow-lg border-white/50 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md mt-6">
                <CardHeader><CardTitle>📦 详细收获组合分布</CardTitle></CardHeader>
                <CardContent className="bg-white/40 dark:bg-zinc-900/40 p-6 rounded-lg font-sans text-base space-y-2 border border-zinc-200/50">
                  {report.topCombos.map(([key, count]: [string, number], idx: number) => {
                    if (key === "none") return <div key={idx}>未获得任何目标物品 | <span className="text-zinc-500">{(count/simCount*100).toFixed(2)}%</span></div>;
                    
                    const parts = key.split('|').map(p => {
                      const[k, v] = p.split(':');
                      const realName = (names as any)[k];
                      return (
                        <span key={k}>
                          <span className={isPink(realName) ? 'text-[#FFB7C5] font-bold' : ''}>{realName}</span>
                          <span>x{v}</span>
                        </span>
                      );
                    });

                    return (
                      <div key={idx} className="flex items-center gap-2">
                        {(parts as React.ReactNode[]).reduce((prev, curr) => [prev, ', ', curr])}
                        <span className="text-zinc-500 ml-2">|  {(count/simCount*100).toFixed(2)}%</span>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </div>
          )}

          {/* --- 欣赏奶奶卡片 --- */}
          <Card className="shadow-lg border-white/50 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md mt-8">
            <CardContent className="p-6 flex flex-col items-center justify-center space-y-3">
              <p className="text-lg font-bold text-zinc-700 dark:text-zinc-200 tracking-wide">
                继续往下滑欣赏奶奶
                多刷新几次, 有惊喜!
              </p>
              <svg 
                className="w-8 h-8 text-[#FFB7C5] animate-bounce" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </CardContent>
          </Card>

          {/* --- 全透明占位区域 --- */}
          {/* 因为背景层现在固定挂在视图视口，内容往上滑动时，底下就会完美露出不拉伸、不变形的背景图啦！ */}
          <div className="h-[100vh] w-full bg-transparent pointer-events-none" />

        </div>
      </div>
    </>
  )
}