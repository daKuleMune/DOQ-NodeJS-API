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
	 * Constructor of the object
	 * @param userPref object - User default settings.
	 * @param doqInterface {Interface} - Interface object.
	 * @todo clean up the arguments for easier more defined use.
	 */
	function Constructor( userPref, doqInterface ){
		_interface = doqInterface;
		_userPref = userPref;
	}
	/////////////////////
//////PRIVATE VARIABLES//
	/////////////////////
	var _userPref = null;
	var _interface = null;
	//////////////////
//////PUBLIC METHODS//
	//////////////////
	this.Query = function( readZone, writeZone, callback ){
		_interface.Query( this, readZone, writeZone, callback );
	};
	
	this.GetUsername = function(){
		if( _userPref.name != undefined ){
			return _userPref.name;
		}
		
		return "guest";
	};
	
	this.GetConnectionId = function(){
		return _userPref.connection;
	};
	
	this.IsAnonymous = function(){
		if( _userPref.name == undefined ){
			return true;
		}
		
		return false;
	};
	
	//CALL TO CONSTRUCTOR//
	Constructor.call( this, arguments[0], arguments[1] );
	//CALL TO CONSTRUCTOR//
};
/**
 * Language object to be interpreted by
 * @see Server.Constructor
 */
exports.Interface = function(){
	function Constructor( connections ){
		if( typeof( connections ) == "string" ){
			connections = [ connections ];
		}
		var self = this;
		this.ConnectionManager = require( "./database.js" ).ConnectionManager;
		for( var i = 0; i < connections.length; i++ ){
			if( connections[i].substr( 0, 2 ) == "./" ){
				connections[i] = process.cwd() + connections[i].substr( 1 );
			}
			this.ConnectionManager.RegisterConnection( require( connections[i] ).Connection, this );
		}
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
	var _compiler = null;
	var _database = null;
	var _parser = null;
	var _preQueryStack = [];
	var _columnParser = null;
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
		}
	};
	///////////////////
//////PRIVATE METHODS//
	///////////////////
	/**
	 * 
	 */
	function _ExecuteQueryStack(){
		for( var i = 0; i < _preQueryStack.length; i++ ){
			this.Query( _preQueryStack[i].user, _preQueryStack[i].readZone, _preQueryStack[i].writeZone, _preQueryStack[i].callback );
		}
		_preQueryStack = null;
	}
	
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
				self.filters[name] = new (require(filters[f]).Filter)( _compiler );
				if( self.filters[name].includeInFilters ){
					includedFilters.push( name );
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
	this.ConnectionManager = null;
	this.filters = {};
	//////////////////
//////PUBLIC METHODS//
	//////////////////
	this.AddFilter = function( filterName, filterMethod ){
		
	};
	/**
	 * just needed some lt blue break on the code and give my eyes a little rest
	 * @param
	 * @param
	 * @param
	 * @param
	 */
	this.Query = function( user, readZone, writeZone, callback ){
		if( writeZone == undefined ){
			writeZone = null;
		}
		callback = callback || null;
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
				query.user = user;
				this.ConnectionManager.Query( query );
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
	 * im blue doba dee
	 */
	this.OpenUserConnection = function( userPrefs ){
		return new InterfaceUser( userPrefs, this );
	};
	
	
	//CALL TO CONSTRUCTOR//
	Constructor.call( this, arguments[0], arguments[1] );
	//CALL TO CONSTRUCTOR//
};