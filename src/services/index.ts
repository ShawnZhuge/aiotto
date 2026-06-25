import { backupService } from './backup'
import { extensionsService } from './extensions'
import { settingsService } from './settings'
import { threadsService } from './threads'

type FeatureServiceFacade = Record<string, unknown>
type CommunityFeatureModuleId = 'backup' | 'extensions' | 'settings' | 'threads'

export { backupService } from './backup'
export { extensionsService } from './extensions'
export { settingsService } from './settings'
export { threadsService } from './threads'

export const featureServices: Record<CommunityFeatureModuleId, FeatureServiceFacade> = {
  backup: backupService,
  extensions: extensionsService,
  settings: settingsService,
  threads: threadsService,
}
