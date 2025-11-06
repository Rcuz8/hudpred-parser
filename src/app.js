var http = require("http");
// var express = require('express');
var axios = require("axios").default;
var util = require('util');
const cheerio = require("cheerio");
const puppeteer = require('puppeteer');
const indentString = require('indent-string');
var logging = require('./logging');


// var app = express();
var fs = require('fs');
var service = require('./service.js');

var log = logging.log;
var err_log = logging.err_log;
var ok_log = logging.ok_log;
var table_log = logging.table_log;
var group_begin = logging.log_group_begin;
var group_end = logging.log_group_end;
var prettify = logging.prettify;
 

// /*  SETUP  */
// app.use(function(req, res, next) {
//   res.header('Access-Control-Allow-Origin', 'localhost');
//   res.header('Access-Control-Allow-Credentials', true);
//   res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
//   next();
// });
axios.defaults.withCredentials = true;
Object.prototype.print = function(indent=0) {
  console.log(indentString(util.inspect(this), indent, {indent: '  '}) );
};
Object.prototype.shortprint = function() {
  console.log(JSON.stringify(this, null, 3));
};
String.prototype.print = function(indent=0) {
  console.log(indentString(this.toString(), indent, {indent: '  '}));
};
Number.prototype.print = function() {
  console.log(this);
};

let TKN_1 = ',';
let TKN_2 = '\n';
let TKN_3 = '###';


var randstr = () =>  Math.random().toString(36).substring(2, 6) + Math.random().toString(36).substring(2, 8);


/* CORE - RECURSION HANDLING  */

function boxList(element, $) {
    let list = {};

    var empty = true;
    let notret = $(element).find('input[type="checkbox"]').map((i, elem) => {
        let id = $(elem).attr('id');
        empty = false;
        return null; // take out .text later
    });
    if (empty) return null;
    // console.log("PAARENT:: ");
    let ret = $(element).parent().find('input[type="checkbox"]').map((i, elem) => {
        // let id = $(elem).attr('id');
        let id = $(elem).next().next().text();
        // console.log('name=' + id);
        list['leaf_' + randstr()] = {id: id, isLeaf: true};
        return id; // take out .text later
    });

    return list;
}

/* ID SHOUOLD WORK AS ELEMENT - NOT SURE THO */
var checkboxes_list = (element, $, depth=0) => {
  let list = [];
  // functions
  var branches = (el) => $($(el).children()[1]).children()
  if ($(element) === null || $(element).children().length <= 1) return '';
  let current_branches = branches(element);
  if (current_branches.length > 0) {
    current_branches.map((i, branch) => {
      list.push(JSON.stringify({id: $(branch).attr('id'), text: $(branch).find('.name').text() }));
    });
  }
  return list;

}

var checkboxes = (element, $, depth=0) => {
  // let list = [];
  let list = '';
  // console.log('Getting checkboxes for ' + $(element).text())
  // functions
  var branches = (el) => $($(el).children()[1]).children()
  if ($(element) === null || $(element).children().length <= 1) return '';
  let current_branches = branches(element);
  if (current_branches.length > 0) {
    current_branches.map((i, branch) => {
      list += (JSON.stringify({id: $(branch).attr('id'), text: $(branch).find('.name').text() })) + TKN_2;
    });
  }
  if (list.length > TKN_2.length)
    list = list.slice(0, -(TKN_2.length));
  return list;

}

var picknpop = (parent, element, $, depth=0) => {
  // functions
  var nameOf = (el) => $($(el).children()[0]).find('.category-name').text() || $($(el).children()[0]).find('.event-name').text()
  var branches = (el) => $($(el).children()[1]).children()
  // TODO
  let name = nameOf(element);
  if (name !== '')
    parent[name] = {};
  let current_branches = branches(element);
  if (current_branches.length > 0) {
    current_branches.map((i, branch) => {
      if (name.length > 0)
        picknpop(parent[name], branch, $, depth+1);
      else
        picknpop(parent, branch, $, depth+1);
    });
  } else {
      // console.log('\n -- Start Cuzzo data   -- ')
      // console.log('\nEnd recursion, Elem text = ' + $(element).text() + ' Box list: ');
      let boxlist = boxList(element, $);
      // if (name === '')
      //   parent = boxlist;
      // else
      if (boxlist) {
        parent[name] = boxlist;
      }
      else if (name.length > 0) {
        // TRIM ALERT - BEGIN TRIM 
        // parent[name] = null;
        // TRIM ALERT - END TRIM 

      }
      // console.log('\nParent box list: ');
      // let parentboxlist = boxList($(element).parent(), $);
      // console.log('\n -- End Cuzzo data   -- ')
  }

}



var find_FromIndexList = (dirs, element, $, d=0) => {

  // functions
  var branches = (el) => $($(el).children()[1]).children()
  // TODO
  if (dirs.length === 0) {
    return element;
  }
  let next = dirs.pop();
  if (next > branches(element).length ) return null;
  let next_el = branches(element).get(next);
  return find_FromIndexList(dirs, next_el, $, d+1);
}

function list_sift(list, $) {
  let i_list = list.reverse();
  let first_folder = i_list.pop();
  let res = null;
  $('#tree').children().map(function(i, el) {
    if (i == first_folder) {
      res = find_FromIndexList(i_list,el, $);
    }
    return null;
  });
  return res;
}


function trimbranches(prev, jsonKey) {
  if (jsonKey === 'isLeaf') return;
  if (jsonKey === 'id') return;
  let json = prev[jsonKey];
  if (!prev || !prev[jsonKey]) return;
  // TRIM ALERT - BEGIN TRIM 
  // REMOVE UNUSED BRANCHES
  // if (Array.isArray(json) && json.length === 0) {
  //   delete prev[jsonKey];
  //   if (Object.keys(prev).length === 0)
  //     delete prev;
  // }
  // TRIM ALERT - END TRIM 
  let keys = Object.keys(json);
  if (keys.length === 0) return;
  if (keys.length === 1 && keys[0] === '') {
    // console.log(json);
    let to = json[keys[0]];
    // console.log(to);
    prev[jsonKey] = to;
  }
  keys.forEach((key) => trimbranches(json, key));
}

const removeEmpty = (obj) => {
  Object.keys(obj).forEach(k =>
    (obj[k] && typeof obj[k] === 'object') && removeEmpty(obj[k]) ||
    (!obj[k] && obj[k] !== undefined) && delete obj[k]
  );
  return obj;
};

function trim(json) {
  // TRIM ALERT - BEGIN TRIM
  // json = removeEmpty(json);
  // TRIM ALERT - END TRIM 
  let refkey = 'x';
  let refactored_json = {};
  refactored_json[refkey] = json;
  trimbranches(refactored_json,refkey);
}

function getDirectory(html) {
  const $ = cheerio.load(html);
  let json = {};
  $('#tree').children().map(function(i, el) {
    picknpop(json,el, $, 0);
    return null;
  });

  trim(json); // trim out '' branches -> push them upwards 1 level

  // console.log('Post-trim json: ');
  // console.log(json);
  return json;
}

const mx_str = (mx) => {
  return mx.map(row => row.toString()).join('\n')
}

async function table_data($, page, csv_rows, str_rows, depth) {
  console.log('Enter Table Data function.')
    if (csv_rows == null)
      csv_rows = []
    if (str_rows == null)
      str_rows = ''
    if (depth == null)
      depth = 1
 // get headers
    let header_table = $('#clipsHeader').get(0);
    let rows = $(header_table).find('span');
    console.log('rows size is now: ' + rows.length);
    var headers = [];
    rows.map((i, row) => {
        let text = $(row).text();
        headers.push(text);
    });
    // console.log('headers are now: ' + headers);
    console.log('We now have n headers: ' + headers.length);

    let MAX_TRIES = 7;
    let N = 0;

  // get data
    let data_table = $('#clipsTable').find('tbody');
    let TABLE_STR = JSON.stringify($(data_table).html());


    while (TABLE_STR.length < 40 && N < MAX_TRIES) {
        await page.waitFor(400); // let document load
        let content = await page.content();
            // setup parser
        $ = cheerio.load(content);
        data_table = $('#clipsTable').find('tbody');
        TABLE_STR = JSON.stringify($(data_table).html());
        N++;
    }

    let data_rows = $(data_table).find('tr');
        // console.log('table ok ? ' + $('#clipsTable').text());
    // console.log('tbody ok ? ' + $(data_table).find('tbody').text());
    // console.log('tr ok ? ' + $($(data_table).find('tbody').get(0)).find('tr'));
    console.log('this translates to ' + data_rows.length + ' data rows');

    var resursive_return = false; // whether or not we're doing through another iteration of returns (more than 100 rows of data)

    let iterable_data_rows = []
    // Fill in rows
    data_rows.map(async (i, row) => { 
        iterable_data_rows.push(row);
    })

    console.log(iterable_data_rows.length + ' iterable data rows.')
    var k = -1
    let done_mapping = await Promise.all(iterable_data_rows.map(async (row) => {
      k++;
      // console.log(i + ': ' + $(row).find('td').length )
      let columns_unformatted = $(row).find('td[class=" "]'); // class=' '
      // console.log('for row ' + i + ' founs ' + columns_unformatted.length + ' columns');
      var columns = [];

      columns_unformatted.map((i, col) => {
          var value = $(col).text();
          value = value.split(',').join('&').trim();
          columns.push(value);
      });

      if (columns.length !== 19)
        console.error('Incorrect data length!!!')

      csv_rows.push(columns);

      if (k == 99) {
        console.log('Data has more than 100 rows..')


        const plays = await page.$$('[class="play "]')

        await plays[99].click()

                    await page.waitFor(200); // let document load


        const nextels = await page.$$('[id="icon-video-next-a"]')

        const clickable_next = nextels[1];

        /* Click NEXT x 2 */
        await clickable_next.click();
        await clickable_next.click();
        await clickable_next.click();

        /* Click PAUSE */
        await page.waitFor('#play-button');
        for (var i = 1; i < 11; i++) {
            await page.waitFor(100); // let document load
            try {
              await page.click('#play-button');
              break;
            } catch (e) {}
        }
        console.log('App.js table_data() Clicked (3/3)')
        await page.waitFor(400);
        let content = await page.content();
        // setup parser
        $ = cheerio.load(content);

        // await page.screenshot({path: 'screenshot'+depth+'.png', fullPage: true});

        resursive_return = true;
        return 'ok';
      }
      return 'ok';
    }));

    if (resursive_return) {
      console.log('Recursive Return = TRUE. Moving inward.')
      return table_data($, page, csv_rows, str_rows, depth+1);
    }


    // console.log('Generated CSV Data: ');
    // csv_rows.forEach((row) => {
    //   console.log(row.toString())
    // });

    str_rows = mx_str(csv_rows)
    console.log('Generated Str (CSV) Data: ');
    console.log(str_rows)


    let result = {headers: headers, data: str_rows};

    return result;
}




/* APP SETUP */

let loginurl = "https://www.hudl.com/login";
let libraryurl = "https://www.hudl.com/library";

var randstr = () =>  Math.random().toString(36).substring(2, 8) + Math.random().toString(36).substring(2, 8);

var sessions = {};

let lr = 'Login Requests';
let vr = 'Vid Requests';
let fr = 'Film Data Requests';
let mdr = 'Multi-Data Requests';

// promise-wrap trigger fire to prevent non-async leakage
async function trigger(ev, id, data) {
  return new Promise(async (resolve, reject) => {
      await service.promiseWrappedTrigger(ev, id, data);
      // console.log('Firing promise-wrapped trigger with the following info:')
      // console.log('\tEvent: ' + ev);
      // console.log('\tid: ' + id);
      // console.log('\tdata: ' + data);
      resolve(null);
  });
}

var browser = null;

async function init() {
  return new Promise(async (res,rej) => {
//  browser = await puppeteer.launch({
//     headless: true,
//     executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
//   })
//  res('ok');
// })   

 browser = await puppeteer.launch(
    {args: [
        '--incognito',
      ]
    });
     res('ok');
  })
}

{async () => await init()}


/* CORE - PUBLIC FUNCTIONS */

/* Create a new HUDL session with
  Username: user
  Password: pass

  Update client via 'updates' with process status updates

  */

async function verify_user(user,pass) {
    let data = {"username": user,
     "password": pass,
     "rememberMe": false,
     "forward": "",
     "schoolId": "",
     "timezoneOffset": 240,
    };
    return new Promise(async (res, rej) => {
      let resp = await axios.post(loginurl, data, { headers: {} });
      if (resp.data.success === false) rej( 'Invalid login info.');
      ok_log('User verified. ')
      res(resp.data);
    })
}

const stringifyJSON = data => {
  if (data === undefined)
    return undefined
  else if (data === null)
    return 'null'
  else if (data.constructor === String)
    return '"' + data.replace(/"/g, '\\"') + '"'
  else if (data.constructor === Number)
    return String(data)
  else if (data.constructor === Boolean)
    return data ? 'true' : 'false'
  else if (data.constructor === Array)
    return '[ ' + data.reduce((acc, v) => {
      if (v === undefined)
        return [...acc, 'null']
      else
        return [...acc, stringifyJSON(v)]
    }, []).join(', ') + ' ]'
  else if (data.constructor === Object)
    return '{ ' + Object.keys(data).reduce((acc, k) => {
      if (data[k] === undefined)
        return acc
      else
        return [...acc, stringifyJSON(k) + ':' + stringifyJSON(data[k])]
    }, []).join(', ') + ' }'
  else
    return '{}'
}

async function newsession(user, pass, updates, session) {
  group_begin('New Session');
  console.log('Browser is running : ' + browser != null);
  console.log(browser)
  try {
    await verify_user(user,pass);
  } catch (e) {
      await trigger(lr, updates.done, {}); // bad info
      err_log('Invalid user login credentials.');
      group_end();
      return {};
  }
  var page = null;
  try {
      await browser.close()
      await init()
      page = await browser.newPage();
  } catch (e) {
    await init();
    page = await browser.newPage();
  }
   
  await trigger(lr, updates.launchedPage, null);
  ok_log('new page loaded.');
  await page.goto(loginurl);
  await page.type('#email', user);
  await page.type('#password', pass);
  await page.click('#logIn');
  await page.waitForNavigation();
  await trigger(lr, updates.loggedIn, null);
  ok_log('logged in.');
  await page.goto(libraryurl);

  //TODO: WAIT FOR CHECKBOXES
  let boxes = await findboxes(page);
  if (boxes === 'bad') throw '(newsession error) Couldnt locate checkboxes -> Maybe verify the min threshold set in findboxes';
  // get page's content
  let content = await page.content();
  await trigger(lr, updates.findingDirectory, null);
    ok_log('finding directory.');
  // get folder directory
  let dir = getDirectory(content);
  // console.log('Generated directory: ');
  // console.log(stringifyJSON(dir));
  sessions[session] = page;
  ok_log('Added session ' + session + ' to current sessions');
  let result = {dir: dir, session: session};
  await trigger(lr, updates.done, result);
  ok_log('done.');
  group_end();
  // unused
  return result;
}

async function recursiveClick(dir_list, $, page) {
  group_begin('Recursive Click on list: ' + dir_list);
  var returnid = null;
  for (var index = 0; index < dir_list.length; index++) {
    const small_list = dir_list.slice(0,index+1);
      // parse
    let found = list_sift(small_list, $);
    // get parsed id
    let found_id = '#' + $(found).attr('id');
    returnid = found_id;
    // if this element's second child (ul) has no children, don't click
    if ($(found_id).attr('class').split(' ').indexOf('expanded') !== -1) {
       // await page.screenshot({path: 'screenshot.png'});
       ok_log(found_id + ' already expanded');
      continue;
    }
    ok_log('clicking id ' + found_id);
    // click component
    await page.click(found_id);

  }
  group_end();
  return returnid;
}

var retrieve = async (dir_list, page, updates) => {
    console.log('Performing game data retrieval from:\n\t:Directory : ' + dir_list + '\n\tPage    : ' + page)
    if (dir_list.length <= 1) return; // bad input handle
    // get checkbox index
    let check_index = dir_list.pop();
    let content = await page.content();
    // setup parser
    var $ = cheerio.load(content);
    // copy list
    let list_copy = JSON.parse(JSON.stringify(dir_list));
    // click through tree
    let farthest_id = await recursiveClick(list_copy,$,page);

    console.log("Farthest-in clicked element was: " + farthest_id);

    // regather UI

    // get page's content -> Potentially should WAITFOR(..) here to ensure content is loaded
    await page.waitFor(250); // let document load CUZZO HUNCHO -> THIS WAS 550!, may need to change back
    content = await page.content();
    $ = cheerio.load(content);

    // console.log('TEXT content for farthest element is : ' + $(farthest_id).text());


    // get checkboxes for element
    let boxes = checkboxes_list(farthest_id, $, 0);

    if (!boxes || boxes.length === 0) throw 'THERE SHOULD BE CHECKBOXES';

    if (typeof check_index  !== 'number' || check_index >= boxes.length) {
      console.log("Check index bad !!! (" + check_index + ")");
      throw 'BAD CHECK INDEX';
      // return; // Bad input handle
    }
    // get nth checkbox
    let nth_box = JSON.parse(boxes[check_index]);
    // get checkbox id
    let checkid = nth_box['id'];
    console.log('Checkid: ');
    console.log(checkid);
    try {
        await page.click('#' + checkid);
    } catch (e) {
        err_log('Element id provided (' + checkid+ ') was not within clickable range.');
    }

    // Click Pause & Load Data

    await page.waitFor('#play-button');
    for (var i = 1; i < 11; i++) {
        await page.waitFor(150); // let document load
        try {
          await page.click('#play-button');
          break;
        } catch (e) {}
    }
    // pause the video

    await page.waitFor(200); // let document load -> CHECK THIS

    content = await page.content();
      // setup parser
    $ = cheerio.load(content);
    // get all data rows
    let parsed_table = await table_data($, page); // headers & data
    // send back a parsed table
    await trigger(mdr, updates.nextdone, parsed_table);

    // await page.screenshot({path: 'Confirm_We_Have_Opened_Tabs ' + Math.random().toFixed(3) + '.png', fullPage: true});

    // THIS IS SLOW, BUT WORKS!!
    await page.reload({ waitUntil: ["networkidle0" /* "networkidle0" */, "domcontentloaded"] });

    return parsed_table;
}

async function filmdata(session_id, dir_lists, updates) {

    // Initial setup
    group_begin('Get film data');
    let page = sessions[session_id];

    if (page === null) {
      err_log('Users session has closed. - Not processing data request');
      return;
    }

    var datum = [];
    var headers = null;

    // await page.screenshot({path: 'Confirm_We_Have_Opened_Tabs.png', fullPage: true});

    // Begin retrieval
    for (const dir_list of dir_lists) {
        let parsed_table = await retrieve(dir_list, page, updates);
        datum.push(parsed_table.data);
        if (headers === null) headers = parsed_table.headers;
    }
    // let retriever = await dir_lists.map(async (dir_list) => retrieve(dir_list, page, updates));

    // let alldone = await Promise.all(retriever);

    let data = datum.join(TKN_3)

    group_end();

    await trigger(mdr, updates.done, {data: data, headers: headers});

    // return all parsed tables
    return data;
}

async function videooptions(session_id, dir_list, updates) {
  group_begin('Video Options');
  let page = sessions[session_id];
  // get page's content
  let content = await page.content();
  await trigger(vr, updates.launchedPage, null);
  // setup parser
  var $ = cheerio.load(content);
  // parse
  await recursiveClick(dir_list,$,page);
  await trigger(vr, updates.expandedDirectory, null);
  // regen content
  content = await page.content();
  $ = cheerio.load(content);
  console.log('sifing: ' + dir_list);
  // find element
  element = list_sift(dir_list, $);
  if (!element) throw 'Element wasnt found (2)';
  // ('found element with id (of parent)' + $(element).parent().attr('id')).print();
  // get video options
  let video_options = checkboxes($(element), $);
  // let str_vo = video_options.map((opt) => JSON.stringify(opt, null, 2));
  let str_vo = video_options.toString();
  await trigger(vr, updates.done, str_vo);
  group_end();
  return video_options;
}

async function close(session_id) {
  sessions[session_id] = null;
    await page.close();
    return 'ok';
}



async function snagdata(session_id, checkbox_element_id, updates) {
  group_begin('Snag Data');
  let page = sessions[session_id];
  // get page's content
  let content = await page.content();
  await trigger(fr, updates.launchedPage, null);
    // setup parser
  var $ = cheerio.load(content);
  // await page.screenshot({path: 'screenshot.png'});
  // click checkbox
  try {
      await page.click('#' + checkbox_element_id);
  } catch (e) {
      err_log('Element id provided (' + checkbox_element_id+ ') was not within clickable range.');
      await trigger(fr, updates.done, '');
      group_end();
      return '';
  }
  await page.waitFor('#play-button');
  for (var i = 1; i < 11; i++) {
      await page.waitFor(300); // let document load
      try {
        await page.click('#play-button');
        break;
      } catch (e) {}
  }
  // pause the video

  await trigger(fr, updates.loadedFilm, null);
  // await page.screenshot({path: 'screenshot.png', fullPage: true});
  await page.waitFor(200); // let document load

  content = await page.content();
    // setup parser
  $ = cheerio.load(content);
  // get all data rows
  let parsed_table = await table_data($, page); // headers & data
  await trigger(fr, updates.done, parsed_table);
  group_end();
  //TODO: GET DATA
  return parsed_table;
}

async function findboxes(page) {
    // get page's content
    let content = await page.content();
    const $ = cheerio.load(content);
    let cb_len = $('input[type="checkbox"]').length;
    let NON_FILM_CHECKBOXES = 8;
    // let cu_len = $('div[id*="cutup_"]').length;
    if (/*cu_len <= 0 && */ cb_len <= NON_FILM_CHECKBOXES) {
        console.log("CHECKBOXES: " + cb_len);
        // console.log("CUTUPS: " + cu_len);
        var MAX_IT = 6;
        while (/*cu_len <= 0 && */ cb_len <= NON_FILM_CHECKBOXES && MAX_IT > 0) {
            await page.waitFor(350);
            let content = await page.content();
            const $ = cheerio.load(content);
            cb_len = $('input[type="checkbox"]').length;
            // cu_len = $('div[id*="cutup_"]').length;
            MAX_IT--;
        }
    }

    return (cb_len > NON_FILM_CHECKBOXES /*&& cu_len > 0 */ ? 'ok' : 'bad');
}




module.exports = {
  newsession: newsession,
  videooptions: videooptions,
  snagdata: snagdata,
  findboxes: findboxes,
  filmdata: filmdata
};






// async function table_data($, page) {
//  // get headers
//     let header_table = $('#clipsHeader').get(0);
//     let rows = $(header_table).find('span');
//     console.log('rows size is now: ' + rows.length);
//     var headers = [];
//     rows.map((i, row) => {
//         let text = $(row).text();
//         headers.push(text);
//     });
//     // console.log('headers are now: ' + headers);
//     console.log('We now have n headers: ' + headers.length);

//     let MAX_TRIES = 7;
//     let N = 0;

//   // get data
//     let data_table = $('#clipsTable').find('tbody');
//     let TABLE_STR = JSON.stringify($(data_table).html());


//     while (TABLE_STR.length < 40 && N < MAX_TRIES) {
//         await page.waitFor(400); // let document load
//         let content = await page.content();
//             // setup parser
//         $ = cheerio.load(content);
//         data_table = $('#clipsTable').find('tbody');
//         TABLE_STR = JSON.stringify($(data_table).html());
//         N++;
//     }

//     let data_rows = $(data_table).find('tr');
//         // console.log('table ok ? ' + $('#clipsTable').text());
//     // console.log('tbody ok ? ' + $(data_table).find('tbody').text());
//     // console.log('tr ok ? ' + $($(data_table).find('tbody').get(0)).find('tr'));
//     console.log('this translates to ' + data_rows.length + ' data rows');
//     var data = '';
//     data_rows.map((i, row) => {
//       // console.log(i + ': ' + $(row).find('td').length )
//       let columns_unformatted = $(row).find('td[class=" "]'); // class=' '
//       // console.log('for row ' + i + ' founs ' + columns_unformatted.length + ' columns');
//       var columns = [];

//       columns_unformatted.map((i, col) => {
//           columns.push($(col).text());
//       });
//       data += columns.toString() + TKN_2;
//     });

//     data = data.slice(0, -(TKN_2.length));

//     let result = {headers: headers, data: data};

//     return result;
// }





// app.get('/login', async (req, res) => {
//   let user = process.env.HUDL_EMAIL;
//   let pass = process.env.HUDL_PASSWORD;
//   let info = await newsession(user,pass);
//   res.send(info);
// })

// app.get('/screenshot', async (req, res) => {
//   let options = await getFirstVideoOptions();
//   res.send(options);
// })

// function readModuleFile(path, callback) {
//   try {
//       var filename = require.resolve(path);
//       fs.readFile(filename, 'utf8', callback);
//   } catch (e) {
//       callback(e);
//   }
// }

// readModuleFile('./hudl.htm', function (err, content) {
//     if (err) return;
//     var $ = cheerio.load(content);
//     let data = table_data($);
//     if (!data) throw 'Data wasnt found';
//     else console.log(data);
// });

// var test = async () => {
//   let user = process.env.HUDL_EMAIL;
//   let pass = process.env.HUDL_PASSWORD;
//   let info = await newsession(user,pass);
//   let options = await getFirstVideoOptions();
//   console.log('Final Options: ' + options.map((opt,i) => ('Option #' + i + ' : ' + JSON.stringify(opt, null, 2))));
// }


// test();



// const port = 5000;

// app.get('/', (req, res) => res.send('Hello World!'))

// app.listen(port, () => console.log(`HUDL app listening at http://localhost:${port}`))





// var find = (objective, element, $, d=0) => {
//   // functions
//   var nameOf = (el) => $($(el).children()[0]).find('.category-name').text() || $($(el).children()[0]).find('.event-name').text()
//   var branches = (el) => $($(el).children()[1]).children()
//   // TODO
//   if (nameOf(element) === objective) {
//     return element;
//   }
//   let current_branches = branches(element);
//   if (current_branches.length > 0) {
//     var FINAL_RESULT = null;
//     current_branches.map((i, branch) => {
//       if (FINAL_RESULT !== null) return null;
//       let res = find(objective, branch, $, d+1);
//       if (res !== null) {
//         FINAL_RESULT = res;
//       }
//     });
//     return FINAL_RESULT;
//   }
//   return null;
// }



// var form = (s) => s.substring(8,s.indexOf("?"));
// var lib = (s) => "https://www.hudl.com/library" + form(s);

// function failed_string() {
//     return "<p>If you don&#39;t see the email, check your junk or spam folders.</p>";
// }

// var login = async (user, pass) => {
//     let data = {"username": user,
//      "password": pass,
//      "rememberMe": false,
//      "forward": "",
//      "schoolId": "",
//      "timezoneOffset": 240,
//     };

//     try {
//       let resp = await axios.post(loginurl, data, { headers: {} });

//       let headers = {
//           'Content-Type': 'application/json;charset=UTF-8',
//           "Access-Control-Allow-Origin": "*",
//       }

//       console.log(headers);

//       let respdata = resp.data;


//       // STYLE SHOULD BE:    Cookie: "cookie1=value; cookie2=value; cookie3=value;"
//       let cookie = headers['set-cookie'];

//           'ident=a=PnKXCoHBVoZaYc-cZZC0DA&u=11378923&n=; path=/',
//           't=90922; path=/',
//           'p=sport=football&team=90922&username=***REMOVED***; expires=Tue, 14-Jul-2020 07:04:03 GMT; path=/',
//           'locale-rec=; domain=.hudl.com; path=/',
//           'locale-des=en-US; domain=.hudl.com; path=/',
//           'locale-tog=; domain=.hudl.com; path=/',
//           'locale-tl=; domain=.hudl.com; path=/'


//       let library = lib(resp.data.forward);
//       console.log('querying library ' + library + '..');
//       let res = await axios.get(library, {Cookie: cookie, cookie: cookie, data: respdata, header: headers, withCredentials: true});

//       if (res.data.indexOf(failed_string()) !== -1) console.error("Failed..");
//       else console.log("Success. -> " + res.data );

//     } catch (e) {
//       console.error(e);
//     }

// }
