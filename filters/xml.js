/*!
 * DOQ API: Filter for csv files
 * @version 0.0.1
 */

/*!
 * Required modules.
 */
var filterObject = require( "../lib/filter.js" ).Filter;
var libxml = require( "../lib/libxmli.js" ).libxml;

exports.Filter = function(){
	
	this.name = "xml";
	
	this.bnf = '<syntax> ::= <columnName> <xpath>\n'
		+'<xpath> ::= <xpathStatments>\n'
		+'<xpathStatments> ::= <xpathStatment> | <xpathStatment> <xpathStatments>\n'
		+'<xpathStatment> ::= <scope> <xpathVariable> <argumentData>\n'
		+'<xpathVariable> ::= <attribute> <_text>\n'
		+'<argumentData> ::= "" | "[" <_owsp> <arguments> <_owsp> "]"\n'
		+'<arguments> ::= <arrayArg>\n'
		+'<arrayArg> ::= <_digits> | <attributeCheck>\n'
		+'<attributeCheck> ::= "@" <_text> <equateKey> <_literal>\n'
		+'<equateKey> ::= "="\n'
		+'<attribute> ::= "" | <isAttribute>\n'
		+'<isAttribute> ::= "@"\n'
		+'<scope> ::= "/" | "//"';

	this.parseEvents = {
		"xpath":function( token ){
			this.query.columnQuery = token.text;
		}/*,
		"scope":function( token ){
			this.query.columnQuery += token.text;
		},
		"xpathVariable":function( token ){
			this.query.columnQuery += token.text;
		},
		"arrayArg":function( token ){
			this.query.columnQuery += "[" + parseInt( token.text ) 1 + "]";
		}*/
	};
	
	this.QueryObject = function( query ){
		if( query.columnQuery != undefined ){
			if( query.columnQuery.substring( 0, 2 ) != "//" ){
				query.columnQuery = query.columnQuery.substring( 1 );
			}
			var searchStatment = this.dataObject.root().find( query.columnQuery );
			switch( query.type ){
			case "$":
				return searchStatment[0];
				break;
			case "*":
				if( query.isAttribute ){
					
				}
				else{
					return searchStatment;
				}
				break;
			default:
				console( "Query.type " + query.type + " is not supported by xml objects." );
				break;
			}
		}
		else{
			return this;
		}
	};

	this.Creation = function( ){
		this.dataObject = libxml.parseXmlString( "<__root>" + this.dataStream + "</__root>" );
		var self = this;
		this.dataObject.Save = function(){ self.Save() };
	};
	
	this.Serialize = function(){
		return this.dataObject.root().toString().replace( /\<__root\>/g, "" ).replace( /\<\/__root\>/g, "" );
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
