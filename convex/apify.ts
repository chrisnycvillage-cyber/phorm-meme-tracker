import { action, internalAction } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { v } from "convex/values";

// Using instagram-post-scraper - accepts direct post/reel URLs in username array
const APIFY_ACTOR = "apify~instagram-post-scraper";

// Scheduled scrape - called by cron every 6 hours
export const runScheduledScrape = internalAction({
  args: {},
  handler: async (ctx) => {
    console.log("Running scheduled Instagram scrape...");
    return await startScrapeJobInternal(ctx);
  },
});

// Manual trigger for scrape
export const startScrapeJob = action({
  args: {},
  handler: async (ctx) => {
    return await startScrapeJobInternal(ctx);
  },
});

async function startScrapeJobInternal(ctx: any) {
  const apifyToken = process.env.APIFY_API_TOKEN;
  if (!apifyToken) {
    throw new Error("APIFY_API_TOKEN not set. Run: npx convex env set APIFY_API_TOKEN your_token");
  }

  // Get all posts from database
  const posts = await ctx.runQuery(api.posts.getAllPosts);
  
  if (posts.length === 0) {
    return { message: "No posts to scrape. Seed the database first.", postsCount: 0 };
  }

  // Create scrape job record
  const jobId = await ctx.runMutation(internal.scrapeJobs.createJob, {
    postsCount: posts.length,
  });

  // Get all URLs - instagram-post-scraper accepts URLs in the "username" array
  const urls = posts.map((p: any) => p.url);

  try {
    console.log(`Starting Apify scrape for ${urls.length} posts...`);
    
    // Input format for instagram-post-scraper
    const input = {
      username: urls, // Can be usernames OR direct post/reel URLs
      resultsLimit: urls.length,
      skipPinnedPosts: false,
    };

    console.log("Apify input:", JSON.stringify(input, null, 2));
    
    const response = await fetch(
      `https://api.apify.com/v2/acts/${APIFY_ACTOR}/runs?token=${apifyToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Apify API error ${response.status}: ${error}`);
    }

    const result = await response.json();
    const runId = result.data?.id;

    if (!runId) {
      throw new Error("No run ID returned from Apify");
    }

    console.log(`Apify run started: ${runId}`);

    await ctx.runMutation(internal.scrapeJobs.updateJob, {
      jobId,
      apifyRunId: runId,
    });

    // Schedule checking for results in 30 seconds
    await ctx.scheduler.runAfter(30000, internal.apify.checkScrapeResults, {
      jobId,
      runId,
      attempt: 1,
    });

    return {
      message: "Scrape job started",
      jobId,
      apifyRunId: runId,
      postsCount: posts.length,
    };
  } catch (error: any) {
    console.error("Scrape start error:", error);
    await ctx.runMutation(internal.scrapeJobs.failJob, {
      jobId,
      error: error.message,
    });
    throw error;
  }
}

// Check Apify run results
export const checkScrapeResults = internalAction({
  args: {
    jobId: v.id("scrapeJobs"),
    runId: v.string(),
    attempt: v.number(),
  },
  handler: async (ctx, args) => {
    const apifyToken = process.env.APIFY_API_TOKEN;
    if (!apifyToken) throw new Error("APIFY_API_TOKEN not set");

    const maxAttempts = 40; // Max ~20 minutes (40 * 30s)

    try {
      // Check run status
      const statusResponse = await fetch(
        `https://api.apify.com/v2/actor-runs/${args.runId}?token=${apifyToken}`
      );

      if (!statusResponse.ok) {
        throw new Error(`Failed to get run status: ${statusResponse.status}`);
      }

      const statusData = await statusResponse.json();
      const status = statusData.data?.status;

      console.log(`Apify run ${args.runId} status: ${status} (attempt ${args.attempt}/${maxAttempts})`);

      // Still running - check again later
      if (status === "RUNNING" || status === "READY") {
        if (args.attempt < maxAttempts) {
          await ctx.scheduler.runAfter(30000, internal.apify.checkScrapeResults, {
            jobId: args.jobId,
            runId: args.runId,
            attempt: args.attempt + 1,
          });
          return { status: "waiting", attempt: args.attempt };
        } else {
          await ctx.runMutation(internal.scrapeJobs.failJob, {
            jobId: args.jobId,
            error: "Timeout waiting for Apify results after 20 minutes",
          });
          return { status: "timeout" };
        }
      }

      // Failed
      if (status !== "SUCCEEDED") {
        await ctx.runMutation(internal.scrapeJobs.failJob, {
          jobId: args.jobId,
          error: `Apify run failed with status: ${status}`,
        });
        return { status: "failed", apifyStatus: status };
      }

      // Success - get results from dataset
      const datasetId = statusData.data?.defaultDatasetId;
      console.log(`Fetching results from dataset: ${datasetId}`);
      
      const resultsResponse = await fetch(
        `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apifyToken}&format=json`
      );

      if (!resultsResponse.ok) {
        throw new Error(`Failed to get results: ${resultsResponse.status}`);
      }

      const results = await resultsResponse.json();
      console.log(`Got ${results.length} results from Apify`);

      // Process each result
      let succeeded = 0;
      let failed = 0;

      for (const item of results) {
        try {
          // Extract shortcode from various possible fields
          let shortcode = item.shortCode || item.shortcode || item.id || item.code;
          
          // Try to extract from URL fields
          if (!shortcode) {
            const urlToCheck = item.url || item.inputUrl || item.postUrl;
            if (urlToCheck) {
              const match = urlToCheck.match(/\/(?:reel|p)\/([A-Za-z0-9_-]+)/);
              if (match) shortcode = match[1];
            }
          }

          if (!shortcode) {
            console.log("Could not extract shortcode from:", JSON.stringify(item).slice(0, 300));
            failed++;
            continue;
          }

          // Extract video URL from various possible fields (be very thorough)
          const videoUrl = item.videoUrl || 
            item.video_url || 
            item.videoSrc || 
            item.video ||
            (item.videoVersions && item.videoVersions[0]?.url) ||
            (item.videos && item.videos[0]?.url) ||
            (item.video_versions && item.video_versions[0]?.url);
          
          // Extract thumbnail URL from various possible fields
          const thumbnailUrl = item.displayUrl || 
            item.thumbnailUrl || 
            item.thumbnail_url ||
            item.previewUrl || 
            item.imageUrl ||
            item.image_url ||
            item.display_url ||
            (item.images && item.images[0]?.url) ||
            (item.image_versions2?.candidates && item.image_versions2.candidates[0]?.url);

          // Extract owner profile pic URL - try multiple sources
          // Note: The instagram-post-scraper may not include ownerProfilePicUrl directly
          // Try to get it from taggedUsers if the owner is tagged, or from owner object
          let ownerProfilePicUrl = item.ownerProfilePicUrl || 
            item.owner_profile_pic_url ||
            item.profilePicUrl ||
            item.owner?.profile_pic_url ||
            item.owner?.profilePicUrl;
          
          // If still no owner pic, check if we can get from taggedUsers matching owner
          if (!ownerProfilePicUrl && item.taggedUsers && Array.isArray(item.taggedUsers)) {
            const ownerTag = item.taggedUsers.find((u: any) => 
              u.username === item.ownerUsername || u.id === item.ownerId
            );
            if (ownerTag) {
              ownerProfilePicUrl = ownerTag.profile_pic_url || ownerTag.profilePicUrl;
            }
            // If no match, at least grab the first tagged user's profile (often @1stphorm)
            if (!ownerProfilePicUrl && item.taggedUsers[0]) {
              ownerProfilePicUrl = item.taggedUsers[0].profile_pic_url || item.taggedUsers[0].profilePicUrl;
            }
          }

          console.log(`Processing post ${shortcode}:`, {
            views: item.videoViewCount || item.videoPlayCount || item.playCount,
            likes: item.likesCount,
            hasVideo: !!videoUrl,
            videoUrlStart: videoUrl?.substring(0, 80),
            hasThumbnail: !!thumbnailUrl,
            thumbnailUrlStart: thumbnailUrl?.substring(0, 80),
            hasOwnerPic: !!ownerProfilePicUrl,
          });

          // Update post in database
          await ctx.runMutation(internal.posts.updatePostStats, {
            shortcode,
            views: item.videoViewCount || item.videoPlayCount || item.playCount || item.viewCount,
            likes: item.likesCount || item.likeCount || item.likes,
            comments: item.commentsCount || item.commentCount || item.comments,
            shares: item.sharesCount || item.shareCount,
            thumbnailUrl: thumbnailUrl,
            videoUrl: videoUrl,
            caption: item.caption || item.alt || item.text,
            username: item.ownerUsername || item.username || item.owner?.username,
            postedAt: item.timestamp || item.takenAtTimestamp?.toString(),
            status: "active",
            ownerProfilePicUrl: ownerProfilePicUrl,
          });
          
          succeeded++;
        } catch (error: any) {
          console.error(`Error processing item: ${error.message}`);
          failed++;
        }
      }

      // Complete the job
      await ctx.runMutation(internal.scrapeJobs.completeJob, {
        jobId: args.jobId,
        succeeded,
        failed,
      });

      console.log(`✓ Scrape completed: ${succeeded} succeeded, ${failed} failed`);
      return { status: "completed", succeeded, failed };
      
    } catch (error: any) {
      console.error("Error in checkScrapeResults:", error);
      await ctx.runMutation(internal.scrapeJobs.failJob, {
        jobId: args.jobId,
        error: error.message,
      });
      return { status: "error", error: error.message };
    }
  },
});

// Test Apify connection
export const testApifyConnection = action({
  args: {},
  handler: async () => {
    const apifyToken = process.env.APIFY_API_TOKEN;
    if (!apifyToken) {
      return { success: false, error: "APIFY_API_TOKEN not set" };
    }

    try {
      const response = await fetch(
        `https://api.apify.com/v2/acts/${APIFY_ACTOR}?token=${apifyToken}`
      );
      
      if (!response.ok) {
        return { success: false, error: `API returned ${response.status}` };
      }
      
      const data = await response.json();
      return { 
        success: true, 
        actorName: data.data?.name,
        actorId: data.data?.id,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
});

// Get last run results (for debugging)
export const getLastRunResults = action({
  args: {},
  handler: async () => {
    const apifyToken = process.env.APIFY_API_TOKEN;
    if (!apifyToken) {
      return { success: false, error: "APIFY_API_TOKEN not set" };
    }

    try {
      const response = await fetch(
        `https://api.apify.com/v2/acts/${APIFY_ACTOR}/runs/last/dataset/items?token=${apifyToken}&status=SUCCEEDED`
      );
      
      if (!response.ok) {
        return { success: false, error: `API returned ${response.status}` };
      }
      
      const data = await response.json();
      return { 
        success: true, 
        count: data.length,
        sample: data.slice(0, 2), // First 2 items as sample
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
});
