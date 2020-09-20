let chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var logging = require('../src/logging');
var app = require('../src/app');
var connmgr = require('../src/connmgr');
var service = require('../src/service');

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

let EMAILVAL = '***REMOVED***';
let PASSVAL = '***REMOVED***';

class FauxConnection {
	constructor() {
		this.count = 0;
		this.data = null;
	}
	send(data) {
		this.count++;
		this.data = data;
	}
	messagesSent() { return this.count;  }
	data() { return this.data; }
}

// Sample Directories for testing
let Directories_Samples = [
	[0,4,0],   // SHOULD WORK    -> 2019-2020, Endicott College, Game Footage
	[2,1,0],   // SHOULD WORK, BUT ZERO RESULTS
  [0,3,0],   // SHOULD WORK    -> SHOULD WORK,  FAILS ON BROWSER
	[3,1,20],   // SHOULD FAIL
	[3,20,20],   // SHOULD FAIL
	[20,20,20],   // SHOULD FAIL
];
let Directories_Samples_RANDOM_CHILDREN = [
	'cutup_43289610',  // UR D vs. EC O
	null,   // EMPTY
	'cutup_42955351',   // SHOULD WORK
	null,   // SHOULD FAIL
	null,   // SHOULD FAIL
];

function Sample(i) {
	return JSON.parse(JSON.stringify(Directories_Samples[i]));
}

function exp(test_value) {
   	expect(test_value).to.be.true;
}





describe('Multi-Data Request Test Suite', async () => {

	var session_id = null;
	var folder_data = null;                                                                                                                                   log('\n');

    it('logs the user in / Retrieves Directories', async () => {
        return new Promise(async (resolve, reject) => {
        	let conn = new FauxConnection();

        	connmgr.LoginConnectionMgr(conn, EMAILVAL, PASSVAL, (_session_id, _data) => {
        		exp(conn.messagesSent() === 4);
        		session_id = _session_id;
        		folder_data = _data;
        		resolve(null);
        	})


   	})}).timeout(0);

   	var data = null;

	let dirs = [
		[1,3,0,3],
		[1,4,0,3]
		];                                                                                                                                 log('\n');

   	it('clicks through selected directories, retrieves all film data', async () => {
        return new Promise(async (resolve, reject) => {
        	exp(session_id !== null);
        	let conn = new FauxConnection();

        	connmgr.MultiDataConnectionMgr(conn, session_id, dirs, (combineddata) => {
        		exp(conn.messagesSent() === 3);
        		// console.log('Test.js got back filmdata: \n' + _filmdata);
        		// will be stringified JSON so this is a soft check
        		exp(combineddata && combineddata.data /* data */ && combineddata.headers /* headers */ && combineddata.data.length > 20);
        		data = combineddata.data;
            	resolve(null);
        	})

   	})}).timeout(0);

})



// describe('FAILED Multi-Data Request Test Suite', async () => {

// 	var session_id = null;
// 	var folder_data = null;                                                                                                                                   log('\n');

//     it('logs the user in / Retrieves Directories', async () => {
//         return new Promise(async (resolve, reject) => {
//         	let conn = new FauxConnection();

//         	connmgr.LoginConnectionMgr(conn, EMAILVAL, PASSVAL, (_session_id, _data) => {
//         		exp(conn.messagesSent() === 4);
//         		session_id = _session_id;
//         		folder_data = _data;
//         		resolve(null);
//         	})


//    	})}).timeout(0);

//    	var data = null;

// 	let dirs = [
// 		[1,14,1,2],
// 		[1,14,1,3]
// 		];                                                                                                                                 log('\n');

//    	it('clicks through selected directories, retrieves all film data', async () => {
//         return new Promise(async (resolve, reject) => {
//         	exp(session_id !== null);
//         	let conn = new FauxConnection();

//         	connmgr.MultiDataConnectionMgr(conn, session_id, dirs, (combineddata) => {
//         		exp(conn.messagesSent() === 3);
//         		// console.log('Test.js got back filmdata: \n' + _filmdata);
//         		// will be stringified JSON so this is a soft check
//         		exp(combineddata && combineddata.data /* data */ && combineddata.headers /* headers */ && combineddata.data.length > 20);
//         		data = combineddata.data;
//             	resolve(null);
//         	})

//    	})}).timeout(0);

// })

















// describe('Test Suite - 0 results on browser', async () => {
//
//   var session_id = null;
//   var folder_data = null;                                                                                                                                   log('\n');
//
//     it('logs the user in / Retrieves Directories', async () => {
//         return new Promise(async (resolve, reject) => {
//           let conn = new FauxConnection();
//
//           connmgr.LoginConnectionMgr(conn, EMAILVAL, PASSVAL, (_session_id, _data) => {
//             exp(conn.messagesSent() === 4);
//             session_id = _session_id;
//             folder_data = _data;
//             resolve(null);
//           })
//
//
//     })}).timeout(0);
//
//     var video_options = null;                                                                                                                                   log('\n');
//
//     it('clicks through selected directories, finds video if it exists', async () => {
//         return new Promise(async (resolve, reject) => {
//           exp(session_id !== null);
//           let conn = new FauxConnection();
//
//           connmgr.VidConnectionMgr(conn, session_id, Sample(2), (_video_options) => {
//             exp(conn.messagesSent() === 3);
//             // will be stringified JSON so this is a soft check
//             exp(_video_options !== null && _video_options.length > 0);
//             video_options = _video_options;
//               resolve(null);
//           })
//
//
//     })}).timeout(0);
//
//     var filmdata = null;
//
//
//     it('gets the requested video\'s data', async () => {
//         return new Promise(async (resolve, reject) => {
//
//
//           exp(video_options !== null && video_options.length > 0);
//           let conn = new FauxConnection();
//
//           let vid = Directories_Samples_RANDOM_CHILDREN[2];
//
//           connmgr.FilmDataConnectionMgr(conn, session_id, vid, (_filmdata) => {
//             exp(conn.messagesSent() === 3);
//             // will be stringified JSON so this is a soft check
//             exp(_filmdata !== null && Object.keys(_filmdata.data).length > 0);
//             console.log('Film Data: ' + JSON.stringify(_filmdata.data));
//             filmdata = _filmdata;
//               resolve(null);
//           })
//
//     })}).timeout(0);
//
// })

// describe('Perfect Run Test Suite', async () => {

// 	var session_id = null;
// 	var folder_data = null;                                                                                                                                   log('\n');

//     it('logs the user in / Retrieves Directories', async () => {
//         return new Promise(async (resolve, reject) => {
//         	let conn = new FauxConnection();

//         	connmgr.LoginConnectionMgr(conn, EMAILVAL, PASSVAL, (_session_id, _data) => {
//         		exp(conn.messagesSent() === 4);
//         		session_id = _session_id;
//         		folder_data = _data;
//         		resolve(null);
//         	})


//    	})}).timeout(0);

//    	var video_options = null;                                                                                                                                   log('\n');

//    	it('clicks through selected directories, finds video if it exists', async () => {
//         return new Promise(async (resolve, reject) => {
//         	exp(session_id !== null);
//         	let conn = new FauxConnection();

//         	connmgr.VidConnectionMgr(conn, session_id, Sample(0), (_video_options) => {
//         		exp(conn.messagesSent() === 3);
//         		// will be stringified JSON so this is a soft check
//         		exp(_video_options !== null && _video_options.length > 0);
//         		video_options = _video_options;
//             	resolve(null);
//         	})


//    	})}).timeout(0);

//    	var filmdata = null;


//    	it('gets the requested video\'s data', async () => {
//         return new Promise(async (resolve, reject) => {


//         	exp(video_options !== null && video_options.length > 0);
//         	let conn = new FauxConnection();

//         	let vid = Directories_Samples_RANDOM_CHILDREN[0];

//         	connmgr.FilmDataConnectionMgr(conn, session_id, vid, (_filmdata) => {
//         		exp(conn.messagesSent() === 3);
//         		// will be stringified JSON so this is a soft check
//         		exp(_filmdata !== null && Object.keys(_filmdata.data).length > 0);
//         		console.log('Film Data: ' + JSON.stringify(_filmdata.data));
//         		filmdata = _filmdata;
//             	resolve(null);
//         	})

//    	})}).timeout(0);

// })

// describe('Bad Info Run Test Suite', async () => {

// 	var session_id = null;
// 	var folder_data = null;                                                                                                                                   log('\n');

//     it('can handle bad login info', async () => {
//         return new Promise(async (resolve, reject) => {
//         	let conn = new FauxConnection();

//         	connmgr.LoginConnectionMgr(conn, EMAILVAL + 'xx', PASSVAL + 'xx', (_session_id, _data) => {
//         		exp(conn.messagesSent() === 1);
//         		resolve(null);
//         })


//    	})}).timeout(0);

//    	// Reset to good info

//    	it('logs the user in / retrieves directories', async () => {
//         return new Promise(async (resolve, reject) => {
//         	let conn = new FauxConnection();

//         	connmgr.LoginConnectionMgr(conn, EMAILVAL, PASSVAL, (_session_id, _data) => {
//         		exp(conn.messagesSent() === 4);
//         		session_id = _session_id;
//         		folder_data = _data;
//         		resolve(null);
//         	})

//    	})}).timeout(0);

//    	var video_options = null;                                                                                                                                   log('\n');

//    	it('queries a dead-end folder videos -> doesnt fail', async () => {
//         return new Promise(async (resolve, reject) => {
//         	exp(session_id !== null);
//         	let conn = new FauxConnection();

//         	connmgr.VidConnectionMgr(conn, session_id, Sample(1), (_video_options) => {
//         		exp(conn.messagesSent() === 3);
//         		// will be stringified JSON so this is a soft check
//         		exp(_video_options !== null);
//         		video_options = _video_options;
//             	resolve(null);
//         	})

//    	})}).timeout(0);

//    	it('clicks through selected directories, finds video if it exists', async () => {
// 		return new Promise(async (resolve, reject) => {
// 			exp(session_id !== null);
// 			let conn = new FauxConnection();

// 			connmgr.VidConnectionMgr(conn, session_id, Sample(0), (_video_options) => {
// 				exp(conn.messagesSent() === 3);
// 				// will be stringified JSON so this is a soft check
// 				exp(_video_options !== null && _video_options.length > 0);
// 				video_options = _video_options;
// 		    	resolve(null);
// 			})

//    		})}).timeout(0);

//    	var filmdata = null;


//    	it('doesnt break when given an invalid video id', async () => {
//         return new Promise(async (resolve, reject) => {

//         	// important because need to recursively click
//         	exp(video_options !== null && video_options.length > 0);

//         	let conn = new FauxConnection();

//         	let vid = 'sample-not-correct-id';

//         	connmgr.FilmDataConnectionMgr(conn, session_id, vid, (_filmdata) => {
//         		exp(conn.messagesSent() === 2);
//         		// will be stringified JSON so this is a soft check
//         		exp(_filmdata !== null);
//         		filmdata = _filmdata;
//             	resolve(null);
//         	})

//    	})}).timeout(0);

// })

// describe('Service Test Suite', () => {
// 	it('performs service events without error.', () => {
// 		service.createEvent('test');
// 		service.listenEvent('test', () => {});
// 		service.getListeners('test');
// 		service.unlistenEvent_All('test');
// 		exp(true);
// 	})
// })

// describe('Log Test Suite', () => {
// 	it('performs log events without error.', () => {
// 		var people = [["John", "Smith"], ["Jane", "Doe"], ["Emily", "Jones"]]
// 		table_log(people);
// 		log(people);
// 		exp(true);
// 	})
// })
