/*!
 * DOQ API: Filter for xml files
 * @version 0.0.2
 * @author Stev0 <steven@navolutions.com>
 */

/*!
 * Required modules.
 */
var filterObject = require( "../lib/filter.js" ).Filter;
var libxml = require( "../lib/libxmli.js" ).libxml;

exports.Filter = function(){
	
	this.name = "xml";
	
	this.bnf = '<syntax> ::= <xpath> | <openingscope> <xpath>\n'
		+'<xpath> ::= <xpathStatments>\n'
		+'<xpathStatments> ::= <xpathStatment> | <xpathStatment> <scope> <xpathStatments>\n'
		+'<xpathStatment> ::= <xpathVariable> <argumentData>\n'
		+'<xpathVariable> ::= <attribute> <_text>\n'
		+'<argumentData> ::= "" | "[" <_owsp> <arguments> <_owsp> "]"\n'
		+'<arguments> ::= <argument>\n'
		+'<argument> ::= <_digits> | <attributeCheck>\n'
		+'<attributeCheck> ::= "@" <_text> <equateKey> <_literal>\n'
		+'<equateKey> ::= "="\n'
		+'<attribute> ::= "" | <isAttribute>\n'
		+'<isAttribute> ::= "@"\n'
		+'<openingscope> ::= <scope>\n'
		+'<scope> ::= "/" | "//"';

	this.parseEvents = {
		"syntax":function( token ){
			if( !this.query ){
				this.query = { };
				this.currentTree = {};
			}
			this.statments = [];
			this.query.columnQuery = "";
		},
		"xpath":function( token ){
			this.query.columnQuery += token.text;
		},
		"xpathStatment":function( token ){
			if( !this.statments ){
				this.statments = [];
			}
			this.statments.push( { query: token.text, arguments:[], nodeName:'' } );
		},
		"openingscope":function( token ){
			if( token.text == "//" ){
				this.query.columnQuery = "//";
			}
			else{
				this.query.columnQuery = "";
			}
		},
		"scope":function( token ){
			if( token.text == "//" ){
				this.hasGlobalSearch = true;
			}
		},
		"xpathVariable":function( token ){
			var nodeName = this.SeekNext( "_text" ).text;
			if( token.tokens[0].text != "" ){
				this.statments[this.statments.length - 1].isAttribute = true;
			}
			this.statments[this.statments.length - 1].nodeName = nodeName;
		},
		"argument":function( token ){
			var argumentConstruction = { };
			if( token.tokens[0].name == "attributeCheck" ){
				argumentConstruction.type = "atb";
				var atbCheck = this.SeekNext( "attributeCheck" );
				argumentConstruction.node = atbCheck.tokens[0].text;
				argumentConstruction.equate = atbCheck.tokens[1].text;
				argumentConstruction.compare = atbCheck.tokens[2].text;
			}
			this.statments[this.statments.length - 1].arguments.push( argumentConstruction );
		}
		/*,
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
	/**
	 * Rebuilds the XML from the starting node using the query statements to assume what it should be.
	 * @param startingNode jsxml.Element - The element used for the current build input.
	 * @param statements array - An array of statements generated from the query being compiled by bnf.
	 * @param buildFrom integer - The index in the statements to build into the starting node.
	 */
	function _RebuildStatments( startingNode, statements, buildFrom ){
		if( statements[buildFrom].arguments.length > 0 ){
			var error = false;
			var nodeName = statements[buildFrom].nodeName;
			var attributes = {};
			for( var i = 0; i < statements[buildFrom].arguments.length && error == false; i++ ){
				
				if( statements[buildFrom].arguments[i].type == "atb" ){
					switch( statements[buildFrom].arguments[i].equate ){
					case "=":
						var compareString = statements[buildFrom].arguments[i].compare;
						if( compareString.substring( 0, 1 ) == '"' || compareString.substring( 0, 1 ) == "'" ){
							compareString = compareString.substring( 1, compareString.length - 1 );
						}
						attributes[statements[buildFrom].arguments[i].node] = compareString;
						break;
					default:
						console.log( "Error xpath write query attempt to write for non equte attribute." );
						error = true;
						break;
					}
				}
				else{
					console.log( "XPath write method for other types of arguments has not been finished." );
					error = true;
				}
			}
			
			if( !error ){
				var newNode = startingNode.node( nodeName, attributes );
				if( statements.length > buildFrom + 1 ){
					_RebuildStatments.call( this, newNode, statements, buildFrom+1 );
				}
			}
		}
		else{
			var newNode = null;
			if( !statements[buildFrom].isAttribute ){
				newNode = startingNode.node( statements[buildFrom].nodeName );
			}
			
			if( statements.length > buildFrom + 1 ){
				_RebuildStatments.call( this, startingNode.node( statements[buildFrom].nodeName ), statements, buildFrom+1 );
			}
		}
	}
	
	this.QueryObject = function( query ){
		if( query.columnQuery != undefined ){
			if( query.write ){
				var queryResult = this.dataObject.root().find( query.columnQuery );
				if( queryResult.length == 0 ){
					if( !query.hasGlobalSearch ){
						var xpathQuery = this.parser.ParseScriptString( query.columnQuery );
						var rebuild = [ ];
						//Now we should strip back one step at a time and rebuild the query object//
						//Check each level to assume rebuild
						for( var i = 0; i < xpathQuery.statments.length; i++ ){
							rebuild.push( xpathQuery.statments[i].query );
							if( this.dataObject.root().find( rebuild.join( "/" ) ).length == 0 ){
								console.log( rebuild.join( "/" ) );
								rebuild.pop();
								break;
							}
						}
						
						if( rebuild.length > 0 ){
							_RebuildStatments.call( this, this.dataObject.root().get( rebuild.join( "/" ) ), xpathQuery.statments, xpathQuery.statments.length - rebuild.length );
						}
						else{
							_RebuildStatments.call( this, this.dataObject.root(), xpathQuery.statments, 0 );
						}
						
						rebuild = [];
						if( xpathQuery.statments[xpathQuery.statments.length - 1].isAttribute ){
							for( var i = 0; i < xpathQuery.statments.length; i++ ){
								rebuild.push( xpathQuery.statments[i].query );
							}
							
							rebuild.pop();
							var buildPoint = this.dataObject.root().get( rebuild.join( "/" ) );
							if( buildPoint ){
								buildPoint.attr( xpathQuery.statments[xpathQuery.statments.length - 1].nodeName, query.write );
							}
							else{
								console.log( "Rebuilding of the query failed. ('"+query.columnQuery+"')" );
							}
						}
						else{
							console.log( "Setting values of nodes is not implemented yet" );
						}
						
					}
					else{
						console.log( "Can't rebuild queries that have global searchs '//'" );
					}
				}
				else{
					console.log( "The query of the call when there is a preset is not defined in xml.js filter." );
				}
				console.log( this.dataObject.root().toString() );
				//this.Save();
				
				//Creating to base nodes... why?
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
