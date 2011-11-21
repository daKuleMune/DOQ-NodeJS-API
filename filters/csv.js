/*!
 * DOQ API: Filter for csv files
 * @version 0.0.1
 */

/*!
 * Required modules.
 */
var filterObject = require( "../lib/filter.js" ).Filter;

exports.Filter = function(){
	
	this.name = "csv";

	this.bnf = '<syntax> ::= <columnName> <iter>\n<iter> ::= "[" <_owsp> <_digits> <_owsp> "]"';

	this.parseEvents = {
		"iter":function( token ){
			this.query.columnQuery = this.SeekNext( "_digits" ).text;
		}
	};
	
	this.QueryObject = function( query ){
		//query.type
		if( query.columnQuery != undefined ){
			return this.dataObject[query.columnQuery];
		}
		else{
			return this;
		}
	};

	this.Creation = function( ){
		this.dataObject = this.dataStream.split( "," );
	};
	
	//ABSTRACTION LAYER//
	var _parent = null;
	function _Inherit( ){
		_parent = new filterObject( arguments[0], this );
		for( i in _parent ){
			if( !this[i] ){
				this[i] = _parent[i];
			}
		}
	}
	_Inherit.apply( this, arguments );
	//ABSTRACTION LAYER//
};
