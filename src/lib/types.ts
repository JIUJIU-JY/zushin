export type RiskLevel = 'low' | 'medium' | 'high'
export type PersonType = 'landlord' | 'agent' | 'other'
export type InputType = 'text' | 'voice'
export type RecordType = 'contract_check' | 'promise_record' | 'agent_communication'

export interface RiskItem {
  id: string
  title: string
  description: string
  level: RiskLevel
  category: 'deposit' | 'rent' | 'repair' | 'termination' | 'fee' | 'contract' | 'other'
  suggestion: string
}

export interface ContractFinding {
  category: string
  riskLevel: '高' | '中' | '低'
  originalText: string
  explanation: string
  suggestion: string
  confidence: '高' | '中' | '低'
}

export interface MissingClause {
  topic: string
  note: string
}

export interface ContractReport {
  overallRisk: '高' | '中' | '低'
  summary: string
  findings: ContractFinding[]
  missingClauses: MissingClause[]
}

export interface ContractCheck {
  id: string
  fileName: string
  fileType: 'pdf' | 'image' | 'word' | 'text'
  fileSize: string
  riskLevel: RiskLevel
  summary: string
  risks: RiskItem[]
  createdAt: string
}

export interface PromiseRecord {
  id: string
  personType: PersonType
  content: string
  inputType: InputType
  tags: string[]
  note?: string
  createdAt: string
  isFavorite: boolean
}

export interface RecordItem {
  id: string
  type: RecordType
  title: string
  description: string
  tags: string[]
  createdAt: string
  riskLevel?: RiskLevel
  isFavorite: boolean
}