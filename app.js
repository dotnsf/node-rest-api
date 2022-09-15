//. app.js
var express = require( 'express' ),
    ejs = require( 'ejs' ),
    app = express();

//. env values
var API_SERVER = 'API_SERVER' in process.env ? process.env.API_SERVER : '' 
var DB_API = 'DB_API' in process.env ? 'db_work_sample' + DB_API : 'db';

var db = require( './api/' + DB_API );
app.use( '/api/db', db );

app.use( express.Router() );
app.use( express.static( __dirname + '/public' ) );

app.set( 'views', __dirname + '/views' );
app.set( 'view engine', 'ejs' );

//. index page
app.get( '/', function( req, res ){
  res.render( 'index', { API_SERVER: API_SERVER } );
});

//. listening port
var port = process.env.PORT || 8080;
app.listen( port );
console.log( "server starting on " + port + " ..." );

module.exports = app;
