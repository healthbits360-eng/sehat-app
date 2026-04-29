export interface LearnArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  topic: string;
}

const SOURCE_URL = "https://www.healthbits360.com/";

const ARTICLES: LearnArticle[] = [
  {
    id: "back-pain-tips",
    title: "Back Pain Recovery Tips",
    description: "Simple daily habits and stretches that ease lower back pain and protect your spine.",
    url: SOURCE_URL,
    topic: "Back Pain",
  },
  {
    id: "knee-rehab",
    title: "After Knee Surgery: What Helps",
    description: "A clear week-by-week guide to safely rebuild knee strength after surgery.",
    url: SOURCE_URL,
    topic: "Post-Surgery",
  },
  {
    id: "shoulder-mobility",
    title: "Restore Shoulder Mobility",
    description: "Gentle movements to recover range of motion without aggravating the joint.",
    url: SOURCE_URL,
    topic: "Shoulder",
  },
  {
    id: "neck-relief",
    title: "Neck Pain at the Desk",
    description: "Posture fixes and micro-breaks that calm tight neck and trapezius muscles.",
    url: SOURCE_URL,
    topic: "Neck",
  },
  {
    id: "sleep-recovery",
    title: "Sleep Is Recovery",
    description: "How quality sleep accelerates tissue repair — and small ways to improve it.",
    url: SOURCE_URL,
    topic: "Lifestyle",
  },
  {
    id: "nutrition-healing",
    title: "Eat to Heal",
    description: "Anti-inflammatory foods that support recovery from injury and surgery.",
    url: SOURCE_URL,
    topic: "Nutrition",
  },
];

export function getArticles(): LearnArticle[] {
  return ARTICLES;
}
