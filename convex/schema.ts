import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Instagram posts from the campaign
  posts: defineTable({
    url: v.string(),
    shortcode: v.string(), // Extracted from URL (e.g., "DRzxrU6EY8y")
    username: v.optional(v.string()),
    
    // Stats from Instagram (scraped via Apify)
    views: v.optional(v.number()),
    likes: v.optional(v.number()),
    comments: v.optional(v.number()),
    shares: v.optional(v.number()),
    
    // Metadata
    thumbnailUrl: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    caption: v.optional(v.string()),
    postedAt: v.optional(v.string()),
    ownerProfilePicUrl: v.optional(v.string()),
    
    // Tracking
    status: v.string(), // "active", "deleted", "restricted", "pending"
    lastScrapedAt: v.optional(v.number()), // Timestamp
    scrapeError: v.optional(v.string()),
    
    // Source tracking
    sourceRow: v.optional(v.number()), // Row number in Google Sheet
  })
    .index("by_shortcode", ["shortcode"])
    .index("by_status", ["status"])
    .index("by_views", ["views"]),

  // Scrape job history
  scrapeJobs: defineTable({
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    status: v.string(), // "running", "completed", "failed"
    postsProcessed: v.number(),
    postsSucceeded: v.number(),
    postsFailed: v.number(),
    error: v.optional(v.string()),
    apifyRunId: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_startedAt", ["startedAt"]),

  // Config storage
  config: defineTable({
    key: v.string(),
    value: v.string(),
  }).index("by_key", ["key"]),
});

