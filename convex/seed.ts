import { mutation } from "./_generated/server";
import { v } from "convex/values";

// ALL 106 Instagram reel URLs from the 1st Phorm campaign
const CAMPAIGN_POSTS = [
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
  "https://www.instagram.com/reel/DR17b1hjcDn/",
  "https://www.instagram.com/reel/DR17QpvDJlR/",
  "https://www.instagram.com/reel/DR17H9eiGB3/",
  "https://www.instagram.com/reel/DR17rHCCH5e/",
  "https://www.instagram.com/reel/DR17rAhCATj/",
  "https://www.instagram.com/reel/DR1779riIgZ/",
  "https://www.instagram.com/reel/DR18AVtghg_/",
  "https://www.instagram.com/reel/DR17wfdiNu9/",
  "https://www.instagram.com/reel/DR18VOPjNZo/",
  "https://www.instagram.com/reel/DR18ECWimjK/",
  "https://www.instagram.com/reel/DR18jgPDFsv/",
  "https://www.instagram.com/reel/DR18mQeCLCf/",
  "https://www.instagram.com/reel/DR18_ufiPnV/",
  "https://www.instagram.com/reel/DR19LNYjOTb/",
  "https://www.instagram.com/reel/DR197A3DJAR/",
  "https://www.instagram.com/reel/DR19T1SDCNI/",
  "https://www.instagram.com/reel/DR1-ZE_AhuG/",
  "https://www.instagram.com/reel/DR183eLCiO4/",
  "https://www.instagram.com/reel/DR1816jjKhh/",
  "https://www.instagram.com/reel/DR1-buXDCKF/",
  "https://www.instagram.com/reel/DR1-VdNCMew/",
  "https://www.instagram.com/reel/DR1-medjIrA/",
  "https://www.instagram.com/reel/DR1-smOiIwO/",
  "https://www.instagram.com/reel/DR1-ghACDRa/",
  "https://www.instagram.com/reel/DR2DbZ9DDl6/",
  "https://www.instagram.com/reel/DR2AooIDdt5/",
  "https://www.instagram.com/reel/DR2FH7FjMHB/",
  "https://www.instagram.com/reel/DR2FQ8KDKMh/",
  "https://www.instagram.com/reel/DR2FmJ1jPtn/",
  "https://www.instagram.com/reel/DR2FkPyiPfO/",
  "https://www.instagram.com/reel/DR2FiftDKY8/",
  "https://www.instagram.com/reel/DR2GD6jDK8Q/",
  "https://www.instagram.com/reel/DR2G7NMAgrK/",
  "https://www.instagram.com/reel/DR2JBr_jFi_/",
  "https://www.instagram.com/reel/DR2I2DdggEI/",
  "https://www.instagram.com/reel/DR2G1ftiAHS/",
  "https://www.instagram.com/reel/DR2MAXSjWy-/",
  "https://www.instagram.com/reel/DR2xqWgDOqb/",
  "https://www.instagram.com/reel/DR2xtSPjS_u/",
  "https://www.instagram.com/reel/DR2yMc5jHfy/",
  "https://www.instagram.com/reel/DR2x0kUinnm/",
  "https://www.instagram.com/reel/DR2x7okCHKz/",
  "https://www.instagram.com/reel/DR2yXmajs_b/",
  "https://www.instagram.com/reel/DR2yEtpjN93/",
  "https://www.instagram.com/reel/DR2z0pXES7v/",
  "https://www.instagram.com/reel/DR2zyCZkWSJ/",
  "https://www.instagram.com/reel/DR2zYWMD-2t/",
  "https://www.instagram.com/reel/DR2zuySkj_k/",
  "https://www.instagram.com/reel/DR2zh65kp_T/",
  "https://www.instagram.com/reel/DR2zmKOgdJk/",
  "https://www.instagram.com/reel/DR2zpnsgTdG/",
  "https://www.instagram.com/reel/DR2zbZxCd0-/",
  "https://www.instagram.com/reel/DR2zdetEj8Y/",
  "https://www.instagram.com/reel/DR2y5QGgTAm/",
  "https://www.instagram.com/reel/DR21Rq2CTbc/",
  "https://www.instagram.com/reel/DR23Aj5jfj6/",
  "https://www.instagram.com/reel/DR221GajWGo/",
  "https://www.instagram.com/reel/DR23Rb9CN_d/",
  "https://www.instagram.com/reel/DR22qKxAK7I/",
  "https://www.instagram.com/reel/DR21FadCIJE/",
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
  "https://www.instagram.com/reel/DR44XW6CG95/",
  "https://www.instagram.com/reel/DR45I2jDHZx/",
  "https://www.instagram.com/reel/DR45KbgDB81/",
  "https://www.instagram.com/reel/DR450J3gqN7/",
  "https://www.instagram.com/reel/DR45t4FCP6M/",
  "https://www.instagram.com/reel/DR49bvLDMSN/",
  "https://www.instagram.com/reel/DR4_qivjMah/",
  "https://www.instagram.com/reel/DR48fOeiJlJ/",
  "https://www.instagram.com/reel/DR48zHeig7t/",
  "https://www.instagram.com/reel/DR49GPGDHfJ/",
  "https://www.instagram.com/reel/DR49aY-DFDb/",
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
