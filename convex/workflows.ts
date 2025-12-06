import { action } from "./_generated/server";
import { api } from "./_generated/api";

// Manual trigger for scrape workflow (calls apify:startScrapeJob)
export const triggerScrape = action({
  args: {},
  handler: async (ctx) => {
    return await ctx.runAction(api.apify.startScrapeJob, {});
  },
});

// Test Apify connection
export const testConnection = action({
  args: {},
  handler: async (ctx) => {
    return await ctx.runAction(api.apify.testApifyConnection, {});
  },
});
