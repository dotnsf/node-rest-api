//. db_work_sample.js
//. DB連携（メモリDBの稼働サンプル）
var express = require( 'express' ),
    bodyParser = require( 'body-parser' ),
    cors = require( 'cors' ),
    { v4: uuidv4 } = require( 'uuid' ),
    api = express();

//. env values
var settings_cors = 'CORS' in process.env ? process.env.CORS : '';

//. CORS
if( settings_cors ){
  var opt = {
    origin: settings_cors,
    optionsSuccessStatus: 200
  };
  api.use( cors( opt ) );
}

//. インメモリデータベース
var db = {};

//. POST メソッドで JSON データを受け取れるようにする
api.use( bodyParser.urlencoded( { extended: true } ) );
api.use( bodyParser.json() );
api.use( express.Router() );


//. 一件作成
api.createItem = function( item, id ){
  return new Promise( function( resolve, reject ){
    if( id ){
      if( db[id] ){
        resolve( { status: false, error: 'id duplicated.' } );
      }else{
        var t = ( new Date() ).getTime();
        item.created = t;
        item.updated = t;
        item.id = id;

        db[id] = item;
        resolve( { status: true, item: item } );
      }
    }else{
      resolve( { status: false, error: 'no id specified.' } );
    }
  });
};

//. 複数件作成
api.createItems = async function( items ){
  return new Promise( async function( resolve, reject ){
    if( items && items.length ){
      var count = 0;
      for( var i = 0; i < items.length; i ++ ){
        if( items[i].id ){
          var r = await api.createItem( items[i], items[i].id );
          if( r && r.status ){
            count ++;
          }
        }
      }
      resolve( { status: true, items: items, count: count } );
    }else{
      resolve( { status: false, error: 'no items' } );
    }
  });
};

//. 一件取得
api.readItem = function( id ){
  return new Promise( function( resolve, reject ){
    if( id ){
      if( db[id] ){
        resolve( { status: true, id: id, item: db[id] } );
      }else{
        resolve( { status: false, id: id, error: 'no item found for id = ' + id } );
      }
    }else{
      resolve( { status: false, error: 'no id specified.' } );
    }
  });
};

//. 複数件取得
api.readItems = function( limit, start ){
  return new Promise( function( resolve, reject ){
    var offset = ( start ? start : 0 );
    var size = ( limit ? limit : 0 );

    var count = 0;
    var items = [];
    Object.keys( db ).forEach( function( id ){
      if( start <= count ){
        if( size == 0 || count < offset + size ){
          items.push( db[id] );
        }
      }
      count ++;
    });
    resolve( { status: true, items: items } );
  });
};

//. 検索
api.queryItems = function( key, limit, start ){
  return new Promise( function( resolve, reject ){
    var offset = ( start ? start : 0 );
    var size = ( limit ? limit : 0 );
    key = ( key ? key : '' );
    if( key ){
      var items = [];
      Object.keys( db ).forEach( function( id ){
        if( JSON.stringify( db[id] ).indexOf( key ) > -1 ){
          items.push( db[id] );
          if( !limit ){
            size ++;
          }
        }
      });
      resolve( { status: true, items: items.slice( offset, offset + size ) } );
    }else{
      resolve( { status: false, error: 'no key specified.' } );
    }
  });
};

//. 一件更新
api.updateItem = function( item ){
  return new Promise( function( resolve, reject ){
    if( item && item.id ){
      if( db[item.id] ){
        var tmp = JSON.parse( JSON.stringify( db[item.id] ) );
        db[item.id] = item;
        var t = ( new Date() ).getTime();
        db[item.id].created = tmp.created;
        db[item.id].updated = t;
        resolve( { status: true, item: db[item.id] } );
      }else{
        resolve( { status: false, id: item.id, error: 'no item found for id = ' + item.id } );
      }
    }else{
      resolve( { status: false, error: 'no id found for your object' } );
    }
  });
};

//. 複数件更新
api.updateItems = function( items ){
  return new Promise( async function( resolve, reject ){
    if( items && items.length ){
      var count = 0;
      for( var i = 0; i < items.length; i ++ ){
        if( items[i].id ){
          var r = await api.updateItem( items[i] );
          if( r && r.status ){
            count ++;
          }
        }
      }
      resolve( { status: true, items: items, count: count } );
    }else{
      resolve( { status: false, error: 'no items' } );
    }
  });
};

//. 一件削除
api.deleteItem = function( id ){
  return new Promise( function( resolve, reject ){
    if( db[id] ){
      delete db[id];
      resolve( { status: true, id: id } );
    }else{
      resolve( { status: false, id: id, error: 'no item found for id = ' + id } );
    }
  });
};

//. 複数件削除
api.deleteItems = function(){
  return new Promise( function( resolve, reject ){
    db = {};
    resolve( { status: true } );
  });
};


api.post( '/item', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var item = req.body;
  if( typeof item.price == 'string' ){
    item.price = parseInt( item.price );
  }
  if( !item.id ){
    item.id = uuidv4();
  }

  api.createItem( item, item.id ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.post( '/items', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var items = req.body;
  items.forEach( function( item ){
    if( typeof item.price == 'string' ){
      item.price = parseInt( item.price );
    }
    if( !item.id ){
      item.id = uuidv4();
    }
  });

  api.createItems( items ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.get( '/item/:id', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var item_id = req.params.id;
  api.readItem( item_id ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.get( '/items', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var limit = 0;
  var start = 0;
  if( req.query.limit ){
    try{
      limit = parseInt( req.query.limit );
    }catch( e ){
    }
  }
  if( req.query.start ){
    try{
      start = parseInt( req.query.start );
    }catch( e ){
    }
  }
  api.readItems( limit, start ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.get( '/items/:key', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var key = req.params.key;
  var limit = 0;
  var start = 0;
  if( req.query.limit ){
    try{
      limit = parseInt( req.query.limit );
    }catch( e ){
    }
  }
  if( req.query.start ){
    try{
      start = parseInt( req.query.start );
    }catch( e ){
    }
  }

  api.queryItems( key, limit, start ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.put( '/item/:id', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var item_id = req.params.id;
  var item = req.body;
  if( typeof item.price == 'string' ){
    item.price = parseInt( item.price );
  }
  item.id = item_id;
  api.updateItem( item ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.put( '/items', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var items = req.body;
  items.forEach( function( item ){
    if( typeof item.price == 'string' ){
      item.price = parseInt( item.price );
    }
  });

  api.updateItems( items ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.delete( '/item/:id', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var item_id = req.params.id;
  api.deleteItem( item_id ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.delete( '/items', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  api.deleteItems().then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

//. api をエクスポート
module.exports = api;
