import js from '@eslint/js'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

const tsconfigRootDir = dirname(fileURLToPath(import.meta.url))

export default defineConfig([
  globalIgnores([
    'dist/**',
    'src-tauri/target/**',    // Legacy design/prototype frontends are no longer launched by Tauri.
    // The active desktop UI is the repository root Shadcn app under ../../src.
    'phoenix/**',
    'src/**',
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir,
      },
      globals: globals.browser,
    },
  },
])
