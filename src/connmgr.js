let app = require('./app');
var service = require('./service.js');


// CONSTANTS

let lr = 'Login Requests';
let vr = 'Vid Requests';
let fr = 'Film Data Requests';
let mdr = 'Multi-Data Requests';

var randstr = () =>  Math.random().toString(36).substring(2, 8) + Math.random().toString(36).substring(2, 8);


// FUNCTIONS

function LoginConnectionMgr(conn, email, pass, callback) {
	// create login session
      let session_id = randstr();
      console.log('New Session: ' + session_id);
      // create partial listeners
      let partials = {
        launchedPage: session_id + '-launch',
        loggedIn: session_id + '-login',
        findingDirectory: session_id + '-dir',
        done: session_id + '-done'
      };
      // listen for updates to login request
      service.listenEventWithId(lr, partials.launchedPage, () => {
        // console.log('LC Sending partial data (1)');
        if (conn)
        	conn.send(JSON.stringify({status: 25, data: null}));
      })
      service.listenEventWithId(lr, partials.loggedIn, () => {
        // console.log('LC Sending partial data (2)');
        if (conn)
        	conn.send(JSON.stringify({status: 50, data: null}));
      })
      service.listenEventWithId(lr, partials.findingDirectory, () => {
        // console.log('LC Sending partial data (3)');
        if (conn)
        	conn.send(JSON.stringify({status: 75, data: null}));
      })
      service.listenEventWithId(lr, partials.done, (data) => {
        console.log('LC Sending full data ' /*JSON.stringify({status: 100, data: data})*/);
        if (conn)
        	conn.send(JSON.stringify({status: 100, data: data}));
      })

      app.newsession(email, pass, partials, session_id).then((data) => {
        console.log('Complete.');
        // let listeners = service.getListeners(lr);
      // console.log('We have ' + listeners.length + 'listeners of Log. Req : ');
        // hopefully this doesn't F things up -> May F up event's existence
        service.unlistenEvent(lr, partials.launchedPage);
        service.unlistenEvent(lr, partials.loggedIn);
        service.unlistenEvent(lr, partials.findingDirectory);
        service.unlistenEvent(lr, partials.done);
        if (callback)
        	callback(data ? data.session : null, data);
      });
}

function VidConnectionMgr(conn, session_id, dir_list, callback) {
	// create partial listeners
	  let partials = {
	    launchedPage: session_id + '-launchvid',
	    expandedDirectory: session_id + '-expdir',
	    done: session_id + '-donevid'
	  };
	  // listen for updates to login request
	  service.listenEventWithId(vr, partials.launchedPage, () => {
	  	// console.log('VC Sending partial data (1)');
	    if (conn)
	    	conn.send(JSON.stringify({status: 33, data: null}));
	  })
	  service.listenEventWithId(vr, partials.expandedDirectory, () => {
	  	// console.log('VC Sending partial data (2)');
	    if (conn)
	    	conn.send(JSON.stringify({status: 67, data: null}));
	  })
	  service.listenEventWithId(vr, partials.done, (data) => {
	    console.log('VC Sending final data : ' + JSON.stringify({status: 100, data: data}));
	    if (conn)
	    	conn.send(JSON.stringify({status: 100, data: data}));
	  })

	  app.videooptions(session_id, dir_list, partials).then((video_options) => {
	    console.log('VC Complete.')
	    service.unlistenEvent(vr, partials.launchedPage);
	    service.unlistenEvent(vr, partials.expandedDirectory);
	    service.unlistenEvent(vr, partials.done);
	    if (callback)
	    	callback(video_options);
	  });
}

function MultiDataConnectionMgr(conn, session_id, dir_lists, callback) {
  console.log("New Multi-Data connection created.");
  console.log('   {')
  console.log('      Session: ' + session_id);
  console.log('      Dir Lists ' + dir_lists.map((list) => list.toString() + ' '));
  console.log('   }')

	// create partial listeners
    let partials = {
      nextdone: session_id + '-nd',
      done: session_id + '-donemdr'
    };

    let numlists = dir_lists.length;
    var cur = 0;
    service.listenEventWithId(mdr, partials.nextdone, (data) => {
        cur++;
        console.log('Sending partial data: ');
        console.log(data);
        let perc = (cur/numlists) * 100;
      if (conn)
	    	conn.send(JSON.stringify({status: perc, data: data}));
    })
    service.listenEventWithId(mdr, partials.done, (data) => {
      if (conn)
	    	conn.send(JSON.stringify({status: 100, combineddata: data})); // Contains {data: .., headers: ..}
        console.log('MDR Complete.')
        service.unlistenEvent(mdr, partials.nextdone);
        service.unlistenEvent(mdr, partials.done);
        if (callback)
        	callback(data);
    })
    app.filmdata(session_id, dir_lists, partials);
}


function FilmDataConnectionMgr(conn, session_id, checkbox_element_id, callback) {
	// create partial listeners
    let partials = {
      launchedPage: session_id + '-launchgd',
      loadedFilm: session_id + '-expdirgd',
      done: session_id + '-donegd'
    };
    // listen for updates to login request
    service.listenEventWithId(fr, partials.launchedPage, () => {
	  // console.log('FC Sending partial data (1)');
      if (conn)
	    	conn.send(JSON.stringify({status: 33, data: null}));
    })
    service.listenEventWithId(fr, partials.loadedFilm, () => {
    	// console.log('FC Sending partial data (2)');
      if (conn)
	    	conn.send(JSON.stringify({status: 67, data: null}));
    })
    service.listenEventWithId(fr, partials.done, (data) => {
      // console.log('FC Sending full data : ' + JSON.stringify(data));
      if (conn)
	    	conn.send(JSON.stringify({status: 100, data: data}));
    })

    app.snagdata(session_id, checkbox_element_id, partials).then((data) => {
      console.log('FC Complete.')
      service.unlistenEvent(fr, partials.launchedPage);
      service.unlistenEvent(fr, partials.loadedFilm);
      service.unlistenEvent(fr, partials.done);
      if (callback)
      	callback(data);
    });
}




module.exports = {
	LoginConnectionMgr: LoginConnectionMgr,
	VidConnectionMgr: VidConnectionMgr,
	FilmDataConnectionMgr: FilmDataConnectionMgr,
    MultiDataConnectionMgr: MultiDataConnectionMgr
}
