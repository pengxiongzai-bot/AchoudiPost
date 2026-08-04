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
    flow: ["确认商品与卖点", "拆主图和场景图结构", "生成首套视觉方向", "沉淀可复用模板"]
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
    flow: ["梳理当前卡点", "确认可自动化环节", "搭建专属 Skill", "实测并优化"]
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
    flow: ["确定商品卖点", "写脚本和分镜", "生成画面素材", "整理成视频流程"]
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
    flow: ["列出重复动作", "拆分流程节点", "接入工具或模板", "建立复盘机制"]
  }
];

export const featuredSkillModules = skillModules.slice(0, 4);

export function findSkillModule(slug: string) {
  return skillModules.find((module) => module.slug === slug);
}
