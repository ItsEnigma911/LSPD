// Vercel entry point. Vercel looks in /api for functions; this file just
// hands every request to the same Express app used for local dev
// (`node server.js`). See ../vercel.json for the rewrite that sends every
// path here.
module.exports = require("../server.js");
