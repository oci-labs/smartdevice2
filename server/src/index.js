// @flow

import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import healthCheck from 'express-healthcheck';
import morgan from 'morgan';
import WebSocket from 'ws';

import {alertService} from './alert-service';
import crudService from './crud-service';
import {enumService} from './enum-service';
import {instanceService} from './instance-service';
import {exportService} from './json-export';
import {importService} from './json-import';
import {messageServerService} from './message-server-service';
import {mqttService} from './mqtt-service';
import {openddsService} from './opendds-service';
import {treeService} from './tree-service';
import {typeService} from './type-service';

const app = express();

app.use('/', express.static('public'));

// Parse JSON request bodGies to JavaScript objects.
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

const wsServer = new WebSocket.Server({port: process.env.WS_PORT || 1337});

alertService(app);
enumService(app);
instanceService(app);
messageServerService(app);
mqttService(app, wsServer);
openddsService(app, wsServer);
treeService(app);
typeService(app);
crudService(app, 'alert');
crudService(app, 'alert_type');
crudService(app, 'enum');
crudService(app, 'enum_member');
crudService(app, 'instance');
crudService(app, 'instance_data');
crudService(app, 'message_server');
crudService(app, 'snooze');
crudService(app, 'subscription');
crudService(app, 'type');
crudService(app, 'type_data');
crudService(app, 'user');
exportService(app);
importService(app);

// Logging
// The provided options are combined, common, dev, short, and tiny.
// For more details, browse https://github.com/expressjs/morgan.
app.use(morgan('dev'));
app.use(/^\/$/, healthCheck());

const HOST = '0.0.0.0';
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001; //process.argv.pop();
app.listen(PORT, HOST, () => console.info('listening on', PORT));
