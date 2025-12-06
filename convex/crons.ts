import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run Instagram scrape every 6 hours
crons.interval(
  "scrape-instagram-stats",
  { hours: 6 },
  internal.apify.runScheduledScrape
);

export default crons;
