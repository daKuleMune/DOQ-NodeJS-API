/*!
 * Example database plug-in for MySQL connections
 */


var connectionObject = require( "../../lib/database.js" ).Connection;
var mysql = require( "db-mysql" );

var connection = function(){
	this.InitConnection = function( ){
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
	
	this.GetPrimary = function( rawDBO, primaryItemName ){
		return rawDBO[primaryItemName];
	};
	
	this.BuildDBObject = function( rawDBO, newDBO ){
		for( var i in rawDBO ){
			newDBO.Set( i, rawDBO[i] );
		}
	};
	
	this.Query = function( query ){
		var queryCat = this.GetQueryCatalogue( query );
		if( queryCat == null ){
			//Create where clause from the table query//
			var queryClause = "";
			if( query.tree.query != null ){
				//OR
				var orList = [];
				for( var or = 0; or < query.tree.query.length; or++ ){
					var andList = [];
					for( var and = 0; and < query.tree.query[or].length; and++ ){
						var statment = query.tree.query[or][and];
						andList.push( "`"+statment.variable+"`" + statment.exp + statment.literal );
					}
					orList.push( andList.join( " AND " ) );
				}
				queryClause = " WHERE " + orList.join( " OR " );
			}
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
					dbObjectArray.push( this.DBObjectCache( queryCat[i], query ).QueryObject( query ) );
				}
				query.callback( dbObjectArray );
				break;
			case "!":
				query.callback( queryCat.totalRows > 0 );
				break;
			case "$":
				query.callback( this.DBObjectCache( queryCat[0], query ).QueryObject( query ) );
				break;
			default:
				console.log( "Unrecognized query.type '" + query.type + "'" );
				break;
			}
		}
	};
}

exports.Connection = new connection( [ "database1","database2" ], __dirname + "/catalogue.xml" );
