import logger from '../utils/logger.js';

const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error(`${err.name || 'Error'}: ${err.message}\n${err.stack}`);

  // Determine the status code (default to 500 if not set)
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    // Include stack trace only in development
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
  });
};

export default errorHandler;
