/*!
 * DOQ API: Database objects
 * @version 0.1.0
 * @author Stev0 <steven@navolutions.com>
 */

/*!
 * Included modules.
 */
var catalogueObj = require( "./catalogue.js" ).Catalogue;
var doqInterface = require('../lib/interface.js').Interface;

/**
 * Database object for containing object in the database.
 * @see DatabaseObject.Constructor
 */
function DatabaseObject(){
	/**
     * Constructor of the DatabaseObject
     * @param connection {Connection} - The connection that was made to get the database object.
     * @param conectionName string - The alias of the connection.
     * @param baseNode string - Name of the base node, ( table in most cases ).
     */
	function Constructor( connection, connectionName, baseNode, primary ){
		this.__subfactors.connection = connection;
		this.__subfactors.connectionName = connectionName;
		this.__subfactors.baseNode = baseNode;
		this.__subfactors.primary = primary;
	}
    /////////////////////
//////PRIVATE VARIABLES//
	/////////////////////

	///////////////////
//////PRIVATE METHODS//
	///////////////////
	/**
	 * Helper method for getting/setting a value by first making sure it is compiled.
	 * @param item string - The name of the item to get.
	 * @param itemValue string - The value to set the item to, which will cause a recompiling of it.
	 */
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
				var filter = this.__subfactors.filterList[item];
				this.__subfactors.compiledList[item] = filter.Create( item, this.__subfactors.compiledList[item], this );
				this.__subfactors.compiledList[item].compiled = true;
				return this.__subfactors.compiledList[item];
			}
		}
	}
	/**
	 * Sets the filter for an item.
	 * @param item string - Name of item to set the filter for.
	 */
	function _SetFilter( item ){
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
		
		this.__subfactors.filterList[item] = filter;
		if( filter.compileOnLoad ){
			this.__subfactors.preCompiledReqests++;
			var itemData = this[item];
		}
	}
	
    ////////////////////
//////PUBLIC VARIABLES//
	////////////////////
	/**
	 * The sub factors for the object that are not part of the data set.
	 * @type object
	 */
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
		where:null,
		watchers:[],
		filterList:{},
		preCompiledItems:0,
		preCompiledReqests:0,
		readyMethods:[]
	};
    //////////////////
//////PUBLIC METHODS//
	//////////////////
	/**
	 * Updates the number of compiled items, and send callback when ready.
	 */
	this.NotifyCompiledItem = function(){
		this.__subfactors.preCompiledItems++;
		if( this.__subfactors.preCompiledItems == this.__subfactors.preCompiledReqests ){
			for( var i = 0; i < this.__subfactors.readyMethods.length; i++ ){
				this.__subfactors.readyMethods[i]( this );
			}
		}
	};
	/**
	 * The string query method for the database object.
	 * @param queryString string - Query read/execution path.
	 * TODO Add security layer into these queries.
	 */
	this.Query = function( user, queryString, writeZone ){
		if( writeZone == undefined ){
			writeZone = null;
		}
		var queryObject = doqInterface.CompileColumnQuery( queryString );
		if( writeZone != null ){
			queryObject.write = writeZone;
		}
		queryObject.user = user;
		queryObject.connection = this.__subfactors.connectionName;
		queryObject.table = this.__subfactors.baseNode;
		var priorTree = queryObject.tree;
		queryObject.tree = { name: queryObject.table, tree:priorTree };
		
		return this.QueryObject( queryObject );
		
	};
	/**
	 * Object query for Database Object.
	 * @param queryObject - The object representation for the query to execute.
	 * @returns mixed - Results of the query.
	 */
	this.QueryObject = function( queryObject ){
		if( queryObject.column ){
			if( this[queryObject.column] ){
				if( this[queryObject.column].QueryObject ){
					var queryItem = this[queryObject.column].QueryObject( queryObject );
					return queryItem;
				}
				
				return this[queryObject.column];
			}
			else{
				console.log( this );
				console.log( "Data point not found '"+queryObject.column+"'" );
				return null;
			}
		}
		else{
			return this;
		}
	};
	/**
	 * Save method to write the database object back into the database.
	 * @TODO - Needs to be written.
	 */
	this.Save = function( items ){
		if( this.__subfactors.primary ){
			items = items || this.__subfactors.itemList;
			if( typeof( items ) == "string" ){
				items = [ items ];
			}
			//Save data//
			var saveItems = [];
			for( var ar = 0; ar < items.length; ar++ ){
				saveItems.push( { name:items[ar], value:this[items[ar]].Serialize() } );
			}
			
			this.__subfactors.connection.Save(
				this.__subfactors.connectionName,
				this.__subfactors.baseNode,
				this.__subfactors.primary,
				this[this.__subfactors.primary].value,
				saveItems
			);
			
			//Notify watchers//
			for( var i = 0; i < this.__subfactors.watchers.length; i++ ){
				var reQuery = this.__subfactors.watchers[i];
				for( var ar = 0; ar < items.length; ar++ ){
					if( items[ar] == reQuery.column ){
						reQuery.__issuedConnection.Query( reQuery );
					}
				}
			}
		}
	};
	/**
	 * Gets the base node name.
	 * @returns string - The baseNode in the __subfactors
	 */
	this.__GetMapName = function(){
		return this.__subfactors.baseNode;
	};
	/**
	 * Gets the list of items in the in the database object.
	 * @returns array - Names of all the items, as if it was iterated.
	 */
	this.__GetItemList = function(){
		return this.__subfactors.itemList;
	};
	/**
	 * Removal of the database object from the database.
	 * @TODO - Needs to be written.
	 */
	this.Delete = function(){
		
	};
	/**
	 * Sets a callback for when the object is ready.
	 * @param callback function - Method to call when object is ready.
	 */
	this.OnReady = function( callback ){
		if( this.__subfactors.preCompiledItems < this.__subfactors.preCompiledReqests ){
			this.__subfactors.readyMethods.push( callback );
		}
		else{
			callback( this );
		}
	};
	/**
	 * Method for setting a new item into the list of items and compiled values.
	 * @param itemName string - The name of the item.
	 * @param itemValue string - The value of the item from the database.
	 */
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
		
		_SetFilter.call( this, itemName );
	};
	/**
	 * TODO is this used?
	 */
	this.BindDataChange = function( boundQuery, connection ){
		var qCopy = {};
		for( o in boundQuery ){
			qCopy[o] = boundQuery[o];
		}
		qCopy.onPrimaryChange = null;
		qCopy.__issuedConnection = connection;
		this.__subfactors.watchers.push( qCopy );
	};
	
	//CALL TO CONSTRUCTOR//
	Constructor.call( this, arguments[0], arguments[1], arguments[2], arguments[3] );
	//CALL TO CONSTRUCTOR//
};

/**
 * Abstract connection object for creating new connection types, to query multiple databases and database types.
 * @see Connection.Constructor
 */
exports.Connection = function(){	
	/**
     * Constructor of the Connection
     * @param registeredAs mixed - String or array of what to register this connection as in the connection manager.
     * @param catalogue string - Catalogue file for the connection.
     */
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
	
    /////////////////////
//////PRIVATE VARIABLES//
	/////////////////////

    ///////////////////
//////PRIVATE METHODS//
	///////////////////
	/**
	 * Caches and refines the database objects.
	 * @param rawDBObject object - The raw database object from the database
	 * @param query object - The query object.
	 * @param callback function - Method to call once cache has completed.
	 */
	function _DBObjectCache( rawDBObject, query, callback ){
		if( query.tree.primary ){
			//Get it from the cache
			var pto = null;
			var primary = this.GetPrimary( rawDBObject, query.tree.primary );
			if( !this.cacheCatalogue[query.catalogueString] ){
				this.cacheCatalogue[query.catalogueString] = {};
			}
			if( !( pto = this.cacheCatalogue[query.catalogueString][primary] ) ){
				var newDBobject = new DatabaseObject( this, query.connection, query.tree.name, query.tree.primary );
				this.BuildDBObject( rawDBObject, newDBobject );
				pto = this.cacheCatalogue[query.catalogueString][primary] = newDBobject;
			}
			if( query.onPrimaryChange ){
				pto.BindDataChange( query, this );
			}
			pto.OnReady( callback );
		}
		else{
			//Return a new DBObject
			if( query.onPrimaryChange ){
				console.log( "A query was issued with a primary change, but no primary was found for the tree." );
				console.log( query );
			}
			var newDBobject = new DatabaseObject( this, query.connection, query.tree.name );
			this.BuildDBObject( rawDBObject, newDBobject );
			newDBobject.OnReady( callback );
		}
	};
	/**
	 * Calls the data cache to attempt to load all of the objects in the query, then executes the query.callback.
	 * @param rawDBObject array - An array of raw database objects from the database
	 * @param query object - The query object.
	 */
	function _DispatchArray( queryResult, query ){
		var dbObjectArray = [];
		var compiledObjects = 0;
		for( var i = 0; i < queryResult.length; i++ ){
			dbObjectArray.push( null );
			_IndexedDBCache.call( this, i, queryResult[i], query, function( index, dbobject ){
				dbObjectArray[index] = dbobject;
				compiledObjects++;
				if( compiledObjects == queryResult.length ){
					query.callback( dbObjectArray );
				}
			} );
		}
	}
	/**
	 * Calls the callback in the query with a boolean as the result of the query.
	 * @param queryResult object - The raw database object row.
	 * @param query - object - The query object.
	 */
	function _DispatchExe( queryResult, query ){
		query.callback( queryResult.totalRows > 0 );
	}
	/**
	 * Calls the query callback with default value or null.
	 * @param query object - Query object.
	 */
	function _DispatchNull( query ){
		if( query.defaultValue ){
			query.callback( query.defaultValue );
		}
		else{
			query.callback( null );
		}
	}
	/**
	 * Calls the data cache to attempt to load the query, then executes the query.callback.
	 * @param rawDBObject object - The raw database object from the database
	 * @param query object - The query object.
	 */
	function _DispatchObject( queryResult, query ){
		var connectionNumber = parseInt( query.connectionNode );
		if( connectionNumber == "NaN" ){
			console.log( "Unrecognized query.connectionNode '" + query.connectionNode + "'" );
		}
		_GetDBObject.call( this, queryResult[connectionNumber], query, query.callback );
	}
	/**
	 * Gets the database object from a raw database row object, and checks the result before calling the callback.
	 * @param queryResult object - Raw database object of the row.
	 * @param query object - Query object.
	 * @param callback function - Method to call once the database object has been loaded.
	 */
	function _GetDBObject( queryResult, query, callback ){
		_DBObjectCache.call( this, queryResult, query, function( dbObject ){
			if( dbObject === null ){
				if( query.defaultValue ){
					callback( query.defaultValue );
				}
				else{
					callback( null );
				}
			}
			else{
				var result = dbObject.QueryObject( query );
				if( query.defaultValue && result === undefined || query.defaultValue && result === "" ){
					callback( query.defaultValue );
				}
				else if( result === undefined ){
					callback( null );
				}
				else{
					callback( result );
				}
			}
		} );
	}
	/**
	 * Gets a database object and calls the callback with passing an index.
	 * @param index mixed - Index to pass to the callback.
	 * @param queryResult object - Raw database object of row.
	 * @param query object - Query object.
	 * @param callback function - Method to send the DBObject and index as function( index, dbobject ).
	 */
	function _IndexedDBCache( index, queryResult, query, callback ){
		_GetDBObject.call( this, queryResult, query, function( dbobject ){
			callback( index, dbobject );
		} );
	}

	////////////////////
//////PUBLIC VARIABLES//
	////////////////////
	/**
	 * Data cache by catalogue string.
	 * @type assoArray
	 */
	this.cacheCatalogue = {};
	/**
	 * The catalogue for the connection.
	 * @type {Catalogue}
	 */
	this.dataCatalogue = null;
	/**
	 * The doq interface API.
	 * @type {Interface}
	 */
	this.doqInterface = null;
	/**
	 * @TODO - Unsed at this time, what was it going to be for?
	 */
	this.primaryCatalogue = {};
	/**
	 * Cache by query string.
	 * @type assoArray
	 */
	this.queryCatalogue = {};
	/**
	 * Aliases for the connection in the connection manager.
	 * @type array
	 */
	this.registeredAs = null;
	
    //////////////////
//////PUBLIC METHODS//
	//////////////////
	/**
	 * Checks if access can be granted for the query.
	 * @returns boolean - Does the query have permission to run?
	 */
	this.AccessGrant = function( query ){
		return this.dataCatalogue.AccessGrant( query );
	};
	/**
	 * Call from the database connection to return the resulting query to the query callback based on connectionNode in query.
	 * @param queryResult array - Array of all the rows in the raw database return.
	 * @param query object - Query object used to start the query.
	 */
	this.DispatchQuery = function( queryResult, query ){
		if( queryResult === null ){
			_DispatchNull.call( query );
		}
		else{
			switch( query.connectionNode ){
			case "*":
				_DispatchArray.call( this, queryResult, query );
				break;
			case "!":
				_DispatchExe.call( this, queryResult, query );
				break;
			default:
				_DispatchObject.call( this, queryResult, query );
				break;
			}
		}
	};
	/**
	 * Returns the object in the query cache catalogue.
	 * @param query object - The query object.
	 */
	this.GetQueryCatalogue = function( query, callback ){
		if( this.queryCatalogue[query.catalogueString] == undefined ){
			this.queryCatalogue[query.catalogueString] = { };
		}
		if( this.queryCatalogue[query.catalogueString][query.nodeQuery] == undefined || this.queryCatalogue[query.catalogueString][query.nodeQuery].isStale ){
			this.queryCatalogue[query.catalogueString][query.nodeQuery] = { activeQue:true, queue:[] };
			console.log( query.catalogueString + " " + query.nodeQuery );
			callback( null );
		}
		else{
			if( this.queryCatalogue[query.catalogueString][query.nodeQuery].activeQue ){
				this.queryCatalogue[query.catalogueString][query.nodeQuery].queue.push( callback );
			}
			else{
				callback( this.queryCatalogue[query.catalogueString][query.nodeQuery] );
			}
		}
	};
	/**
	 * Sets the database object into the query cache catalogue.
	 * @param query object - The query object.
	 * @param dbobject object - The raw database object.
	 */
	this.SetQueryCatalogue = function( query, dbobject ){
		var cataloguePointer = this.queryCatalogue[query.catalogueString][query.nodeQuery];
		if( cataloguePointer.activeQue ){
			for( var i = 0; i < cataloguePointer.queue.length; i++ ){
				cataloguePointer.queue[i]( dbobject );
			}
		}
		this.queryCatalogue[query.catalogueString][query.nodeQuery] = dbobject;
	};
	
    ////////////////////
//////ABSTRACT METHODS//
	////////////////////
	if( !this.Query ){
		/**
		 * Query method for the connection.
		 * @param queryObject object - The query object.
		 */
		this.Query = function( queryObject ){
			console.log( "This is abstract, please create a method for this.\nObject.prototype.Query or objectinstance.Query" );
		};
	}
	
	if( !this.InitConnection ){
		/**
		 * Call when connection is initialized.
		 */
		this.InitConnection = function(){
			console.log( "The abstract method InitConnection was not defined, please create a method for this before instancing the object.\nObject.prototype.InitConnection" );
		};
	}
	
	if( !this.BuildDBObject ){
		/**
		 * Method for refining the database object for the connection type.
		 * @param rawDatabaseObject object - The raw object from the database.
		 * @param databaseObjectContainer {DatabaseObject} - The database object to refine the raw object into.
		 */
		this.BuildDBObject = function( rawDatabaseObject, databaseObjectContainer ){
			console.log( "The abstract method BuildDBObject was not defined, please create a method for this before running any queries.\nObject.prototype.BuildDBObject" );
		};
	}
	
	if( !this.GetPrimary ){
		/**
		 * Gets the primary item from a raw database object.
		 * @param rawDBO object - The raw object from the database.
		 * @param primaryItemName string - Name of the primary item.
		 */
		this.GetPrimary = function( rawDBO, primaryItemName ){
			console.log( "The abstract method GetPrimary was not defined, please create a method for this before running any queries that cache.\nObject.prototype.GetPrimary" );
		};
	}
	
	if( !this.Save ){
		this.Save = function( connectionAlias, saveNode, primaryName, primaryValue, items ){
			console.log( "The abstract method Save was not defined, please create a method for this before running any queries that cache.\nObject.prototype.Save" );
		};
	}
	
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

/**
 * Singleton that manages all the connections, and connection aliases.
 * @see ConnectionManager.Constructor
 */
exports.ConnectionManager = new (function(){
	/**
     * Constructor of the ConnectionManager
     */
	function Constructor(){
		
	}
	
    /////////////////////
//////PRIVATE VARIABLES//
	/////////////////////
	/**
	 * List of connections by their aliases.
	 * @type assoArray
	 */
	var _connectionList = {};
	
    ///////////////////
//////PRIVATE METHODS//
	///////////////////

	////////////////////
//////PUBLIC VARIABLES//
	////////////////////
	
    //////////////////
//////PUBLIC METHODS//
	//////////////////
	/**
	 * The query method for the connection manager which checks security and send query to correct connection.
	 * @param queryObject object - The query object to execute.
	 */
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
	/**
	 * Registers a connection for all provided aliases.
	 * @param connection {Connection} - The connection object to register.
	 * @param doqInterface {Interface} - The doq interface API to attach to the connection.
	 */
	this.RegisterConnection = function( connection, doqInterface ){
		connection.doqInterface = doqInterface;
		for( var i = 0; i < connection.registeredAs.length; i++ ){
			_connectionList[connection.registeredAs[i]] = connection;
		}
	};
	
	//CALL TO CONSTRUCTOR//
	Constructor.apply( this, arguments );
	//CALL TO CONSTRUCTOR//
});