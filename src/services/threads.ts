import {
  applyCodexAppServerRealtimeEventToThreads,
  getCodexAppServerThreadSnapshotWithFallback,
  listenToCodexAppServerRealtimeEvents,
  mergeCodexAppServerSnapshotIntoThreads,
  startCodexAppServerTurn,
} from '../domain/codexAppServer'
import {
  applyCodexSessionMessagesToThreadRecord,
  codexSessionMetasToThreadRecords,
  getCodexSessionMessagesWithFallback,
  listCodexSessionsWithFallback,
  syncCodexSessionUsageWithFallback,
} from '../domain/threadIndexer'
import { applyThreadFileActionWithFallback } from '../domain/threadActions'
import { openThreadRestoreInTerminal } from '../domain/threadTerminal'

export const threadsService = {
  listCodexSessions: listCodexSessionsWithFallback,
  codexSessionMetasToThreadRecords,
  getSessionMessages: getCodexSessionMessagesWithFallback,
  syncSessionUsage: syncCodexSessionUsageWithFallback,
  applySessionMessagesToThreadRecord: applyCodexSessionMessagesToThreadRecord,
  getAppServerThreadSnapshot: getCodexAppServerThreadSnapshotWithFallback,
  mergeAppServerSnapshotIntoThreads: mergeCodexAppServerSnapshotIntoThreads,
  applyRealtimeEventToThreads: applyCodexAppServerRealtimeEventToThreads,
  listenToRealtimeEvents: listenToCodexAppServerRealtimeEvents,
  startCodexAppServerTurn,
  openThreadRestoreInTerminal,
  applyThreadFileAction: applyThreadFileActionWithFallback,
}
