import { cronJobs } from "convex/server";
// import { internal } from "./_generated/api";

const crons = cronJobs();

// DISABLED - Auto-scraping turned off
// Data is now manually managed to match Metrix Media
// 
// crons.interval(
//   "scrape-instagram-stats",
//   { hours: 6 },
//   internal.apify.runScheduledScrape
// );

export default crons;
