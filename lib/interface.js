/*!
 * DOQ API: security, access, and object interface.
 * @version 0.0.1
 */

/*!
 * Required modules.
 */
var compiler = require('bnf').Compiler;

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
	}
	
	this.IsAnonymous = function(){
		if( _userPref.name == undefined ){
			return true;
		}
		
		return false;
	};
	
	this.GetGroupnames = function(){
		if( _userPref.group != undefined ){
			return _userPref.group.split(",");
		}
		
		return [ "guest" ];
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
	var _events = {
		"script":function( token ){
			this.query = { tree:{}, nodeQuery:"" };
			this.currentTree = this.query.tree;
		},
		"connectionName":function( token ){
			this.query.connection = token.text;
		},
		"tableName":function( token ){
			this.currentTree.name = token.text;
			this.currentTree.query = "";
			this.currentTree.tree = { };
			this.currentTree = this.currentTree.tree;
			this.query.table = token.text;
		},
		"columnName":function( token ){
			this.currentTree.name = token.text;
			this.query.nodeQuery += token.text;
			this.currentTree.tree = {};
			this.currentTree = this.currentTree.tree;
		}
		,
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
	////////////////////
//////PUBLIC VARIABLES//
	////////////////////
	this.ConnectionManager = null;
	this.filters = {
		string:function( value ){
			return value;
		},
		number:function( value ){
			return parseInt( value );
		}
	};
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
			console.log( readZone );
			var script = _parser.ParseScriptString( readZone );
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