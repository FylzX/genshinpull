## 使用方法

打开 https://genshinpull.pages.dev

点击 ${\color{#2edaff}\text{奥黛塔准备的使用说明}}$ 或者 ${\color{#ff69b4}\text{奶奶给你准备的使用说明}}$

如果你觉得好用，不妨点个star鼓励下, 非常感谢～(∠・ω< )⌒★

## 主题开关

在 `app/themes.json` 中控制可用主题（`true` 启用，`false` 关闭）：

```json
{
  "citlali": true,
  "odette": true
}
```

至少启用一个主题；全部关闭会报错并阻止构建。页面默认使用注册顺序中的第一个启用主题，只在启用主题之间循环切换。仅启用一个主题时，“切换主题”按钮置灰且不可点击。

新增主题时，在 JSON 中添加开关，并在 `app/components/theme-registry.ts` 注册对应界面组件，补齐背景配置、资源和主题样式。主题类型由 JSON 的键自动推导，切换逻辑支持任意数量的主题。

配置会打包进静态站点，修改后需重新构建、部署才会在已发布的网站上生效。

## 概率准确度

计算器采用蒙特卡洛模拟(默认 10 万次), 抽卡概率参照表来自[BV13XBiYZErT](https://www.bilibili.com/video/BV13XBiYZErT/), 不计星辉返还

| 抽取目标 | 参照表 50% 抽数 | 计算器 50% 抽数 | 偏差 |
|---|---|---|---|
| 0 命 0 精 | 79 | 80 | +1 |
| 2 命 0 精 | 272 | 275 | +3 |
| 6 命 0 精 | 637 | 639 | +2 |
| 0 命 1 精 | 176 | 179 | +3 |
| 2 命 1 精 | 361 | 363 | +2 |
| 6 命 1 精 | 723 | 725 | +2 |
| 6 命 5 精 | 1069 | 1072 | +3 |

7 组测试的 50% 分位抽数偏差均在 1-3 抽以内(相对偏差 ≤1.7%)，在参照抽数处计算器给出的成功率为 48.33%～49.74% 
差不多挺准了, 如需更稳妥的估算，可在计算器结果基础上再预留 1～3 抽


## Star History

<a href="https://www.star-history.com/?repos=fylzx%2Fgenshinpull&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=fylzx/genshinpull&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=fylzx/genshinpull&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=fylzx/genshinpull&type=date&legend=top-left" />
 </picture>
</a>
