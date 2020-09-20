// Node.js WebSocket server script
const http = require('http');
const WebSocketServer = require('websocket').server;
var URL = require('url');
var service = require('./service.js');
var app = require('./app.js');
var connmgr = require('./connmgr');
var logging = require('./logging');
const server = http.createServer();
const PORT = process.env.PORT || 9797;
server.listen(PORT);
console.log('Listening on port ' + PORT)
const wsServer = new WebSocketServer({
    httpServer: server
});


var log = logging.log;
var err_log = logging.err_log;
var ok_log = logging.ok_log;
var table_log = logging.table_log;
var group_begin = logging.log_group_begin;
var group_end = logging.log_group_end;
var prettify = logging.prettify;

let lr = 'Login Requests';
let vr = 'Vid Requests';
let fr = 'Film Data Requests';
let mdr = 'Multi-Data Requests';
service.createEvent(lr);
service.createEvent(vr);
service.createEvent(fr);
service.createEvent(mdr);

let TKN_1 = ',';
let TKN_2 = '\n';
let TKN_3 = '###';


// User wants to connect to HUDL
function new_LoginConnection(request) {
    const connection = request.accept(null, request.origin);
    connection.on('message', function(message) {
      var req_json = JSON.parse(message.utf8Data);
      let email = req_json.email;
      let pass = req_json.password;
      ok_log('New login request with \n\tEmail: ' + email + '\n\tPass: ' + pass);
      // process new login request.
      connmgr.LoginConnectionMgr(connection, email, pass);
    });
    connection.on('close', function(reasonCode, description) {
        ok_log('Login request has disconnected.');
    });
}

// User wants to get film data from hudl.
function new_MultiDataRequest(request) {
    const connection = request.accept(null, request.origin);
    connection.on('message', function(message) {
      var req_json = JSON.parse(message.utf8Data);
      let session_id = req_json.session_id;
      let list_of_dir_lists = req_json.dir_lists.split(TKN_2);
      let parsed_lists = list_of_dir_lists.map(function(list) {
          return list.split(TKN_1).map((item) => {
              return parseInt(item, 10);
          })
      });
      ok_log('New Multi-Data request with \n\tSession: ' + session_id + '\n\tDir. Lists: ' + parsed_lists.map((item) => item.toString()));
      connmgr.MultiDataConnectionMgr(connection, session_id, parsed_lists);
      // process new login request.
    });
    connection.on('close', function(reasonCode, description) {
        ok_log('Vid Options request has disconnected.');
    });
}

// User wants to get film data from hudl.
function new_GetVidConnection(request) {
    const connection = request.accept(null, request.origin);
    connection.on('message', function(message) {
      var req_json = JSON.parse(message.utf8Data);
      let session_id = req_json.session_id;
      let dir_list = req_json.dir_list.split(TKN_1).map(function(item) {
          return parseInt(item, 10);
      });;
      ok_log('New vid option request with \n\tSession: ' + session_id + '\n\tDir. List: ' + dir_list);
      connmgr.VidConnectionMgr(connection, session_id, dir_list);
      // process new login request.
    });
    connection.on('close', function(reasonCode, description) {
        ok_log('Vid Options request has disconnected.');
    });
}

// user wants to request a film's data
function new_GetFilmDataConnection(request) {
  const connection = request.accept(null, request.origin);
  connection.on('message', function(message) {
    var req_json = JSON.parse(message.utf8Data);
    let session_id = req_json.session_id;
    let checkbox_element_id = req_json.checkbox_element_id;
    ok_log('New film data request with \n\tSession: ' + session_id + '\n\tFilm El. ID: ' + checkbox_element_id);
    connmgr.FilmDataConnectionMgr(connection, session_id, checkbox_element_id);

    // process new login request.
  });
  connection.on('close', function(reasonCode, description) {
      ok_log('Get film data request has disconnected.');
  });
}

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

// check origin
var originIsOk = (origin) => true;

wsServer.on('request', function(request) {

    if (!originIsOk(request.origin)) {
      request.reject('Invalid Origin.');
    }

    const path = URL.parse(request.resource).pathname;

    console.log('New Request.');

    if (path === '/') {
        const connection = request.accept(null, request.origin);
        console.log("received connection.");
        connection.send(JSON.stringify({status: 200, data: 'Hello!'}));
    }
    else if (path === '/login')
        new_LoginConnection(request)
    else if (path === '/videooptions')
        new_GetVidConnection(request)
    else if (path === '/filmdata')
        new_GetFilmDataConnection(request)
    else if (path === '/multidata')
        new_MultiDataRequest(request)
    else request.reject('Invalid Path.');
});
