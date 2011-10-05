DOQ API
=======

This is a interface programmed to make object transactions with databases easy to secure on many levels, serialize objects, and simply program. Programmed in JavaScript and tested with [nodeJS]( https://github.com/joyent/node).

Description
-----------

Built upon any database this API gives the ability to run a secure object relational databases. It has easy ways to add in more object types known as filters, and supports connection to multiple types of databases concurrently.

This project was made to make my job easier, more portable, and more flexible as a web developer. The the interface framework uses a custom extendable query language, security framework, and plug-in interface for adding new database, or custom object filters.

Example Databases
-----------------

- MySql ( Using 'db-mysql' )

Prebuilt Filters Objects
------------------------

- String
- Number
- CSV
- XML ( Partial XPath Support )

Road Map
--------

- Full XPath support, as well as the enhancements I wrote into the predecessor of DOQ
- INI filter map
- PostGreSQL example database
- A cleaner plug-in/object abstraction layer

License
-------
[OSL-3.0](http://www.opensource.org/licenses/OSL-3.0)

Copyright (c) 2011 by Steven Adams.