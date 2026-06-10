import { ContractCheck, PromiseRecord, RecordItem } from './types'

export const mockContractCheck: ContractCheck = {
  id: 'contract-1',
  fileName: '深圳市房屋租赁合同.pdf',
  fileType: 'pdf',
  fileSize: '1.2MB',
  riskLevel: 'high',
  summary: '该合同存在较多潜在风险，建议重点关注押金退还、提前退租违约金、维修责任和合同解除条件。',
  createdAt: '2024-06-05 14:30',
  risks: [
    {
      id: 'risk-1',
      title: '押金退还条款不明确',
      description: '合同中未明确押金退还的条件和时间。',
      level: 'high',
      category: 'deposit',
      suggestion: '建议在合同中明确押金退还时间，例如退租验房后7个工作日内退还。'
    },
    {
      id: 'risk-2',
      title: '提前退租违约金过高',
      description: '违约金比例超过30%，可能不合理。',
      level: 'high',
      category: 'termination',
      suggestion: '建议与房东协商降低违约金比例，并明确可协商退租的情形。'
    },
    {
      id: 'risk-3',
      title: '维修责任划分不清晰',
      description: '合同未明确房东与租客的维修责任范围。',
      level: 'medium',
      category: 'repair',
      suggestion: '建议明确自然损耗、房屋结构、水电设备等维修责任由谁承担。'
    },
    {
      id: 'risk-4',
      title: '合同解除条件模糊',
      description: '合同解除条件描述不够具体。',
      level: 'medium',
      category: 'contract',
      suggestion: '建议明确双方可解除合同的具体条件、通知期限和费用处理方式。'
    }
  ]
}

export const mockPromiseRecords: PromiseRecord[] = [
  {
    id: 'promise-1',
    personType: 'landlord',
    content: '房东说押金会在退租后7天内全部退还，如果房子没损坏的话。',
    inputType: 'text',
    tags: ['押金', '退租'],
    createdAt: '2024-06-05 10:21',
    isFavorite: false
  },
  {
    id: 'promise-2',
    personType: 'agent',
    content: '中介说可以帮忙协调提前退租，违约金可以减免。',
    inputType: 'text',
    tags: ['退租', '费用'],
    createdAt: '2024-06-04 16:45',
    isFavorite: false
  },
  {
    id: 'promise-3',
    personType: 'landlord',
    content: '房东说水电维修由房东负责，日常小修小补由租客负责。',
    inputType: 'text',
    tags: ['维修'],
    createdAt: '2024-06-03 11:20',
    isFavorite: true
  }
]

export const mockRecords: RecordItem[] = [
  {
    id: 'record-1',
    type: 'promise_record',
    title: '房东承诺 - 押金退还',
    description: '房东说押金会在退租后7天内全部退还，如果房子没损坏的话。',
    tags: ['押金', '退租'],
    createdAt: '2024-06-05 10:21',
    isFavorite: false
  },
  {
    id: 'record-2',
    type: 'contract_check',
    title: '合同体检 - XX小区 2栋 301',
    description: '发现4个风险点，建议重点关注押金退还条款和违约金条款。',
    tags: ['高风险'],
    createdAt: '2024-06-05 14:30',
    riskLevel: 'high',
    isFavorite: false
  },
  {
    id: 'record-3',
    type: 'agent_communication',
    title: '中介沟通记录',
    description: '中介说可以帮忙协调提前退租，违约金可以减免。',
    tags: ['退租', '费用'],
    createdAt: '2024-06-04 16:45',
    isFavorite: false
  },
  {
    id: 'record-4',
    type: 'promise_record',
    title: '房东承诺 - 维修责任',
    description: '房东说水电维修由房东负责，日常小修小补由租客负责。',
    tags: ['维修'],
    createdAt: '2024-06-03 11:20',
    isFavorite: true
  }
]