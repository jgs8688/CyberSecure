import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";
import userRouter from "./router/router.user.js";
import mailRouter from "./router/router.mail.js";
import "./config/googleAuth.js";
import googleRoute from "./router/route.google.js";
import mongoose from "mongoose";
import authorized from "./router/router.authorized.js";
import scanRouter from "./router/router.scan.js";
import reportRouter from "./router/router.report.js";
import dns from "dns";

import helmet from "helmet";
import hpp from "hpp";
import mongoSanitize from "express-mongo-sanitize";
import compression from "compression";
import morgan from "morgan";
import logger from "./utils/logger.js";
import errorHandler from "./middleware/errorHandler.js";

// Fix for MongoDB SRV DNS resolution issue on Node 20 / Windows
dns.setDefaultResultOrder("ipv4first");

dotenv.config();


const app = express();
const PORT = process.env.PORT || 5000;

// Process Event Listeners for Robustness
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}\n${err.stack}`);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}\n${err.stack}`);
  process.exit(1);
});

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : [
      "http://localhost:5173",
      "https://4lw5g375-5173.inc1.devtunnels.ms",
    ];

// Middleware
app.use(helmet()); // Security headers
app.use(hpp()); // Prevent HTTP Parameter Pollution
app.use(mongoSanitize()); // Prevent NoSQL Injection
app.use(compression()); // Gzip compression
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } })); // Request logging

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Session middleware (REQUIRED for Google OAuth)
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-fallback-secret-key-for-development',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS in production
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true
  }
}));

// Passport middleware (REQUIRED for Google OAuth)
app.use(passport.initialize());
app.use(passport.session());

// Error handling middleware
app.use(errorHandler);

// db connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    logger.info("MongoDB connected");
    logger.info(`Database: ${mongoose.connection.db.databaseName}`);
  })
  .catch((err) => {
    logger.error(`MongoDB connection error: ${err}`);
    process.exit(1); // Exit process with failure
  });

// Routes
// userRouter is the route for user authentication
app.use("/user", userRouter);

// mailRouter is the route for sending emails
app.use("/mail", mailRouter);

// googleRoute is the route for google authentication
app.use("/auth", googleRoute);

// authorized middleware for protected routes
app.use("/user", authorized);

// scan the url - protected route
app.use('/url', scanRouter);

// report routes - protected route
app.use('/url', reportRouter);

// 404 error handling
app.use((req, res, next) => {
  res.status(404).json({ message: "404 Not Found" });
});

app.listen(PORT, () => {
  logger.info(`Server is running on port: ${PORT}`);
});