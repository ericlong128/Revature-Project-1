const express = require('express');
const app = express();
const userController = require('./controllers/userController');
const requestController = require('./controllers/ticketController');
const logger = require('./util/logger');

const PORT = process.env.PORT || 3000;

function loggerMiddleware(req, res, next){
    logger.info(`Incoming ${req.method} : ${req.url}`);
    next();
}

app.use(express.json());
app.use(loggerMiddleware);

app.use('/users', userController);
app.use('/tickets', requestController);

app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`)
});