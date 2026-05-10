export const errorHandler = (err, req, res, next) => {
    console.error(`[ERROR] ${err.stack}`);

    const statusCode = err.name === 'ValidationError' ? 400 : 500;
    
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};