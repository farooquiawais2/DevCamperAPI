const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const colors = require('colors');
const fileupload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require("express-rate-limit");
const hpp = require('hpp');
const cors = require('cors');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');

// Load env vars
dotenv.config({ path: './config/config.env' });

connectDB();

// Routes files
const bootcamps = require('./routes/bootcamps');
const courses = require('./routes/courses');
const auth = require('./routes/auth');
const users = require('./routes/users');
const reviews = require('./routes/reviews');
const { mongo } = require('mongoose');

const app = express();

// Body Parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Dev logging middleware
if (process.env.NODE_ENV === "development") {
    app.use(morgan('dev'));
}

// File uploading
app.use(fileupload());

// Sanitize Data
app.use(mongoSanitize());

// Set security headers
app.use(helmet());

// Prevent XSS attacks
app.use(xss());

// Rate Limiting
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Prevent http from pollution
app.use(hpp());

// Enable CORS
app.use(cors());

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

// Mount routers
app.use('/api/v1/bootcamps', bootcamps);
app.use('/api/v1/courses', courses);
app.use('/api/v1/auth', auth);
app.use('/api/v1/users', users);
app.use('/api/v1/reviews', reviews);

// Mount errors
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, console.log(`Server is running in ${process.env.NODE_ENV} made on port ${PORT}`.yellow.bold));

// Handle unhandle promise rejection
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`.red);
    //  Close Server & exit process
    server.close(() => process.exit(1));
});
