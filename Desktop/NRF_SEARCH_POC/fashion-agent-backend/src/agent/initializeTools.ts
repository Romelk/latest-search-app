/**
 * Initialize all tools for the Fashion Agent
 */

import { ToolRegistry } from '../tools/ToolRegistry';
import { registerImageTools } from '../tools/imageTools';
import { registerTrendsTools } from '../tools/trendsTools';

export function initializeTools(): ToolRegistry {
  const registry = new ToolRegistry();

  // Register all tool categories
  registerTrendsTools(registry);
  registerImageTools(registry);

  console.log(`\n✅ Initialized ${registry.getToolCount()} tools:`);
  console.log(`   ${registry.getToolNames().join(', ')}\n`);

  return registry;
}

export default initializeTools;
