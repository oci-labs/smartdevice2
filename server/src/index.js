// @flow

const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');
const healthCheck = require('express-healthcheck');
const morgan = require('morgan');

const {typeService} = require('./type-service');

const app = express();

// Parse JSON request bodies to JavaScript objects.
app.use(bodyParser.json());

// Parse text request bodies to JavaScript strings.
app.use(bodyParser.text());

// Enable cross-origin resource sharing for localhost origins.
const corsOptions = {};
//  origin: ['http://localhost:3000', 'http://localhost:8084'],
//  credentials: true
//};
app.use(cors(corsOptions));

// We aren't currently using the generate ETags, but if we ever do,
// we probably don't want the default of "weak".
app.set('etag', 'strong');

//const healthCheckPath = /^\/$/;

typeService(app);

// Logging
// The provided options are combined, common, dev, short, and tiny.
// For more details, browse https://github.com/expressjs/morgan.
app.use(morgan('dev'));
app.use(/^\/$/, healthCheck());

const PORT = 3001; //process.argv.pop();
app.listen(PORT, () => console.info('listening on', PORT));
