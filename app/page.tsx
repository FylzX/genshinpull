"use client"

import { useState, useEffect, useRef } from "react" 
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { runSimulation, SimulationTargets } from "@/lib/simulator"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const CHAR_LIST = ["茜特菈莉", "洛恩", "桑多涅", "尼可", "希诺宁", "恰斯卡", "玛薇卡", "莉奈娅", "法尔伽", "兹白", "哥伦比娅", "杜林", "奈芙尔", "菲林斯", "菈乌玛", "伊涅芙", "丝柯克", "爱可菲", "瓦蕾莎", "基尼奇", "玛拉妮", "艾梅莉埃", "希格雯", "克洛琳德", "阿蕾奇诺", "千织", "闲云", "娜维娅", "芙宁娜", "莱欧斯利", "那维莱特", "林尼", "白术", "艾尔海森", "流浪者", "纳西妲", "妮露", "赛诺", "提纳里", "夜兰", "神里绫人", "八重神子", "申鹤", "荒泷一斗", "珊瑚宫心海", "雷电将军", "宵宫", "神里绫华", "枫原万叶", "优菈", "胡桃", "魈", "甘雨", "阿贝多", "钟离", "达达利亚", "可莉", "温迪"];
const WEAP_LIST = ["祭星者之望", "灾悔", "6.7双手剑", "尘光七谕", "岩峰巡歌", "星鹭赤羽", "焚曜千阳", "霜结的誓金枝", "狼的武功歌", "朏魄含光", "帷间夜曲", "黎明破晓之史", "黑蚀", "真语秘匣", "纺夜天镜", "血染荒城", "支离轮光", "苍耀", "香韵奏者", "溢彩心念", "寝正月初晴", "冲浪时光", "柔灯挽歌", "赦罪", "白雨心弦", "赤月之形", "有乐御藤切", "鹤鸣余音", "裁断", "静水流涌之辉", "金流监督", "万世流涌大典", "最初的大魔术", "碧落之珑", "苇海信标", "裁叶萃光", "图莱杜拉的回忆", "千夜浮梦", "圣显之钥", "赤沙之杖", "猎人之径", "若水", "波乱月白经津", "神乐之真意", "息灾", "赤角石溃杵", "冬极白星", "薙草之稻光", "不灭月华", "雾切之回光", "飞雷之振弦", "苍古自由之誓", "松籁响起之时", "终末嗟叹之诗", "护摩之杖", "磐岩结绿", "斫峰之刃", "贯虹之槊", "尘世之锁", "无工之剑", "和璞鸢"];

const BACKGROUND_IMAGES = [
  "/backgrounds/bg1.webp",
  "/backgrounds/bg2.webp",
  "/backgrounds/bg3.webp",
];
const BACKGROUND_VIDEOS = [
  "/backgrounds/1.mp4",
  "/backgrounds/2.mp4",
  "/backgrounds/3.mp4",
];

export default function GenshinSimulator() {
  const [bgImage, setBgImage] = useState("");
  const [bgVideo, setBgVideo] = useState("");
  const [showVideo, setShowVideo] = useState(true); 
  const [isVideoSupported, setIsVideoSupported] = useState(true); 
  const videoRef = useRef<HTMLVideoElement>(null);

  const [fates, setFates] = useState(1100);
  const [simCount, setSimCount] = useState(100000);
  const [loading, setLoading] = useState(false);
  
  // 更新 Targets 初始状态，包含垫池子和大保底
  const [targets, setTargets] = useState<SimulationTargets>({ 
    charA: 7, charB: 0, weapA: 1, weapB: 0,
    charPity: 0, weapPity: 0, isCharGuaranteed: false
  });
  const [names, setNames] = useState({ cA: "茜特菈莉", cB: "希诺宁", wA: "祭星者之望", wB: "岩峰巡歌" });
  
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    const randomBg = BACKGROUND_IMAGES[Math.floor(Math.random() * BACKGROUND_IMAGES.length)];
    const randomVid = BACKGROUND_VIDEOS[Math.floor(Math.random() * BACKGROUND_VIDEOS.length)];
    setBgImage(randomBg);
    setBgVideo(randomVid);
  }, []);

  useEffect(() => {
    if (showVideo && videoRef.current && bgVideo) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn("浏览器阻止了视频自动播放，降级为图片背景", error);
          setIsVideoSupported(false);
          setShowVideo(false);
        });
      }
    }
  }, [showVideo, bgVideo]);

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
    
    // 由于加入了垫池子和大保底，理论期望的计算极其复杂且没有太大意义，这里依然保持原来的纯净模型作为参考对比
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
      {/* 动态背景层 */}
      <div className="fixed inset-0 -z-10 bg-zinc-900 overflow-hidden">
        <div 
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-in-out ${
            !showVideo ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ backgroundImage: bgImage ? `url(${bgImage})` : 'none' }}
        />
        {bgVideo && isVideoSupported && (
          <video
            ref={videoRef}
            src={bgVideo}
            autoPlay loop muted playsInline
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
              showVideo ? 'opacity-100' : 'opacity-0'
            }`}
            onError={() => {
              console.warn("视频加载失败，降级为图片背景");
              setIsVideoSupported(false);
              setShowVideo(false);
            }}
          />
        )}
      </div>

      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          
          <div className="text-center mb-8 space-y-2 bg-white/70 dark:bg-black/50 backdrop-blur-sm p-4 rounded-2xl shadow-sm inline-block mx-auto flex flex-col items-center">
            <h1 className="text-3xl font-bold tracking-tight">原神抽卡概率计算器</h1>
            <div className="flex flex-col items-center gap-1">
              <a href="https://github.com/FylzX/genshinpull" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-[#FFB7C5] transition-colors duration-300">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                </svg> Github项目地址
              </a>
              <a href="/readme.html" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-[#FFB7C5] transition-colors duration-300">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> [点我]奶奶准备的使用说明
              </a>
            </div>
          </div>

          <Card className="shadow-lg border-white/50 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md">
            <CardHeader><CardTitle>🎯 设定目标与卡池状态</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              
              {/* --- 顶部：原有的粉球和计算按钮 --- */}
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <Label className="font-bold text-zinc-700 dark:text-zinc-300">💰 已有粉球:</Label>
                  <Input type="number" value={fates} onChange={e => setFates(Number(e.target.value))} className="w-28 bg-white/50 dark:bg-black/50" />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-zinc-600">模拟次数(10万):</Label>
                  <Input type="number" value={simCount} onChange={e => setSimCount(Number(e.target.value))} className="w-32 bg-white/50 dark:bg-black/50" />
                </div>
                <Button onClick={startSim} disabled={loading} className="bg-[#FFB7C5] hover:bg-[#ff9eb2] text-zinc-900 font-bold transition-all shadow-md">
                  {loading ? "计算中..." : "开始计算"}
                </Button>
              </div>

              {/* --- 中部：新增的当前卡池状态（垫池子、大保底） --- */}
              <div className="flex flex-wrap items-center gap-6 p-4 rounded-xl bg-[#fff0f5]/50 dark:bg-[#2a1a20]/50 border border-[#FFB7C5]/30">
                <div className="flex items-center gap-3">
                  <Label className="font-semibold text-zinc-700 dark:text-zinc-300">角色池已垫:</Label>
                  <div className="relative">
                    <Input 
                      type="number" min={0} max={89} 
                      value={targets.charPity} 
                      onChange={e => setTargets({...targets, charPity: Math.min(89, Math.max(0, Number(e.target.value)))})} 
                      className="w-20 bg-white/70 dark:bg-black/70 pr-6 text-center" 
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-400">抽</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Label className="font-semibold text-zinc-700 dark:text-zinc-300">武器池已垫:</Label>
                  <div className="relative">
                    <Input 
                      type="number" min={0} max={79} 
                      value={targets.weapPity} 
                      onChange={e => setTargets({...targets, weapPity: Math.min(79, Math.max(0, Number(e.target.value)))})} 
                      className="w-20 bg-white/70 dark:bg-black/70 pr-6 text-center" 
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-400">抽</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pl-4 border-l border-[#FFB7C5]/40">
                  <input 
                    type="checkbox" 
                    id="char-guaranteed" 
                    checked={targets.isCharGuaranteed}
                    onChange={(e) => setTargets({...targets, isCharGuaranteed: e.target.checked})}
                    className="w-5 h-5 accent-[#FFB7C5] cursor-pointer rounded-sm border-zinc-300"
                  />
                  <Label htmlFor="char-guaranteed" className="cursor-pointer font-bold text-[#FFB7C5] select-none">
                    下一个角色必定UP (大保底)
                  </Label>
                </div>
              </div>

              {/* --- 底部：原有的目标设定 --- */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 border-t border-zinc-200/50 pt-5">
                {[
                  { label: "角色A", key: "cA", targetKey: "charA", list: CHAR_LIST, max: 7 },
                  { label: "角色B", key: "cB", targetKey: "charB", list: CHAR_LIST, max: 7 },
                  { label: "武器A", key: "wA", targetKey: "weapA", list: WEAP_LIST, max: 5 },
                  { label: "武器B", key: "wB", targetKey: "weapB", list: WEAP_LIST, max: 5 },
                ].map((item) => (
                  <div key={item.key} className="flex flex-col gap-2">
                    <Label className="text-zinc-500">{item.label} 目标</Label>
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
                    <span>📊 抽卡消耗分布图</span>
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
                  <CardHeader><CardTitle>📝 期望报告</CardTitle></CardHeader>
                  <CardContent className="bg-zinc-100/50 dark:bg-zinc-900/50 rounded-lg p-6 font-mono text-sm space-y-3 leading-relaxed border border-zinc-200/50">
                    <p>模拟平均总消耗: <span className="text-[#FFB7C5] font-bold text-base">{report.avgPulls.toFixed(1)} 抽</span></p>
                    <p>白板理论总期望: {report.theoryAvg.toFixed(1)} 抽 <span className="text-xs text-zinc-500">(0垫0保底对比参考)</span></p>
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

          <div className="h-[100vh] w-full bg-transparent pointer-events-none" />

        </div>
      </div>

      {isVideoSupported && bgVideo && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-700">
          <Button
            onClick={() => setShowVideo(!showVideo)}
            variant="outline"
            className="bg-white/40 hover:bg-white/60 dark:bg-black/40 dark:hover:bg-black/60 backdrop-blur-md border border-white/30 text-zinc-800 dark:text-zinc-200 shadow-xl rounded-full px-5 py-6 transition-all duration-300"
          >
            {showVideo ? (
              <span className="flex items-center gap-2 font-bold">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                切换为照片
              </span>
            ) : (
              <span className="flex items-center gap-2 font-bold">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                切换为动态
              </span>
            )}
          </Button>
        </div>
      )}
    </>
  )
}