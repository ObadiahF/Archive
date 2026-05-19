import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // shadcn ui modules and context providers export both components
      // and hooks/constants from the same file, which is intentional.
      'react-refresh/only-export-components': 'off',
      // The opt-in v6 rule fires on common patterns (state reset when a
      // prop nulls, syncing derived state, invoking a memoized callback in
      // an effect). Treat as advisory rather than blocking.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
])
