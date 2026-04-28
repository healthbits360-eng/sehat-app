export interface ConditionRecord {
  id: string;
  label: string;
  description: string;
}

export const CONDITIONS: ConditionRecord[] = [
  {
    id: "back-pain",
    label: "Lower back pain",
    description:
      "Chronic or acute pain in the lumbar region — often muscular, postural, or disc-related.",
  },
  {
    id: "post-surgery-knee",
    label: "Post-surgery knee recovery",
    description:
      "Rehabilitation following knee surgery such as ACL reconstruction or meniscus repair.",
  },
  {
    id: "post-surgery-hip",
    label: "Post-surgery hip recovery",
    description:
      "Recovery after hip replacement or hip arthroscopy, focused on mobility and strength.",
  },
  {
    id: "shoulder-injury",
    label: "Shoulder injury",
    description:
      "Rotator cuff strains, frozen shoulder, or post-impingement rehabilitation.",
  },
  {
    id: "neck-pain",
    label: "Neck and cervical pain",
    description:
      "Stiffness, headaches, or radiating pain from the cervical spine.",
  },
  {
    id: "sciatica",
    label: "Sciatica",
    description:
      "Nerve pain radiating down the leg from the lower back, often caused by disc compression.",
  },
  {
    id: "ankle-sprain",
    label: "Ankle sprain",
    description:
      "Ligament injury after a twist or rollover — needs progressive load and balance work.",
  },
  {
    id: "tennis-elbow",
    label: "Tennis or golfer's elbow",
    description:
      "Repetitive-strain tendinopathy in the elbow requiring graded loading and rest.",
  },
  {
    id: "post-cardiac",
    label: "Post-cardiac event recovery",
    description:
      "Gentle, supervised cardiovascular rehabilitation following a cardiac event or procedure.",
  },
  {
    id: "post-stroke",
    label: "Post-stroke rehabilitation",
    description:
      "Regaining mobility, balance, and motor control after a stroke.",
  },
  {
    id: "fibromyalgia",
    label: "Fibromyalgia",
    description:
      "Widespread pain and fatigue requiring gentle, paced movement and lifestyle support.",
  },
  {
    id: "osteoarthritis",
    label: "Osteoarthritis",
    description:
      "Joint stiffness and pain — managed with strength, mobility, and weight-bearing routines.",
  },
];

export function getConditionLabel(id: string): string {
  return CONDITIONS.find((c) => c.id === id)?.label ?? id;
}
