
var catalogueObj = require( "./catalogue.js" ).Catalogue;

function DatabaseObject(){
	function Constructor( connection, connectionName, baseNode ){
		this.__subfactors.connection = connection;
		this.__subfactors.connectionName = connectionName;
		this.__subfactors.baseNode = baseNode;
	}
	this.__subfactors = {
		baseNode:"",
		connectionName:"",
		itemList:[],
		compiledList:{},
		retrace:null,
		sql:null,
		primary:null,
		priorDataSet:null,
		xtend:null,
		qstring:null,
		wasDeleted:null,
		connection:null,
		where:null
	};
	var _sqlData = "";
	var _branch = "";
	
	this.Query = function( queryString ){
		var queryString = queryString.split( "/" );
		if( !this.__subfactors.compiledList[queryString[0]] ){
			this.__subfactors.compiledList[queryString[0]] = true;
			var map = this.__subfactors.connection.dataCatalogue.typeMap[this.__subfactors.connectionName][this.__GetMapName()];
			var queryObject = null;
			if( map[queryString[0]] ){
				console.log( "connect to a real map filter" );
			}
			else{
				queryObject = this.__subfactors.connection.doqInterface.filters[this.__subfactors.connection.dataCatalogue.defaultFilter]
			}
			this[queryString[0]] = queryObject( this[queryString[0]] );
		}
		return this[queryString[0]];
	};
	
	this.Save = function(){
		
	};
	
	this.__GetMapName = function(){
		return this.__subfactors.baseNode;
	};
	
	this.__GetItemList = function(){
		return this.__subfactors.itemList;
	};
	
	this.Delete = function(){
		
	};
	
	this.Set = function( itemName, itemValue ){
		this.__subfactors.itemList.push( itemName );
		this[itemName] = itemValue;
	};
	
	//CALL TO CONSTRUCTOR//
	Constructor.call( this, arguments[0], arguments[1], arguments[2] );
	//CALL TO CONSTRUCTOR//
};

exports.Connection = function(){
	function Constructor( registeredAs, catalogue ){
		registeredAs = registeredAs || [];
		this.dataCatalogue = new catalogueObj( catalogue );
		if( typeof( registeredAs ) == "string" ){
			registeredAs = [ registeredAs ];
		}
		this.registeredAs = registeredAs;
		this.InitConnection();
	}
	this.registeredAs = null;
	var _host = null;
	this.dataCatalogue = null;
	this.queryCatalogue = {};
	this.primaryCatalogue = {};
	this.cacheCatalogue = {};
	this.securityCatalogue = null;
	this.totalRows = 0;
	this.doqInterface = null;
	
	if( !this.Query ){
		this.Query = function( queryObject ){
			console.log( "This is abstract, please create a method for this.\nObject.prototype.Query or objectinstance.Query" );
		};
	}
	
	if( !this.InitConnection ){
		this.InitConnection = function(){
			console.log( "The abstract method InitConnection was not defined, please create a method for this before instancing the object.\nObject.prototype.InitConnection" );
		};
	}
	
	if( !this.BuildDBObject ){
		this.BuildDBObject = function( rawDatabaseObject, databaseObjectContainer ){
			console.log( "The abstract method BuildDBObject was not defined, please create a method for this before running any queries.\nObject.prototype.BuildDBObject" );
		};
	}
	
	if( !this.GetPrimary ){
		this.GetPrimary = function( rawDBO, primaryItemName ){
			console.log( "The abstract method GetPrimary was not defined, please create a method for this before running any queries that cache.\nObject.prototype.GetPrimary" );
		};
	}
	
	this.DBObjectCache = function( rawDBObject, query ){
		var dbobject = null;
		if( query.tree.primary ){
			//Get it from the cache
			var pto = null;
			var primary = this.GetPrimary( rawDBObject, query.tree.primary );
			if( !this.cacheCatalogue[query.catalogueString] ){
				this.cacheCatalogue[query.catalogueString] = {};
			}
			if( !( pto = this.cacheCatalogue[query.catalogueString][primary] ) ){
				var newDBobject = new DatabaseObject( this, query.connection, query.tree.name );
				dbobject = this.BuildDBObject( rawDBObject, newDBobject );
				newDBobject;
				pto = this.cacheCatalogue[query.catalogueString][primary] = newDBobject;
			}
			return pto;
		}
		else{
			//Return a new DBObject
			var newDBobject = new DatabaseObject( this, query.connection, query.tree.name );
			dbobject = this.BuildDBObject( rawDBObject, newDBobject );
		}
		return dbobject;
	};
	
	this.GetQueryCatalogue = function( query ){
		if( this.queryCatalogue[query.catalogueString] == undefined ){
			this.queryCatalogue[query.catalogueString] = { };
		}
		if( this.queryCatalogue[query.catalogueString][query.tree.query] == undefined || this.queryCatalogue[query.catalogueString][query.tree.query].isStale ){
			return null;
		}
		
		return this.queryCatalogue[query.catalogueString][query.tree.query];
	};
	
	this.SetQueryCatalogue = function( query, dbobject ){
		this.queryCatalogue[query.catalogueString][query.tree.query] = dbobject;
	};
	
	this.AccessGrant = function( query ){
		return this.dataCatalogue.AccessGrant( query );
	};
	
	//CALL TO CONSTRUCTOR//
	Constructor.call( this, arguments[0], arguments[1] );
	//CALL TO CONSTRUCTOR//
};

exports.ConnectionManager = new (function(){
	var _connectionList = {};
	this.Query = function( queryObject ){
		var connection = _connectionList[queryObject.connection];
		if( connection ){
			if( connection.AccessGrant( queryObject ) ){
				connection.Query( queryObject );
			}
			else{
				console.log( "Attempt to query '" + queryObject.connection + "' outside security protocalls from " + queryObject.user.GetUsername() + " :: " + queryObject.user.GetConnectionId() );
			}
		}
		else{
			console.log( "Attempt to query a unregistered connection. '" + queryObject.connection + "'" );
		}
	};
	
	this.RegisterConnection = function( connection, doqInterface ){
		connection.doqInterface = doqInterface;
		for( var i = 0; i < connection.registeredAs.length; i++ ){
			_connectionList[connection.registeredAs[i]] = connection;
		}
	};
});