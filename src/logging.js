var clc = require("cli-color");

function log(output) {
  console.log(output)
}
function logn(output) {
  console.log('\n' + output)
}


function err_log(output) {
  logn(clc.red.bold('Error ') + output);
}

function ok_log(output) {
  logn(clc.green.bold('OK ') + output);
}

function table_log(output)  {
  console.table(output);
}

function log_group_begin(text) {console.group('\n-- -- ' + text + ' -- --\n');}

function log_group_end() { console.groupEnd(); console.log('\n-- -- \n'); }

function prettify(json) { return JSON.stringify(json, null, 2); }

module.exports = {
    log: log,
    logn: logn,
    err_log: err_log,
    ok_log: ok_log,
    table_log: table_log,
    log_group_begin: log_group_begin,
    log_group_end: log_group_end,
    prettify: prettify
}
