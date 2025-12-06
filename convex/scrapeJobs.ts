import { mutation, internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new scrape job
export const createJob = internalMutation({
  args: {
    postsCount: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("scrapeJobs", {
      startedAt: Date.now(),
      status: "running",
      postsProcessed: 0,
      postsSucceeded: 0,
      postsFailed: 0,
    });
  },
});

// Update job with Apify run ID
export const updateJob = internalMutation({
  args: {
    jobId: v.id("scrapeJobs"),
    apifyRunId: v.optional(v.string()),
    postsProcessed: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const updates: any = {};
    if (args.apifyRunId) updates.apifyRunId = args.apifyRunId;
    if (args.postsProcessed !== undefined) updates.postsProcessed = args.postsProcessed;
    
    await ctx.db.patch(args.jobId, updates);
  },
});

// Complete a job successfully
export const completeJob = internalMutation({
  args: {
    jobId: v.id("scrapeJobs"),
    succeeded: v.number(),
    failed: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      completedAt: Date.now(),
      status: "completed",
      postsProcessed: args.succeeded + args.failed,
      postsSucceeded: args.succeeded,
      postsFailed: args.failed,
    });
  },
});

// Mark a job as failed
export const failJob = internalMutation({
  args: {
    jobId: v.id("scrapeJobs"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      completedAt: Date.now(),
      status: "failed",
      error: args.error,
    });
  },
});

// Get recent jobs
export const getRecentJobs = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    return await ctx.db
      .query("scrapeJobs")
      .withIndex("by_startedAt")
      .order("desc")
      .take(limit);
  },
});

// Get currently running job
export const getRunningJob = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("scrapeJobs")
      .withIndex("by_status", (q) => q.eq("status", "running"))
      .first();
  },
});

