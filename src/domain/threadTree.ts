import type { ThreadRecord } from './models'

export type ThreadTreeNode = ThreadRecord & {
  children: ThreadTreeNode[]
  childCount: number
  descendantCount: number
}

export type ThreadProjectTreeGroup = {
  projectPath: string
  projectName: string
  threadCount: number
  rootCount: number
  lostThreadCount: number
  missingProjectDirectoryCount: number
  roots: ThreadTreeNode[]
}

const DIALOGS_PROJECT_PATH = 'Dialogs'
const DIALOGS_PROJECT_NAME = '对话'

export function buildThreadProjectTrees(threads: ThreadRecord[]): ThreadProjectTreeGroup[] {
  const nodes = new Map<string, ThreadTreeNode>()
  for (const thread of threads) {
    nodes.set(thread.threadId, {
      ...thread,
      children: [],
      childCount: 0,
      descendantCount: 0,
    })
  }

  const roots: ThreadTreeNode[] = []
  for (const node of nodes.values()) {
    const parentId = node.parentThreadId
    const parent = parentId ? nodes.get(parentId) : null
    if (parent) {
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  }

  for (const node of nodes.values()) {
    node.children.sort(sortNodesByRecency)
    node.childCount = node.children.length
    node.descendantCount = countDescendants(node)
  }

  const groups = new Map<string, ThreadProjectTreeGroup>()
  for (const root of roots.sort(sortNodesByRecency)) {
    const key = normalizeProjectKey(root)
    const group = groups.get(key) ?? {
      projectPath: key,
      projectName: key === DIALOGS_PROJECT_PATH ? DIALOGS_PROJECT_NAME : root.projectName,
      threadCount: 0,
      rootCount: 0,
      lostThreadCount: 0,
      missingProjectDirectoryCount: 0,
      roots: [],
    }
    const branchThreads = flattenThreadTree(root)
    group.threadCount += branchThreads.length
    group.rootCount += 1
    group.lostThreadCount += branchThreads.filter((thread) => thread.lost).length
    group.missingProjectDirectoryCount += branchThreads.filter((thread) => thread.missingProjectDirectory).length
    group.roots.push(root)
    groups.set(key, group)
  }

  return Array.from(groups.values()).sort((left, right) => {
    if (left.projectPath === DIALOGS_PROJECT_PATH) {
      return 1
    }
    if (right.projectPath === DIALOGS_PROJECT_PATH) {
      return -1
    }
    return right.threadCount - left.threadCount || left.projectName.localeCompare(right.projectName)
  })
}

export function selectThreadBranchIds(node: ThreadTreeNode): string[] {
  return flattenThreadTree(node).map((thread) => thread.threadId)
}

export function flattenThreadTree(node: ThreadTreeNode): ThreadTreeNode[] {
  return [node, ...node.children.flatMap(flattenThreadTree)]
}

function normalizeProjectKey(thread: ThreadRecord): string {
  if (!thread.projectPath || thread.projectPath === '未知项目' || thread.orphaned) {
    return DIALOGS_PROJECT_PATH
  }
  return thread.projectPath
}

function countDescendants(node: ThreadTreeNode): number {
  return node.children.reduce((count, child) => count + 1 + countDescendants(child), 0)
}

function sortNodesByRecency(left: ThreadTreeNode, right: ThreadTreeNode): number {
  return right.lastUpdatedAt.localeCompare(left.lastUpdatedAt)
}
