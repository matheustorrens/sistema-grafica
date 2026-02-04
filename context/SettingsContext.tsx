/**
 * Legacy SettingsContext
 * Re-exports from the new shared context for backwards compatibility
 * 
 * @deprecated Use '@/shared/context' instead
 * This file exists only to maintain compatibility with pages in the old structure.
 * All new code should import from '@/shared/context'.
 */

export { SettingsProvider, useSettings } from '../src/shared/context/SettingsContext';
