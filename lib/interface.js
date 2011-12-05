/*!
 * DOQ API: security, access, and object interface.
 * @version 0.0.1
 */

/*!
 * Required modules.
 */
var compiler = require('bnf').Compiler;
var fs = require('fs');

/**
 * Library version.
 * @type string
 */
exports.version = '0.0.1';

/**
 * User object for interface user interaction convenience.
 * @see InterfaceUser.Constructor
 * @returns {InterfaceUser}
 */
InterfaceUser = function(){
	/**
	 * Constructor of the InterfaceUser
	 * @param userPref object - User default settings.
	 * @param doqInterface {Interface} - Interface object.
	 * @TODO - clean up the arguments for easier more defined use.
	 */
	function Constructor( userPref, doqInterface ){
		_interface = doqInterface;
		_userPref = userPref;
	}
	
	/////////////////////
//////PRIVATE VARIABLES//
	/////////////////////
	/**
	 * The doq interface API.
	 * @type {Interface}
	 */
	var _interface = null;
	/**
	 * The user preferences.
	 * @type object
	 * @TODO clean this object up for easier use.
	 */
	var _userPref = null;
	/**
	 * Associative array of queries saved by the user.
	 * @type assoArray
	 */
	var _savedQueries = {};
	
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
	 * Gets the user name from _userPref.name
	 * @returns string - The user name or guest.
	 */
	this.GetUsername = function(){
		if( _userPref.name != undefined ){
			return _userPref.name;
		}
		
		return "guest";
	};
	/**
	 * Gets the connection id from _userPref.connection.
	 * @returns string - The connection id.
	 */
	this.GetConnectionId = function(){
		return _userPref.connection;
	};
	/**
	 * Checks if the user is an anonymous user.
	 * @returns boolean - Is the user anonymous?
	 */
	this.IsAnonymous = function(){
		if( _userPref.name == undefined ){
			return true;
		}
		
		return false;
	};
	/**
	 * Convenience method to execute a query from the user rather then the interface, which would see require a user.
	 * @param readZone string - The read/execution path of the query, accepts #queryId for saved user queries.
	 * @param writeZone string - The value to write into the path once it is executed successfully.
	 * @param callback function - Callback method to send value to.
	 */
	this.Query = function( readZone, writeZone, callback, onPrimaryChange ){
		if( readZone[0] == "#" ){
			readZone = readZone.substring( 1 );
			
			var charPtr = 0;
			while( readZone[charPtr].search( /[A-Za-z]/ ) != -1 ){
				charPtr++;
			}
			var readExtention = readZone.substring( charPtr );
			readZone = readZone.substring( 0, charPtr );
			if( _savedQueries[readZone] ){
				readZone = _savedQueries[readZone] + readExtention;
			}
			else{
				console.log( "Error couldn't find read zone id " + readZone );
			}
		}
		_interface.Query( this, readZone, writeZone, callback, onPrimaryChange );
	};
	/**
	 * Saves a query that can later be used without a need to recall without identifying characteristics.
	 * @param readZone string - The query to recall.
	 * @param id string - The id to use to recall, only upper and lower case letters!
	 */
	this.SaveQuery = function( readZone, id ){
		_savedQueries[id] = readZone;
	};
	
	//CALL TO CONSTRUCTOR//
	Constructor.call( this, arguments[0], arguments[1] );
	//CALL TO CONSTRUCTOR//
};
/**
 * Interface with DOQ API 
 * @see Interface.Constructor
 */
exports.Interface = new ( function(){
	/**
	 * Constructor of the Interface
	 * @param connections mixed - String or array of connection files to load.
	 */
	function Constructor( connections ){
		var self = this;
		_compiler = new compiler( );
		_compiler.CompileScript( __dirname + "/language.bnf", "doq", function( interpreter ){
			_parser = _compiler.CreateParser( interpreter, _events );
			_CompileFilters.call( self );
			_ExecuteQueryStack.call( self );
		} );
	}
	
	/////////////////////
//////PRIVATE VARIABLES//
	/////////////////////
	/**
	 * Parser for the column attachment to the doq to execute the filters that have parsers and custom syntax.
	 * @type {bnf.Parser}
	 */
	var _columnParser = null;
	/**
	 * Compiler for doq queries.
	 * @type {bnf.Compiler}
	 */
	var _compiler = null;
	/**
	 * The parse events for the doq queries.
	 * @type assoArray
	 */
	var _events = {
		"script":function( token ){
			this.query = { tree:{}, nodeQuery:"", connectionNode:0 };
			this.currentTree = this.query.tree;
		},
		"connectionName":function( token ){
			this.query.connection = token.text;
		},
		"tableName":function( token ){
			this.currentTree.name = token.text;
			this.currentTree.query = null;
			this.currentTree.tree = { };
			this.query.table = token.text;
		},
		"column":function( token ){
			if( token.text != "" ){
				this.currentTree = this.currentTree.tree;
				this.columnQuery = {};
			}
		},
		"tableQuery":function( token ){
			this.currentTree.query = [ [] ];
		},
		"tableSeperator":function( token ){
			if( token.text == "or" ){
				this.currentTree.query.push( [] );
			}
		},
		"tableStatment":function( token ){
			//<tableStatment> ::= <tableStatmentVar> <_owsp> <logicSwitch> <_literal>
			var statmentObject = {};
			statmentObject.variable = this.SeekNext( "_text" ).text;
			statmentObject.exp = this.SeekNext( "tableLogicSwitch" ).text;
			statmentObject.literal = this.SeekNext( "_literal" ).text;
			this.currentTree.query[this.currentTree.query.length-1].push( statmentObject );
		},
		"tableReturnCaret":function( token ){
			if( !token.text == "*" ){
				this.query.connectionNode = parseInt( token.text );
			}
			else{
				this.query.connectionNode = token.text;
			}
			
		},
		"selectionStyle":function( token ){
			this.query.type = token.text;
		},
		"defaultValue":function( token ){
			var defaultValue =  this.SeekNext( "_literal" ).text;
			this.query.defaultValue = defaultValue.substring( 1, defaultValue.length - 1 );
		}
	};
	/**
	 * Array of filters that where compiled.
	 * @type array
	 */
	var _compiledFilters = [];
	/**
	 * Parser for the doq language.
	 * @type {bnf.Parser}
	 */
	var _parser = null;
	/**
	 * Stack of queries that were made while the interface booted up and initialized.
	 * @type array
	 */
	var _preQueryStack = [];
	
	///////////////////
//////PRIVATE METHODS//
	///////////////////
	/**
	 * Compiles the pre-attached filters in the filters directory.
	 */
	function _CompileFilters(){
		var filterDirectory = __dirname.split( "/" );
		filterDirectory.pop();
		filterDirectory = filterDirectory.join( "/" );
		var self = this;
		_WalkDir.call( this, filterDirectory + "/filters", function( err, filters ){
			var includedFilters = [];
			for( var f = 0; f < filters.length; f++ ){
				var name = filters[f].split( "/" );
				name = name[name.length - 1];
				name = name.replace( /\.js$/, "" );
				var filter = new (require(filters[f]).Filter)( _compiler );
				self.filters[filter.name] = filter;
				if( self.filters[filter.name].includeInFilters ){
					includedFilters.push( filter.name );
					_compiledFilters.push( filter.name );
				}
			}
			var bnfSyntax = "";
			var column = '<columnName> ::= <_text>\n'
				+'<selectionStyle> ::= <selectAll> | <selectFirst> | <selectExecute>\n'
				+'<selectAll> ::= "*"\n'
				+'<selectFirst> ::= "$"\n'
				+'<selectExecute> ::= "!"';
			if( includedFilters.length > 0 ){
				bnfSyntax = '<syntax> ::= <column> <selectionStyle>\n<column> ::= <columnName> | #' + includedFilters.join( ' | #' ) + '\n' + column;
			}
			else{
				bnfSyntax = '<syntax> ::= <columnName> <selectionStyle>\n' + column;
			}

			_compiler.CompileString( bnfSyntax, "column", function( interpreter ){
				_columnParser = _compiler.CreateParser( interpreter, {
					"syntax":function( ){
						if( !this.query ){
							this.query = { tree:{} };
							this.currentTree = this.query.tree;
						}
					},
	    			"columnName":function( token ){
	    				this.query.column = token.text;
	    				this.currentTree.name = token.text;
	    				this.currentTree.tree = {};
	    				this.currentTree = this.currentTree.tree;
	    			},
	    			"selectionStyle":function( token ){
	    				this.query.type = token.text;
	    			}
	    			
	    		} );
	    		_parser.IncludeLanguage( _columnParser );
	    		for( var i = 0; i < includedFilters.length; i++ ){
					self.filters[includedFilters[i]].InitializeParser( _columnParser );
				}
	    	});
		} );
	}
	/**
	 * Executes all the queries in the _preQueryStack and sets it to null.
	 */
	function _ExecuteQueryStack(){
		for( var i = 0; i < _preQueryStack.length; i++ ){
			this.Query( _preQueryStack[i].user, _preQueryStack[i].readZone, _preQueryStack[i].writeZone, _preQueryStack[i].callback );
		}
		_preQueryStack = null;
	}
	/**
	 * Helper method for walking a directories files.
	 * @param dir string - Directory to walk.
	 * @param callback function - Method to call back when the walk is done, sending an array of files from the walk.
	 */
	function _WalkDir(dir, callback){
		var results = [];
		fs.readdir(dir, function(err, list) {
			if (err) return callback(err);
			var pending = list.length;
			list.forEach(function(file) {
				file = dir + '/' + file;
				fs.stat(file, function(err, stat) {
					if( stat && !stat.isDirectory() ) {
						results.push(file);
					}
					if (!--pending) callback(null, results);
				});
			});
	    });
	}
	
	////////////////////
//////PUBLIC VARIABLES//
	////////////////////
	/**
	 * The connection manager.
	 * @type {ConnectionManager}
	 */
	this.connectionManager = null;
	/**
	 * The filters attached to the interface.
	 * @type assoArray
	 */
	this.filters = {};
	
	//////////////////
//////PUBLIC METHODS//
	//////////////////
	/**
	 * Adds connections to the interface.
	 * @param connections mixed - String or array of connections to be added.
	 */
	this.AddConnections = function( connections ){
		if( typeof( connections ) == "string" ){
			connections = [ connections ];
		}
		
		this.connectionManager = require( "./database.js" ).ConnectionManager;
		for( var i = 0; i < connections.length; i++ ){
			if( connections[i].substr( 0, 2 ) == "./" ){
				connections[i] = process.cwd() + connections[i].substr( 1 );
			}
			this.connectionManager.RegisterConnection( require( connections[i] ).Connection, this );
		}
	};
	/**
	 * Method to add a runtime filter.
	 * @TODO - This method needs to be finished.
	 */
	this.AddFilter = function( filterName ){
		
	};
	/**
	 * Gets the array of compiled filters.
	 * @returns array - _compiledFilers.
	 * TODO make it return a non editable copy of the private variable.
	 */
	this.GetCompiledFilters = function(){
		return _compiledFilters;
	};
	/**
	 * Doq interface query method, what this whole thing is for.
	 * @param readZone string - The read/execution path of the query.
	 * @param writeZone string - The value to write into the path once it is executed successfully.
	 * @param callback function - Callback method to send value to.
	 */
	this.Query = function( user, readZone, writeZone, callback, onPrimaryChange ){
		if( writeZone == undefined ){
			writeZone = null;
		}
		callback = callback || null;
		onPrimaryChange = onPrimaryChange || null;
		if( _parser != null ){
			var script = _parser.ParseScriptString( readZone );
			if( script.query ){
				var query = script.query;
				if( writeZone != null ){
					query.write = writeZone;
				}
				if( callback != null ){
					query.callback = callback;
				}
				query.onPrimaryChange = onPrimaryChange;
				query.user = user;
				this.connectionManager.Query( query );
			}
			else{
				console.log( "Error evaluating script. " + readZone );
			}
		}
		else{
			_preQueryStack.push( { user:user, readZone:readZone, writeZone:writeZone, callback:callback } );
		}
	};
	/**
	 * Compiles a query to a column and returns the query string.
	 * @param query string - The query string to be compiled.
	 */
	this.CompileColumnQuery = function( query ){
		return _columnParser.ParseScriptString( query ).query;
	};
	/**
	 * Takes userPrefs and creates a new InterfaceUser.
	 * @param userPrefs object - User preferences.
	 * @TODO - Make this easier to work with.
	 */
	this.OpenUserConnection = function( userPrefs ){
		return new InterfaceUser( userPrefs, this );
	};
	
	//CALL TO CONSTRUCTOR//
	Constructor.call( this, arguments[0], arguments[1] );
	//CALL TO CONSTRUCTOR//
} );