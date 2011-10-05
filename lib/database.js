/*!
 * DOQ API: Database objects
 * @version 0.0.1
 */

/*!
 * Required modules.
 */
var catalogueObj = require( "./catalogue.js" ).Catalogue;

/**
 * Database object for containing object in the database.
 * @see DatabaseObject.Constructor
 * @returns {DatabaseObject}
 */
function DatabaseObject(){
	function Constructor( connection, connectionName, baseNode ){
		this.__subfactors.connection = connection;
		this.__subfactors.connectionName = connectionName;
		this.__subfactors.baseNode = baseNode;
	}
	
	function _CompiledValue( item, itemValue ){
		if( itemValue != undefined ){
			this.__subfactors.compiledList[item] = itemValue;
		}
		else{
			if( this.__subfactors.compiledList[item].compiled ){
				return this.__subfactors.compiledList[item];
			}
			else{
				//Compile it
				var connectionMap = this.__subfactors.connection.dataCatalogue.typeMap[this.__subfactors.connectionName];
				var filter = null;
				var defaultFilter = false;
				if( connectionMap ){
					var map = connectionMap[this.__GetMapName()];
					if( map && map[item] ){
						filter = this.__subfactors.connection.doqInterface.filters[map[item]];
					}
					else{
						defaultFilter = true;
					}
				}
				else{
					defaultFilter = true;
				}
				
				if( defaultFilter ){
					filter = this.__subfactors.connection.doqInterface.filters[this.__subfactors.connection.dataCatalogue.defaultFilter];
				}
				
				this.__subfactors.compiledList[item] = filter.Create( this.__subfactors.compiledList[item] );
				this.__subfactors.compiledList[item].compiled = true;
				return this.__subfactors.compiledList[item];
			}
		}
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
		//Get the first set of _text, as this is the column name//
		
	};
	
	this.QueryObject = function( queryObject ){
		if( queryObject.column ){
			return this[queryObject.column].QueryObject( queryObject );
		}
		else{
			console.log( "Sub object must contain a setting for query.column to help Database object locate the instance." );
			process.exit();
		}
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
		this.__subfactors.compiledList[itemName] = itemValue;
		var self = this;
		Object.defineProperty( this, itemName, {
			get:function(){
				return _CompiledValue.call( self, itemName );
			},
			set:function( v ){
				_CompiledValue.call( self, itemName, v );
			}
		} );
	};
	
	//CALL TO CONSTRUCTOR//
	Constructor.call( this, arguments[0], arguments[1], arguments[2] );
	//CALL TO CONSTRUCTOR//
};

exports.Connection = function(){
	function Constructor( registeredAs, catalogue, child ){
			{_Inherit.call( this, child )}
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
				this.BuildDBObject( rawDBObject, newDBobject );
				pto = this.cacheCatalogue[query.catalogueString][primary] = newDBobject;
			}
			return pto;
		}
		else{
			//Return a new DBObject
			var newDBobject = new DatabaseObject( this, query.connection, query.tree.name );
			this.BuildDBObject( rawDBObject, newDBobject );
			return newDBobject;
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
	
	//ABSTRACTION LAYER//
    var _child = null;
	function _Inherit( child ){
		_child = child;
		for( i in _child ){
			this[i] = _child[i];
		}
	}
    //ABSTRACTION LAYER//
	
	//CALL TO CONSTRUCTOR//
	Constructor.apply( this, arguments );
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