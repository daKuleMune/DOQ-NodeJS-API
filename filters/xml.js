/*!
 * DOQ API: Filter for csv files
 * @version 0.0.1
 */

/*!
 * Required modules.
 */
var filterObject = require( "../lib/filter.js" ).Filter;
var libxml = require( "libxmljs" );

exports.Filter = function(){
	
	this.name = "xml";

	this.bnf = '<syntax> ::= <columnName> <xpath>\n'+
		'<xpath> ::= "/" <_text>';

	this.parseEvents = {
		"xpath":function( token ){
			this.query.columnQuery = token.text;
		}
	};
	
	this.QueryObject = function( query ){
		if( query.columnQuery != undefined ){
			return this.dataObject.root.find( query.columnQuery );
		}
		else{
			return this.dataObject;
		}
	};

	this.Creation = function( ){
		this.dataObject = libxml.parseXmlString( "<__root>" + this.dataStream + "</__root>" ); ;
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
