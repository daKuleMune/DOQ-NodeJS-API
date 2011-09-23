//require interface
var doqInterface = require('./lib/interface.js').Interface;

//create interface with connection(s)
var doq = new doqInterface( './examples/mysql/' );

//example user connections
	//User
var userPrefs = {
	name: '_doq',
	group: 'admin',
	connection:"127.0.0.1"
};
	//Annon
var annonPrefs = {
	connection:"127.0.0.1"
};

//Create user objects
var doqUser = doq.OpenUserConnection( userPrefs );
var annonUser = doq.OpenUserConnection( annonPrefs );

//Query the DOQ API
doqUser.Query( "@database1/userlist/username*", null, function( objectArray ){
	console.log( objectArray );
} );//GETS ALL USERS//

annonUser.Query( "@database1/userlist/username*", null, function( objectArray ){
	console.log( objectArray );
} );//ERRORS ON SECURITY FAILED//