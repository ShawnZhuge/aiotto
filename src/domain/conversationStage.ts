import type { ThreadMessagePreview, ThreadRecord } from './models'
import { isDisplayableConversationMessage } from './conversationContent'

export type ConversationStage =
  | 'waiting_for_ai'
  | 'thinking'
  | 'planning'
  | 'coding'
  | 'verifying'
  | 'waiting_for_user'
  | 'done'
  | 'blocked'
  | 'idle'

export type ConversationStageInput = {
  status: ThreadRecord['status']
  summary?: string | null
  recentMessages?: ThreadMessagePreview[]
}

const CONVERSATION_STAGES: ConversationStage[] = [
  'waiting_for_ai',
  'thinking',
  'planning',
  'coding',
  'verifying',
  'waiting_for_user',
  'done',
  'blocked',
  'idle',
]

const LABELS: Record<ConversationStage, string> = {
  waiting_for_ai: '等待回复',
  thinking: '分析中',
  planning: '方案中',
  coding: '开发中',
  verifying: '验证中',
  waiting_for_user: '等你确认',
  done: '已完成',
  blocked: '受阻',
  idle: '空闲',
}

export function inferConversationStage(input: ConversationStageInput): ConversationStage {
  if (input.status === 'failed') {
    return 'blocked'
  }
  if (input.status === 'approval' || input.status === 'waiting') {
    return 'waiting_for_user'
  }
  if (input.status === 'completed') {
    return 'done'
  }

  const latest = latestReadableMessage(input.recentMessages ?? [])
  if (latest?.role === 'user') {
    return 'waiting_for_ai'
  }

  const text = normalizeStageText(latest?.content || input.summary || '')
  if (!text) {
    return input.status === 'running' ? 'coding' : 'idle'
  }

  if (/(需要你|请你|等你|你确认|请确认|是否启用|是否需要|要不要|你选择|回复我)/i.test(text)) {
    return 'waiting_for_user'
  }
  if (/(失败|报错|卡住|阻塞|blocked|无法继续|不能继续|权限不足)/i.test(text)) {
    return 'blocked'
  }
  if (/(已完成|已经完成|修好了|验证通过|测试通过|全部通过|可以交付|算修到|已经对上)/i.test(text)) {
    return 'done'
  }
  if (/(测试|验证|确认运行态|跑.*test|跑.*测试|lint|build|构建|重启|smoke|通过)/i.test(text)) {
    return 'verifying'
  }
  if (/(开发|实现|修改|改实现|补上|接入|写代码|patch|重构|联调|修复)/i.test(text)) {
    return 'coding'
  }
  if (/(计划|方案|路线|需求|设计|拆成|整理|下一步|文档|交互)/i.test(text)) {
    return 'planning'
  }
  if (/(分析|定位|研究|看一下|检查|解释|追踪|梳理|判断|思考)/i.test(text)) {
    return 'thinking'
  }

  return input.status === 'running' ? 'coding' : 'idle'
}

export function conversationStageLabel(stage: ConversationStage | null | undefined): string {
  return LABELS[sanitizeConversationStage(stage)]
}

export function sanitizeConversationStage(stage: string | null | undefined): ConversationStage {
  return CONVERSATION_STAGES.includes(stage as ConversationStage) ? (stage as ConversationStage) : 'idle'
}

function latestReadableMessage(messages: ThreadMessagePreview[]): ThreadMessagePreview | null {
  return [...messages]
    .reverse()
    .find(isDisplayableConversationMessage) ?? null
}

function normalizeStageText(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}
