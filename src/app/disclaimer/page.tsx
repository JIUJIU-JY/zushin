import LegalPage, { LegalSection } from '@/components/legal-page'

const sections: LegalSection[] = [
  {
    bullets: [
      '租信的合同体检结果由人工智能（DeepSeek）根据你提供的合同文本自动生成，可能存在错误、遗漏或误判。',
      '该结果仅供参考，不构成法律意见，不能替代专业律师或法律机构的判断。',
      'AI 的分析完全依赖你提供的文本，若合同内容不完整或表述模糊，结果可能不准确。',
      '涉及押金、违约、诉讼等重大权益时，请务必咨询专业律师或相关部门，并以正式法律文件和专业意见为准。',
      '是否采纳 AI 的建议、以及由此产生的决定，由你自行判断和承担。',
    ],
  },
]

export default function DisclaimerPage() {
  return <LegalPage title="AI 免责声明" sections={sections} />
}
