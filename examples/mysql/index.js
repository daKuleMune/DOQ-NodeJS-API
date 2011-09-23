/*!
 * Example database plug-in for MySQL connections
 */


var connection = require( "../../lib/database.js" ).Connection;
var mysql = require( "db-mysql" );


connection.prototype.InitConnection = function( ){
	this.client = new mysql.Database({
	    hostname: '127.0.0.1',
	    user: 'username',
	    password: 'userpassword'
	});
	this.client.on('error', function(error) {
	    console.log( 'ERROR: ' + error );
	});
	this.client.on('ready', function(server) {
	    console.log( 'Connected to ' + server.hostname + ' (' + server.version + ')' );
	});
	this.client.connect();
};

connection.prototype.GetPrimary = function( rawDBO, primaryItemName ){
	return rawDBO[primaryItemName];
};

connection.prototype.BuildDBObject = function( rawDBO, newDBO ){
	for( var i in rawDBO ){
		newDBO.Set( i, rawDBO[i] );
	}
};

connection.prototype.Query = function( query ){
	var queryCat = this.GetQueryCatalogue( query );
	if( queryCat == null ){
		var self = this;
		this.client.query( "SELECT SQL_CALC_FOUND_ROWS * FROM `"+query.connection+"`.`"+query.tree.name+"`;" ).execute( function( error, rows, columns ){
			if( error ){
				console.log( "MYSQL Error: " + error );
			}
			self.client.query( "SELECT FOUND_ROWS() AS `found_rows`;" ).execute( function( e, r ){
				if( e ){
					console.log( "MYSQL Error in finding rows: " + e );
				}
				rows.totalRows = r[0].found_rows;
				self.SetQueryCatalogue( query, rows );
				self.Query( query );
			} );
		} );
	}
	else{
		switch( query.type ){
		case "*":
			var dbObjectArray = [];
			for( var i = 0; i < queryCat.length; i++ ){
				
				dbObjectArray.push( this.DBObjectCache( queryCat[i], query ).Query( query.nodeQuery ) );
			}
			query.callback( dbObjectArray );
			break;
		default:
			console.log( "Unrecognized query.type '" + query.type + "'" );
			break;
		}
	}
};

exports.Connection = new connection( [ "database1","database2" ], __dirname + "/catalogue.xml" );
