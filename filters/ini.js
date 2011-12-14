/*!
 * DOQ API: Filter for csv files
 * @version 0.0.2
 * @author Stev0 <steven@navolutions.com>
 */

/*!
 * Required modules.
 */
var filterObject = require( "../lib/filter.js" ).Filter;

exports.Filter = function(){
	
	this.name = "ini";

	this.bnf = '<syntax> ::= <group> <setting> | <setting>\n<group> ::= "/" <_text>\n<setting> ::= "." <_text>';

	this.parseEvents = {
		"group":function( token ){
			
		},
		"setting":function( token ){
			
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
	
	this.Serialize = function(){
		var serializedDataList = [];
		for( option in this.dataObject["_generic"] ){
			serializedDataList.push( option + '="' + this.dataObject["_generic"][option] + '"' );
		}
		for( catagory in this.dataObject ){
			if( catagory != "_generic" ){
				serializedDataList.push( "[" + catagory + "]" );
				for( option in this.dataObject[catagory] ){
					serializedDataList.push( option + '="' + this.dataObject[catagory][option] + '"' );
				}
			}
		}
		return serializedDataList.join( "\n" );
	};

	this.Creation = function( ){
		var lines = this.dataStream.split( "\n" );
		this.dataObject = { _generic:{} };
		var currentScope = this.dataObject._generic;
		for( var line = 0; line < lines.length; line++ ){
			var trimedLine = lines[line].trim();
			if( trimedLine != "" ){
				if( trimedLine[0] == "[" ){
					currentScope = this.dataObject[ trimedLine.substring( 1, trimedLine.length - 1 )] = {};
				}
				else{
					var controlPoint = trimedLine.search( /\=/ );
					var left = trimedLine.substring( 0, controlPoint ).trim();
					var right = trimedLine.substring( controlPoint + 1 ).trim();
					if( right[0] == '"' ){
						right = right.substring( 1, right.length - 1 );
					}
					currentScope[left] = right;
				}
			}
		}
		
		this.dataObject;
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
