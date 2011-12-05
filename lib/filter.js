/*!
 * DOQ API: filter object framework
 * @version 0.0.3
 * @author Stev0 <steven@navolutions.com>
 */

/*!
 * Included modules.
 */
var compiler = require('bnf').Compiler;

/**
 * The data container for the filter.
 * @see FilterDataObject.Constructor
 */
function FilterDataObject(){
    /**
     * Constructor of the FilterDataObject
     * @param parser bnf.parser - The parser of the filter.
     * @param datastream string - The data for the object.
     * @param queryMethod function - Query method for executing queries from strings.
     * @param objectQueryMethod function - Query method for executing queries from objects.
     * @param queryable boolean - Is it even possible to query this data object?
     */
    function Constructor( parser, datastream, virtualFilter, parent, saveName ){
    	this.parser = parser;
    	this.parent = parent;
    	this.saveName = saveName;
    	this.dataStream = datastream;
    	_virtualFilter = virtualFilter;
    	Object.defineProperty( this, "value", {
			get:function(){
				return this.dataObject;
			},
			set:function( v ){
				//this.compiled = false;
				//this.dataStream = v;
			}
		} );
    	this.Creation();
    }
    
    /////////////////////
//////PRIVATE VARIABLES//
    /////////////////////
    var _virtualFilter = null;

    ///////////////////
//////PRIVATE METHODS//
    ///////////////////
  
    ////////////////////
//////PUBLIC VARIABLES//
    ////////////////////
    /**
     * The parser for the filters language.
     * @type {bnf.Parser}
     */
    this.parser = null;
    /**
     * The raw data stream for the object.
     * @type string
     */
    this.dataStream = "";
    /**
     * The compiled data object.
     * @type mixed
     */
    this.dataObject = null;
    /**
     * Parent data store for this data filter object.
     * @type DatabaseObject
     */
    this.parent = null;
    /**
     * Name of the how the item is saved into the database.
     * @type string
     */
    this.saveName = "";
    //////////////////
//////PUBLIC METHODS//
    //////////////////
    /**
     * Abstract object query method which calls the virtual filters Creation method.
     */
    this.Creation = function(){
		_virtualFilter.Creation.call( this );
    };
    /**
     * Abstract query method which calls the virtual filters Query method.
     */
    this.Query = function( queryString ){
    	if( _virtualFilter.Query ){
    		return _virtualFilter.Query.call( this, queryString );
    	}
    	else{
    		//Default Query just returns this object because it can't be or has not Query method//
    		return this;
    	}
    };
    /**
     * Abstract object query method which calls the virtual filters QueryObject method.
     */
    this.QueryObject = function( query ){
    	if( _virtualFilter.QueryObject ){
    		return _virtualFilter.QueryObject.call( this, query );
    	}
    	else{
    		//Default QueryObject just returns this object because it can't be or has not QueryObject method//
    		return this;
    	}
    };
    /**
     * Abstract object query method which calls the virtual filters Serialize method.
     */
    this.Serialize = function(){
    	if( _virtualFilter.Serialize ){
    		return _virtualFilter.Serialize.call( this );
    	}
    	else{
    		//Default Serialize just returns the dataObject
    		return this.dataObject;
    	}
    };
    /**
     * Issues a command to the data object to save the item into the database.
     */
    this.Save = function(){
    	this.parent.Save( this.saveName );
    };
    
    //CALL TO CONSTRUCTOR//
    Constructor.call( this, arguments[0], arguments[1], arguments[2], arguments[3], arguments[4] );
    //CALL TO CONSTRUCTOR//
}

/**
 * Abstract object for creating new filters
 * @see Filter.Constructor
 * @TODO - Need to find a better way to do JavaScript abstraction.
 */
exports.Filter = function(){
    /**
     * Constructor of the object
     * @param compiler bnf.Compiler - The BNF compiler to compile to filter language file.
     */
    function Constructor( compiler, child ){
    		{_Inherit.call( this, child )}
    	_compiler = compiler;
    	if( this.bnf != "" ){
    		child.bnf += '\n<columnName> ::= <_text>';
    		this.parseEvents["columnName"] = function( token ){
				this.query.column = token.text;
				this.currentTree.name = token.text;
				this.currentTree.tree = {};
				this.currentTree = this.currentTree.tree;
			};
			this.includeInFilters = true;
    	}
    }
    /////////////////////
//////PRIVATE VARIABLES//
    /////////////////////
    /**
     * The compiler for the filter, if it needs one.
     * @type {bnf.Compiler}
     */
    var _compiler = null;
    /**
     * The parser for the filter, if it needs one.
     * @type {bnf.Parser}
     */
    var _filterParser = null;
    
    ///////////////////
//////PRIVATE METHODS//
    ///////////////////
    
    ////////////////////
//////PUBLIC VARIABLES//
    ////////////////////
    /**
     * Check to see if this filter should be included in the list of filters in the column language layer, does it have a compiler?
     * @type boolean
     */
    this.includeInFilters = false;
    
    //////////////////
//////PUBLIC METHODS//
    //////////////////
    /**
     * Creation method for new data strings to compile.
     * @param dataString string - The raw data string.
     * @returns {FilterDataObject} - Compiled data object.
     */
    this.Create = function( itemSaveName, dataString, dataparent ){
    	return new FilterDataObject( _filterParser, dataString, this, dataparent, itemSaveName );
    };
    /**
     * Initializes the parser for this filter.
     * @param columnParser {bnf.Parser} - Column parser to include this filter into.
     */
    this.InitializeParser = function( columnParser ){
    	var self = this;
    	_compiler.CompileString( this.bnf, this.name, function( interpreter ){
    		_filterParser = _compiler.CreateParser( interpreter, self.parseEvents );
    		columnParser.IncludeLanguage( _filterParser );
    		_filterParser.IncludeLanguage( columnParser );
    	});
    };
    /**
     * Filter string query method, which turns into a query object that can be processed by the abstract filter.
     * @param queryString - String for the query run/execution path.
     */
    this.Query = function( queryString ){
    	//Turn the string into an object//
    	
    }
    //////////////////////
//////ABSTRACT VARIABLES//
    //////////////////////
    /**
     * The bnf syntax for the filter language, if any.
     * @type string
     */
	this.bnf = "";
    /**
     * The name of the filter language.
     * @type string
     */
    this.name = "";
    /**
     * The parser events for the filter language, if any.
     * @type assoArray
     */
	this.parseEvents = {};
    
    ////////////////////
//////ABSTRACT METHODS//
    ////////////////////
    
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
    Constructor.call( this, arguments[0], arguments[1] );
    //CALL TO CONSTRUCTOR//
};