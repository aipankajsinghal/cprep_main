declare module '@sanity/vision' {
  import type { Tool } from 'sanity'
  /** Minimal typing for the vision tool */
  export function visionTool(options?: any): Tool
  const _default: typeof visionTool
  export default _default
}
