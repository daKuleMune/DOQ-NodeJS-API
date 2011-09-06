var doqInterface = require('./lib/interface.js').Interface;
var doq = new doqInterface( "mysql" );
doq.Query( "@bws_webabase/site_list:domain,dex[ dex != 1 ]/*" );