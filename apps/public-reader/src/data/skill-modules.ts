export type SkillResourceCard = {
  code: string;
  tag: string;
  title: string;
  description: string;
  action: string;
  image?: string;
};

export type SkillModule = {
  slug: string;
  name: string;
  job: string;
  stat: string;
  description: string;
  href: string;
  image: string;
  eyebrow: string;
  headline: string;
  summary: string;
  highlights: string[];
  deliverables: string[];
  flow: string[];
  resourceCards: SkillResourceCard[];
};

export const skillModules: SkillModule[] = [
  {
    slug: "visual",
    name: "AI 电商视觉Skill",
    job: "商品视觉",
    stat: "视觉系统",
    description: "主图、场景图、卖点图，把商品视觉做成可复用的电商框架。",
    href: "/skills/visual/",
    image:
      "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260625_213624_40d877b4-92a9-44d3-be3c-5d3332db4402.png&w=1280&q=85",
    eyebrow: "商品视觉",
    headline: "把商品主图、场景图、卖点图整理成可复用视觉系统",
    summary: "适合需要持续产出商品视觉的人：从第一张图开始，统一风格、卖点表达和成套展示逻辑。",
    highlights: ["主图方向拆解", "场景图结构", "卖点图模板", "成套视觉规范"],
    deliverables: ["视觉风格参考", "提示词框架", "出图流程", "复用检查清单"],
    flow: ["确认商品与卖点", "拆主图和场景图结构", "生成首套视觉方向", "沉淀可复用模板"],
    resourceCards: [
      {
        code: "VF-01",
        tag: "主图",
        title: "商品主图框架",
        description: "先把人群、痛点、核心利益点压到一张图里，解决第一眼停留。",
        action: "查看框架",
        image: "/images/hero-showcase-red-sneaker.jpg"
      },
      {
        code: "VF-02",
        tag: "场景",
        title: "场景图框架",
        description: "把商品放进真实使用场景，让用户更快判断适不适合自己。",
        action: "查看场景",
        image: "/images/hero-showcase-panda-camera.jpg"
      },
      {
        code: "VF-03",
        tag: "卖点",
        title: "卖点图表达",
        description: "把参数、优势和使用结果转成更容易被理解的视觉语言。",
        action: "查看卖点",
        image: "/images/hero-showcase-snow-chain.jpg"
      },
      {
        code: "VF-04",
        tag: "详情",
        title: "详情页长图结构",
        description: "按浏览顺序安排利益点、信任点和成交点，减少内容断层。",
        action: "查看结构",
        image: "/images/hero-showcase-dining-chair.jpg"
      },
      {
        code: "VF-05",
        tag: "私域",
        title: "私域成交视觉",
        description: "把朋友圈、社群和私聊素材统一成可持续输出的视觉模块。",
        action: "查看私域",
        image: "/images/hero-showcase-plush-bear.jpg"
      },
      {
        code: "VF-06",
        tag: "复盘",
        title: "成套视觉检查清单",
        description: "用一套检查表判断画面是否能承接投放、搜索和转化。",
        action: "查看清单",
        image: "/images/hero-showcase-steel-container.jpg"
      }
    ]
  },
  {
    slug: "custom",
    name: "AI 电商Skill定制",
    job: "定制搭建",
    stat: "按需定制",
    description: "按你的产品、团队和流程，定制一套可以直接落地的电商 Skill。",
    href: "/skills/custom/",
    image:
      "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260625_214012_f14ffda8-1f1c-48bc-893f-1ad05f6bc2d9.png&w=1280&q=85",
    eyebrow: "定制搭建",
    headline: "围绕你的产品、团队和流程，定制一套可直接使用的 Skill",
    summary: "适合已经有明确商品或团队流程的人：把零散经验整理成固定动作，减少每次从零开始。",
    highlights: ["业务流程梳理", "专属提示词", "团队使用规范", "交付路径设计"],
    deliverables: ["定制 Skill 框架", "可复制 SOP", "落地使用说明", "后续迭代方向"],
    flow: ["梳理当前卡点", "确认可自动化环节", "搭建专属 Skill", "实测并优化"],
    resourceCards: [
      {
        code: "CS-01",
        tag: "诊断",
        title: "业务卡点诊断",
        description: "先把产品、团队和执行链路拆清楚，确定真正该定制的位置。",
        action: "查看诊断"
      },
      {
        code: "CS-02",
        tag: "框架",
        title: "专属 Skill 框架",
        description: "围绕固定业务动作搭建可重复调用的结构，而不是一次性提示词。",
        action: "查看框架"
      },
      {
        code: "CS-03",
        tag: "提示词",
        title: "专属提示词库",
        description: "把常用输出拆成清晰模板，团队成员可以直接按场景使用。",
        action: "查看提示词"
      },
      {
        code: "CS-04",
        tag: "交付",
        title: "交付说明",
        description: "把使用入口、使用方式和注意事项整理成可交接说明。",
        action: "查看交付"
      },
      {
        code: "CS-05",
        tag: "团队",
        title: "团队使用规范",
        description: "统一命名、输入材料和输出标准，避免每个人做法不一样。",
        action: "查看规范"
      },
      {
        code: "CS-06",
        tag: "迭代",
        title: "迭代陪跑路径",
        description: "上线后根据真实使用反馈继续修正，让 Skill 越用越顺。",
        action: "查看路径"
      }
    ]
  },
  {
    slug: "video",
    name: "AI 电商视频Skill",
    job: "短视频素材",
    stat: "脚本到镜头",
    description: "从脚本、镜头、转场到成片节奏，先解决电商视频素材效率。",
    href: "/skills/video/",
    image:
      "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260625_213908_9574cadd-4c04-4380-af84-a753e484415a.png&w=1280&q=85",
    eyebrow: "短视频素材",
    headline: "从脚本、镜头到转场节奏，搭建电商视频素材生产框架",
    summary: "适合需要稳定产出短视频素材的人：先把脚本逻辑和镜头结构固定，再提升制作效率。",
    highlights: ["脚本结构", "镜头转场", "产品展示", "素材复用"],
    deliverables: ["脚本模板", "镜头拆解表", "素材提示词", "视频生产流程"],
    flow: ["确定商品卖点", "写脚本和分镜", "生成画面素材", "整理成视频流程"],
    resourceCards: [
      {
        code: "VC-01",
        tag: "脚本",
        title: "短视频脚本骨架",
        description: "把开头钩子、卖点承接、信任补充和行动引导固定下来。",
        action: "查看脚本"
      },
      {
        code: "VC-02",
        tag: "镜头",
        title: "镜头清单",
        description: "把商品展示拆成可拍、可生成、可复用的镜头动作。",
        action: "查看镜头"
      },
      {
        code: "VC-03",
        tag: "转场",
        title: "转场节奏",
        description: "用固定节奏串起使用前后、细节特写和场景变化。",
        action: "查看转场"
      },
      {
        code: "VC-04",
        tag: "口播",
        title: "口播卖点表达",
        description: "把复杂卖点说成人能听懂、平台也容易识别的表达。",
        action: "查看口播"
      },
      {
        code: "VC-05",
        tag: "素材",
        title: "素材复用表",
        description: "让同一批素材可以服务种草、直播切片、短视频和私域。",
        action: "查看素材"
      },
      {
        code: "VC-06",
        tag: "发布",
        title: "发布节奏框架",
        description: "把内容主题、发布时间和复盘指标连成稳定生产流程。",
        action: "查看节奏"
      }
    ]
  },
  {
    slug: "automation",
    name: "AI 电商自动化",
    job: "流程提效",
    stat: "自动流程",
    description: "把选品、素材整理、发布和复盘串起来，减少重复手动操作。",
    href: "/skills/automation/",
    image:
      "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260625_213950_c1686b87-f412-4878-b7fe-96ba5085ba01.png&w=1280&q=85",
    eyebrow: "流程提效",
    headline: "把选品、素材整理、发布和复盘串成可复用自动流程",
    summary: "适合重复动作很多的人：把每天都要做的事变成流程，节省时间，也降低出错。",
    highlights: ["素材归档", "发布流程", "数据复盘", "自动化节点"],
    deliverables: ["流程图", "自动化清单", "工具组合建议", "复盘模板"],
    flow: ["列出重复动作", "拆分流程节点", "接入工具或模板", "建立复盘机制"],
    resourceCards: [
      {
        code: "AU-01",
        tag: "归档",
        title: "素材整理路径",
        description: "把图片、视频、文案和数据按可搜索、可复用的方式归档。",
        action: "查看归档"
      },
      {
        code: "AU-02",
        tag: "批量",
        title: "批量生成动作",
        description: "把重复生成、改写和整理动作拆成可批量执行的步骤。",
        action: "查看动作"
      },
      {
        code: "AU-03",
        tag: "发布",
        title: "发布检查流程",
        description: "用固定检查项减少漏标题、漏素材、漏链接这类低级错误。",
        action: "查看流程"
      },
      {
        code: "AU-04",
        tag: "数据",
        title: "数据复盘框架",
        description: "把曝光、点击、转化和素材表现连接到下一轮优化。",
        action: "查看复盘"
      },
      {
        code: "AU-05",
        tag: "工具",
        title: "工具衔接清单",
        description: "判断哪些工具该接在一起，哪些步骤暂时保持人工更稳。",
        action: "查看清单"
      },
      {
        code: "AU-06",
        tag: "SOP",
        title: "自动化 SOP",
        description: "把每日、每周和节点性动作整理成可交接流程。",
        action: "查看 SOP"
      }
    ]
  }
];

export const featuredSkillModules = skillModules.slice(0, 4);

export function findSkillModule(slug: string) {
  return skillModules.find((module) => module.slug === slug);
}
