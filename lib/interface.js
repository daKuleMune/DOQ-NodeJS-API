/*!
 * DOQ API: security, access, and object interface.
 * @version 0.0.1
 */

/**
 * Library version.
 */
exports.version = '0.0.1';
var compiler = require('bnf').Compiler;

/**
 * Language object to be interpreted by
 * @see Server.Constructor
 */
exports.Interface = function(){
	
	var _compiler = null;
	var _events = {
		"database":function( token ){
			console.log( token );
		}
	};
	
	function Constructor( ){
		_compiler = new compiler( );
		_compiler.CompileScript( __dirname + "/language.bnf" );
		_compiler.ImportEvents( _events );
	}
	
	this.Query = function( readZone, writeZone ){
		
	};
	
	//CALL TO CONSTRUCTOR//
	Constructor.call( this, arguments[0] );
	//CALL TO CONSTRUCTOR//
};