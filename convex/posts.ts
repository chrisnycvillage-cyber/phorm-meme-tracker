import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Get all posts sorted by views (highest first)
export const getAllPosts = query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db.query("posts").collect();
    // Sort by views descending, posts without views go to the end
    return posts.sort((a, b) => (b.views || 0) - (a.views || 0));
  },
});

// Get campaign stats summary
export const getCampaignStats = query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db.query("posts").collect();
    
    const activePosts = posts.filter(p => p.status === "active");
    const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);
    const totalLikes = posts.reduce((sum, p) => sum + (p.likes || 0), 0);
    const totalComments = posts.reduce((sum, p) => sum + (p.comments || 0), 0);
    const totalShares = posts.reduce((sum, p) => sum + (p.shares || 0), 0);
    const postsWithStats = posts.filter(p => p.views && p.views > 0).length;
    const postsWithoutStats = posts.length - postsWithStats;
    
    // Get last scrape time
    const lastJob = await ctx.db
      .query("scrapeJobs")
      .withIndex("by_startedAt")
      .order("desc")
      .first();
    
    return {
      totalPosts: posts.length,
      activePosts: activePosts.length,
      totalViews,
      totalLikes,
      totalComments,
      totalShares,
      postsWithStats,
      postsWithoutStats,
      engagementRate: totalViews > 0 
        ? ((totalLikes + totalComments + totalShares) / totalViews * 100).toFixed(2)
        : "0",
      lastScrapedAt: lastJob?.completedAt || lastJob?.startedAt || null,
      lastScrapeStatus: lastJob?.status || null,
    };
  },
});

// Get latest scrape job status
export const getLatestScrapeJob = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("scrapeJobs")
      .withIndex("by_startedAt")
      .order("desc")
      .first();
  },
});

// Add or update a post
export const upsertPost = mutation({
  args: {
    url: v.string(),
    username: v.optional(v.string()),
    sourceRow: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Extract shortcode from URL
    const shortcodeMatch = args.url.match(/\/reel\/([A-Za-z0-9_-]+)/);
    if (!shortcodeMatch) {
      throw new Error(`Invalid Instagram reel URL: ${args.url}`);
    }
    const shortcode = shortcodeMatch[1];
    
    // Check if post already exists
    const existing = await ctx.db
      .query("posts")
      .withIndex("by_shortcode", (q) => q.eq("shortcode", shortcode))
      .first();
    
    if (existing) {
      // Update existing post
      await ctx.db.patch(existing._id, {
        url: args.url.split("?")[0], // Clean URL
        username: args.username || existing.username,
        sourceRow: args.sourceRow,
      });
      return existing._id;
    } else {
      // Create new post
      return await ctx.db.insert("posts", {
        url: args.url.split("?")[0],
        shortcode,
        username: args.username || undefined,
        status: "pending",
        sourceRow: args.sourceRow,
      });
    }
  },
});

// Internal mutation to update post stats after scraping
export const updatePostStats = internalMutation({
  args: {
    shortcode: v.string(),
    views: v.optional(v.number()),
    likes: v.optional(v.number()),
    comments: v.optional(v.number()),
    shares: v.optional(v.number()),
    thumbnailUrl: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    caption: v.optional(v.string()),
    username: v.optional(v.string()),
    postedAt: v.optional(v.string()),
    status: v.optional(v.string()),
    scrapeError: v.optional(v.string()),
    ownerProfilePicUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db
      .query("posts")
      .withIndex("by_shortcode", (q) => q.eq("shortcode", args.shortcode))
      .first();
    
    if (!post) {
      console.log(`Post not found for shortcode: ${args.shortcode}`);
      return;
    }
    
    await ctx.db.patch(post._id, {
      views: args.views ?? post.views,
      likes: args.likes ?? post.likes,
      comments: args.comments ?? post.comments,
      shares: args.shares ?? post.shares,
      thumbnailUrl: args.thumbnailUrl ?? post.thumbnailUrl,
      videoUrl: args.videoUrl ?? post.videoUrl,
      caption: args.caption ?? post.caption,
      username: args.username ?? post.username,
      postedAt: args.postedAt ?? post.postedAt,
      status: args.status ?? (args.views !== undefined ? "active" : post.status),
      lastScrapedAt: Date.now(),
      scrapeError: args.scrapeError,
      ownerProfilePicUrl: args.ownerProfilePicUrl ?? post.ownerProfilePicUrl,
    });
  },
});

// Bulk import posts from Google Sheets
export const importFromSheet = mutation({
  args: {
    posts: v.array(v.object({
      url: v.string(),
      username: v.optional(v.string()),
      row: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    let added = 0;
    let updated = 0;
    
    for (const post of args.posts) {
      const shortcodeMatch = post.url.match(/\/reel\/([A-Za-z0-9_-]+)/);
      if (!shortcodeMatch) continue;
      
      const shortcode = shortcodeMatch[1];
      const existing = await ctx.db
        .query("posts")
        .withIndex("by_shortcode", (q) => q.eq("shortcode", shortcode))
        .first();
      
      if (existing) {
        await ctx.db.patch(existing._id, {
          username: post.username || existing.username,
          sourceRow: post.row,
        });
        updated++;
      } else {
        await ctx.db.insert("posts", {
          url: post.url.split("?")[0],
          shortcode,
          username: post.username || undefined,
          status: "pending",
          sourceRow: post.row,
        });
        added++;
      }
    }
    
    return { added, updated, total: args.posts.length };
  },
});

