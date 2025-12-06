import { mutation } from "./_generated/server";
import { v } from "convex/values";

// ALL Instagram reel URLs from the 1st Phorm campaign spreadsheet
// Source: https://docs.google.com/spreadsheets/d/1vmkww5X0dj35ADV9JAue6Nns41vVDxyVlB01rFT0zss
const CAMPAIGN_POSTS = [
  // Rows 2-21
  "https://www.instagram.com/reel/DRzxrU6EY8y/",
  "https://www.instagram.com/reel/DR0JOiGiKCR/",
  "https://www.instagram.com/reel/DR0JaWNAJV8/",
  "https://www.instagram.com/reel/DR0KxKCjQuN/",
  "https://www.instagram.com/reel/DR0KpiPDZ1M/",
  "https://www.instagram.com/reel/DR0J0v-jJuE/",
  "https://www.instagram.com/reel/DR0J_sdDp4u/",
  "https://www.instagram.com/reel/DR0KMOMDTwr/",
  "https://www.instagram.com/reel/DR0KXPtgvS4/",
  "https://www.instagram.com/reel/DR0KSVMCFlt/",
  "https://www.instagram.com/reel/DR0Kq-rDAMl/",
  "https://www.instagram.com/reel/DR0NIGxDRgf/",
  "https://www.instagram.com/reel/DR0OCbOibcd/",
  "https://www.instagram.com/reel/DR0O0yFEhnV/",
  "https://www.instagram.com/reel/DR0O4B4gX5V/",
  "https://www.instagram.com/reel/DR0O9GqEhxJ/",
  "https://www.instagram.com/reel/DR0ORrBkvVu/",
  "https://www.instagram.com/reel/DR0RXYGAeZh/",
  "https://www.instagram.com/reel/DR18n9tDBRU/",
  "https://www.instagram.com/reel/DR18iBZDJYc/",
  "https://www.instagram.com/reel/DR17lfviCxX/",
  // Rows 81-100
  "https://www.instagram.com/reel/DR221GajWGo/",
  "https://www.instagram.com/reel/DR23Rb9CN_d/",
  "https://www.instagram.com/reel/DR22qKxAK7I/",
  "https://www.instagram.com/reel/DR21FadCIJE/",
  "https://www.instagram.com/reel/DR2MAXSjWy-/",
  "https://www.instagram.com/reel/DR23mAvjY7Z/",
  "https://www.instagram.com/reel/DR231wHApOe/",
  "https://www.instagram.com/reel/DR23tgSDB4I/",
  "https://www.instagram.com/reel/DR24CmUjEJH/",
  "https://www.instagram.com/reel/DR24N-WiIMW/",
  "https://www.instagram.com/reel/DR3s6ySjX-y/",
  "https://www.instagram.com/reel/DR4yKRxjMO_/",
  "https://www.instagram.com/reel/DR3A8eoDCyb/",
  "https://www.instagram.com/reel/DR3C7unCpZY/",
  "https://www.instagram.com/reel/DR40pr-jBgA/",
  "https://www.instagram.com/reel/DR42PS9jdd0/",
  "https://www.instagram.com/reel/DR44xNukdM3/",
  "https://www.instagram.com/reel/DR44ef5DaSL/",
  "https://www.instagram.com/reel/DR44qb0jHKC/",
  "https://www.instagram.com/reel/DR443Y7jES_/",
];

// Seed the database with all campaign posts
export const seedPosts = mutation({
  args: {},
  handler: async (ctx) => {
    let added = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const url of CAMPAIGN_POSTS) {
      try {
        // Extract shortcode from URL
        const shortcodeMatch = url.match(/\/reel\/([A-Za-z0-9_-]+)/);
        if (!shortcodeMatch) {
          errors.push(`Invalid URL: ${url}`);
          skipped++;
          continue;
        }
        
        const shortcode = shortcodeMatch[1];
        
        // Check if already exists
        const existing = await ctx.db
          .query("posts")
          .withIndex("by_shortcode", (q) => q.eq("shortcode", shortcode))
          .first();
        
        if (existing) {
          skipped++;
          continue;
        }
        
        // Insert new post
        await ctx.db.insert("posts", {
          url: url.split("?")[0],
          shortcode,
          status: "pending",
        });
        added++;
      } catch (error: any) {
        errors.push(`Error with ${url}: ${error.message}`);
      }
    }

    return { 
      added, 
      skipped, 
      total: CAMPAIGN_POSTS.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
});

// Add a single post URL manually
export const addPost = mutation({
  args: {
    url: v.string(),
    username: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const shortcodeMatch = args.url.match(/\/reel\/([A-Za-z0-9_-]+)/);
    if (!shortcodeMatch) {
      throw new Error("Invalid Instagram reel URL. Must contain /reel/SHORTCODE");
    }
    
    const shortcode = shortcodeMatch[1];
    
    // Check if already exists
    const existing = await ctx.db
      .query("posts")
      .withIndex("by_shortcode", (q) => q.eq("shortcode", shortcode))
      .first();
    
    if (existing) {
      return { id: existing._id, status: "exists", shortcode };
    }
    
    const id = await ctx.db.insert("posts", {
      url: args.url.split("?")[0],
      shortcode,
      username: args.username,
      status: "pending",
    });
    
    return { id, status: "created", shortcode };
  },
});

// Add multiple posts at once
export const addPosts = mutation({
  args: {
    urls: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    let added = 0;
    let skipped = 0;
    
    for (const url of args.urls) {
      const shortcodeMatch = url.match(/\/reel\/([A-Za-z0-9_-]+)/);
      if (!shortcodeMatch) continue;
      
      const shortcode = shortcodeMatch[1];
      
      const existing = await ctx.db
        .query("posts")
        .withIndex("by_shortcode", (q) => q.eq("shortcode", shortcode))
        .first();
      
      if (existing) {
        skipped++;
        continue;
      }
      
      await ctx.db.insert("posts", {
        url: url.split("?")[0],
        shortcode,
        status: "pending",
      });
      added++;
    }
    
    return { added, skipped, total: args.urls.length };
  },
});

// Clear all posts (use with caution!)
export const clearAllPosts = mutation({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db.query("posts").collect();
    for (const post of posts) {
      await ctx.db.delete(post._id);
    }
    return { deleted: posts.length };
  },
});

// Get count of posts in database
export const getPostCount = mutation({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db.query("posts").collect();
    const pending = posts.filter(p => p.status === "pending").length;
    const active = posts.filter(p => p.status === "active").length;
    const withStats = posts.filter(p => p.views && p.views > 0).length;
    
    return {
      total: posts.length,
      pending,
      active,
      withStats,
    };
  },
});
