/*!
 * DOQ API: security framework
 * @version 0.0.1
 */

/*!
* Module dependencies.
*/
var fs = require( "fs" );
var libxml = require( "./libxmli.js" ).libxml;


/**
 * Enumeration for permission types.
 */
PermissionType = { read:0, write:1, execute:2 };

/**
 * The DOQ catalogue for security, filter object definition, and many of the sweet optimizations.
 * @see Catalogue.Constructor
 * @returns {Catalogue}
 */
exports.Catalogue = function(){
	/**
	 * Constructor method.
	 * @param catalogueFile string - Location of the file used for the catalogue.
	 */
	function Constructor( catalogueFile ){
		var self = this;
		fs.readFile( catalogueFile, function( error, data ){
			if( error ) throw error;
			_catalogue = libxml.parseXmlString( data.toString() );
			if( _catalogue.root().attr( "logLevel" ) ){
				_logLevel =  _catalogue.root().attr( "logLevel" );
			}
			if( _catalogue.root().attr( "admins" ) ){
				_admins =  _catalogue.root().attr( "admins" ).split( "," );
			}
			_connections = _catalogue.root().get( "connections" );
			_CreateCatalogueTypeMap.call( self );
			_InitUserGroupings.call( self );
		} );
	}
	/////////////////////
//////PRIVATE VARIABLES//
	/////////////////////
	var _catalogue = null;
	var _connections = null;
	var _admins = [];
	var _logLevel = "secure";
	var _userBaseAct = {};
	var _groupBaseAct = {};
	var _baseGroupBinding = {};
	var _baseUserBinding = {};
	var _baseAct = "01";
	var _allowAnonymous = false;
	var _maxAnonymousQueries = 25;
	var _maxAttemptedQueries = 0;
	var _lockOutTime = 24;
	var _userGroups = {};
	////////////////////
//////PUBLIC VARIABLES//
	////////////////////
	this.typeMap = {};
	this.defaultFilter = "";
	///////////////////
//////PRIVATE METHODS//
	///////////////////
	function _BuildAccessModal( accessNode, treePointer, passedModal ){
		if( accessNode == null ){
			console.log( "Requested unknown area of the database" );
			return passedModal;
		}
		if( accessNode.attr( "allowAnonymous" ) ){
			var allowing = accessNode.attr( "allowAnonymous" );
			if( allowing == "yes" || allowing == "true" ){
				passedModal.allowAnonymous = true;
			}
			else{
				passedModal.allowAnonymous = false;
			}
		}
		if( accessNode.attr( "baseAct" ) ){
			passedModal.baseAct = accessNode.attr( "baseAct" );
		}
		if( accessNode.attr( "groupAct") ){
			_UpdateBuildGrouping.call( this, accessNode.attr( "groupAct"), passedModal.groups, _groupBaseAct );
		}
		if( accessNode.attr( "userAct") ){
			_UpdateBuildGrouping.call( this, accessNode.attr( "userAct"), passedModal.users, _userBaseAct );
		}
		
		if( accessNode.attr( "indexBy" ) ){
			treePointer.primary = accessNode.attr( "indexBy" );
		}
		
		if( treePointer.tree.name ){
			return _BuildAccessModal.call( this, accessNode.get( "node[@id='"+treePointer.tree.name+"']" ), treePointer.tree, passedModal );
		}
		
		return passedModal;
	};
	
	/**
	 * Creates the default baseAct for users, and groups for the entire catalogue.
	 * @param grouping {libxmljs.Element} - The element node for the grouping tree, users/groups
	 * @param groupModal assoArray - The storage array for the grouping.
	 */
	function _BuildBaseGrouping( grouping, groupModal ){
		if( grouping != undefined ){
			var defaultAction =  false;
			if( grouping.attr( "defaultAccess" ) && ( grouping.attr( "defaultAccess" ) == "on" ) ){
				defaultAction = true;
			}
			var children = grouping.childNodes();
			for( var i = 0; i < children.length; i++ ){
				var childDefault = defaultAction;
				if( children[i].name() != "text" ){
					if( children[i].attr( "defaultAccess" ) ){
						if( children[i].attr( "defaultAccess" ) == "on" ){
							childDefault = true;
						}
						else{
							childDefault = false;
						}
					}
					
					if( childDefault == true ){
						groupModal[children[i].attr( "id" )] = children[i].attr( "baseAct" );
					}
				}
			}
		}
	}
	
	function _CreateCatalogueTypeMap( ){
		var filters = _connections.find( "//node[@filter]" );
		for( var n = 0; n < filters.length; n++ ){
			var nodeTrace = _TraceNode.call( this, filters[n] );
			if( !this.typeMap[nodeTrace.connection] ){
				this.typeMap[nodeTrace.connection] = {};
			}
			var currentObjectTrace = this.typeMap[nodeTrace.connection];
			for( var t = 0; t < nodeTrace.traces.length - 1; t++ ){
				if( !currentObjectTrace[nodeTrace.traces[t]] ){
					currentObjectTrace[nodeTrace.traces[t]] = {};
				}
				currentObjectTrace = currentObjectTrace[nodeTrace.traces[t]];
			}
			currentObjectTrace[nodeTrace.traces[nodeTrace.traces.length - 1]] = filters[n].attr( "filter" );
		}
	};
	
	function _TraceNode( node ){
		var trace = [];
		while( node.name() != "connection" ){
			trace.push( node.attr( "id" ) );
			node = node.parent();
		}
		return { connection:node.attr( "id" ), traces:trace.reverse() };
	}

	function _InitUserGroupings( ){
		//Grouping defaults
		if( _connections.attr( "baseAct" ) ){
			_baseAct = _connections.attr( "baseAct" );
		}
		var groups = _catalogue.root().find( "groups/group" );
		for( var i = 0; i < groups.length; i++ ){
			_groupBaseAct[groups[i].attr( "id" )] =  groups[i].attr( "baseAct" );
		}
		
		var users = _catalogue.root().find( "users/user" );
		for( var i = 0; i < users.length; i++ ){
			if( users[i].attr( "baseAct" ) ){
				_userBaseAct[users[i].attr( "id" )] =  users[i].attr( "baseAct" );
			}
			else{
				_userBaseAct[users[i].attr( "id" )] = _baseAct;
			}
			if( users[i].attr( "groups" ) ){
				_userGroups[users[i].attr("id")] = users[i].attr( "groups" ).split( "," );
			}
		}
		//Defaults
		if( _connections.attr( "baseAct" ) ){
			_baseAct = _connections.attr( "baseAct" );
		}
		if( _connections.attr( "allowAnonymous" ) && (  _connections.attr( "allowAnonymous" ) == "yes" || _connections.attr( "allowAnonymous" ) == "true" ) ){
			_allowAnonymous = true;
		}
		if( _connections.attr( "maxAnonymousQueries" ) ){
			_maxAnonymousQueries = parseInt( _connections.attr( "maxAnonymousQueries" ) );	
		}
		if( _connections.attr( "maxAttemptedQueries" ) ){
			_maxAttemptedQueries = parseInt( _connections.attr( "maxAttemptedQueries" ) );	
		}
		if( _connections.attr( "lockOutTime" ) ){
			_lockOutTime = parseInt( _connections.attr( "lockOutTime" ) );	
		}
		if( _connections.attr( "defaultFilter" ) ){
			this.defaultFilter = _connections.attr( "defaultFilter" );
		}
		
		_BuildBaseGrouping.call( this, _catalogue.root().get( "groups" ), _baseGroupBinding );
		_BuildBaseGrouping.call( this, _catalogue.root().get( "users" ), _baseUserBinding );
	}
	
	function _UpdateBuildGrouping( grouping, oldGrouping, groupChain ){
		var groups = grouping.split( "," );
		for( var i = 0; i < groups.length; i++ ){
			var groupSplit = groups[i].split(":");
			if( !oldGrouping[groupSplit[0]] ){
				oldGrouping[groupSplit[0]] = groupChain[groupSplit[0]] || _baseAct;
			}
			
			if( groupSplit.length > 1 ){
				oldGrouping[groupSplit[0]] = groupSplit[1];
			}
		}
	}
	
	/**
	 * Check the octal value to make sure the requested permission is allow in the given case.
	 * @todo I think this could be done in a faster way.
	 * @param octalValue
	 * @param request
	 * @returns {Boolean}
	 */
	function _PermissionOctalCompare( octalValue, request ){
		switch( octalValue ){
		case "07":
			return true;
			break;
		case "06":
			if( request == PermissionType.read || request == PermissionType.write ){
				return true;
			}
			break;
		case "05":
			if( request == PermissionType.read || request == PermissionType.execute ){
				return true;
			}
			break;
		case "04":
			if( request == PermissionType.read ){
				return true;
			}
			break;
		case "03":
			if( request == PermissionType.execute || request == PermissionType.write ){
				return true;
			}
			break;
		case "02":
			if( request == PermissionType.write ){
				return true;
			}
			break;
		case "01":
			if( request == PermissionType.execute ){
				return true;
			}
			break;
		case "00":
			return false;
			break;
		}
		
		return false;
	}
	function _CheckUserAccess( user, secureModal, request ){
		//Allow Anonymous?
		if( user.isAnonymous && secureModal.allowAnonymous == false ){
			console.log( "No user, add user IP into catalogue behavior list." );
			return false;
		}
		//If BaseAct
		if( _PermissionOctalCompare.call( this, secureModal.baseAct, request ) ){
			return true;
		}
		
		//If UserAct
		if( _PermissionOctalCompare.call( this, secureModal.users[user.name], request ) ){
			return true;
		}
		
		//If GroupAct
		for( var i = 0; i < user.groups.length; i++ ){
			if( _PermissionOctalCompare.call( this, secureModal.groups[user.groups[i]], request ) ){
				return true;
			}
		}
		return false;
	}
	
	function _BuildCatalogueStrings( query ){
		//Query catalogue string
		query.catalogueString = query.connection + query.tree.name;
		//Primary catalogue string
	}
	//////////////////
//////PUBLIC METHODS//
	//////////////////
	/**
	 * Checks to see if access can be granted for query
	 * @param query [QueryObject] - The query to check for access.
	 * @returns boolean - Was access granted?
	 */
	this.AccessGrant = function( query ){
		var groups = _userGroups[query.user.GetUsername()] || [ "guest" ];
		var user = { name:query.user.GetUsername(), groups:groups, isAnonymous:query.user.IsAnonymous() };
		//What kind of access does the query request?
		var requestedPermission = PermissionType.read;
		if( query.write ){
			requestedPermission = PermissionType.write;
		}
		if( query.type == "!" ){//Array = *, Object = $
			requestedPermission = PermissionType.execute;
		}
		
		var secureModal = {
			allowAnonymous:_allowAnonymous,
			baseAct:_baseAct,
			groups:{},
			users:{}
		};
		var connection = _connections.get( "connection[@id='" + query.connection + "']" );
		for( i in _baseGroupBinding ){
			secureModal.groups[i] = _baseGroupBinding[i];
		}
		for( i in _baseUserBinding ){
			secureModal.users[i] = _baseUserBinding[i];
		}
		_BuildAccessModal.call( this, connection, query, secureModal );
		if( _CheckUserAccess.call( this, user, secureModal, requestedPermission ) ){
			_BuildCatalogueStrings.call( this, query );
			return true;
		}
		
		return false;
	};
	
	//CALL TO CONSTRUCTOR//
	Constructor.call( this, arguments[0], arguments[1] );
	//CALL TO CONSTRUCTOR//
};