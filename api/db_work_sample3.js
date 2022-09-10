//. db_work_sample3.js
//. 環境変数 DATABASE_URL の有無で永続性 DB を使うか、メモリ DB を使うかを決めるサンプル
var express = require( 'express' ),
    bodyParser = require( 'body-parser' ),
    cors = require( 'cors' ),
    request = require( 'request' ),
    { v4: uuidv4 } = require( 'uuid' ),
    api = express();

//. env values
var database_url = 'DATABASE_URL' in process.env ? process.env.DATABASE_URL : ''; 
var settings_cors = 'CORS' in process.env ? process.env.CORS : '';

//. CORS
if( settings_cors ){
  var opt = {
    origin: settings_cors,
    optionsSuccessStatus: 200
  };
  api.use( cors( opt ) );
}

var db = {};
var db_headers = { 'Accept': 'application/json' };
if( database_url ){
  //. CouchDB/Cloudant データベース
  db = '';

  var tmp = database_url.split( '/' );
  if( tmp.length > 0 ){
    db = tmp[tmp.length-1];
  }

  tmp = database_url.split( '//' );
  if( tmp.length > 0 ){
    tmp = tmp[1].split( '@' );
    if( tmp.length > 0 ){
      var db_basic = Buffer.from( tmp[0] ).toString( 'base64' );
      db_headers['Authorization'] = 'Basic ' + db_basic;
    }
  }

  //. 初期化時に DB が存在していない場合は作成しておく
  setTimeout( async function(){
    var r0 = await api.readDb();
    if( r0 && !r0.status ){
      await api.createDb();
    }
  }, 1000 );
}

//. POST メソッドで JSON データを受け取れるようにする
api.use( bodyParser.urlencoded( { extended: true } ) );
api.use( bodyParser.json() );
api.use( express.Router() );


//. DB情報取得
api.readDb = function(){
  return new Promise( function( resolve, reject ){
    if( database_url ){
      if( db ){
        var option = {
          url: database_url,
          method: 'GET',
          headers: db_headers
        };
        request( option, function( err, res, body ){
          if( err ){
            resolve( { status: false, error: err } );
            }else{
            if( typeof body == 'string' ){ body = JSON.parse( body ); }
            resolve( { status: true, result: body } );
          }
        });
      }else{
        resolve( { status: false, error: 'no db' } );
      }
    }else{
      resolve( { status: true } );
    }
  });
}

//. DB新規作成
api.createDb = function(){
  return new Promise( function( resolve, reject ){
    if( database_url ){
      if( db ){
        var option = {
          url: database_url,
          method: 'PUT',
          headers: db_headers
        };
        request( option, function( err, res, body ){
          if( err ){
            resolve( { status: false, error: err } );
          }else{
            if( typeof body == 'string' ){ body = JSON.parse( body ); }
            resolve( { status: true, result: body } );
          }
        });
      }else{
        resolve( { status: false, error: 'no db' } );
      }
    }else{
      resolve( { status: true } );
    }
  });
}

//. DB削除
api.deleteDb = function(){
  return new Promise( function( resolve, reject ){
    if( database_url ){
      if( db ){
        var option = {
          url: database_url,
          method: 'DELETE',
          headers: db_headers
        };
        request( option, function( err, res, body ){
          if( err ){
            resolve( { status: false, error: err } );
          }else{
            resolve( { status: true, result: body } );
          }
        });
      }else{
        resolve( { status: false, error: 'no db' } );
      }
    }else{
      resolve( { status: true } );
    }
  });
}

//. 一件作成
api.createItem = function( item, id ){
  return new Promise( function( resolve, reject ){
    if( database_url ){
      if( db ){
        var t = ( new Date() ).getTime();
        item.created = t;
        item.updated = t;

        var option = {
          url: database_url + '/' + id,
          method: 'PUT',
          json: item,
          headers: db_headers
        };
        request( option, function( err, res, body ){
          if( err ){
            resolve( { status: false, error: err } );
          }else{
            resolve( { status: true, item: body } );
          }
        });
      }else{
        resolve( { status: false, error: 'no db' } );
      }
    }else{
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
    }
  });
};

//. 複数件作成
api.createItems = async function( items ){
  return new Promise( async function( resolve, reject ){
    if( database_url ){
      if( db ){
        var t = ( new Date() ).getTime();
        for( var i = 0; i < items.length; i ++ ){
          items[i].created = t;
          items[i].updated = t;
        }
  
        var option = {
          url: database_url + '/_bulk_docs',
          method: 'POST',
          json: { docs: items },
          headers: db_headers
        };
        request( option, function( err, res, body ){
          if( err ){
            resolve( { status: false, error: err } );
          }else{
            resolve( { status: true, items: body } );
          }
        });
      }else{
        resolve( { status: false, error: 'no db' } );
      }
    }else{
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
    }
  });
};

//. 一件取得
api.readItem = function( id ){
  return new Promise( function( resolve, reject ){
    if( database_url ){
      if( db ){
        if( id ){
          var option = {
            url: database_url + '/' + id,
            method: 'GET',
            headers: db_headers
          };
          request( option, function( err, res, doc ){
            if( err ){
              resolve( { status: false, error: err } );
            }else{
              doc = JSON.parse( doc );
              resolve( { status: true, item: doc } );
            }
          });
        }else{
          resolve( { status: false, error: 'no id' } );
        }
      }else{
        resolve( { status: false, error: 'no db' } );
      }
    }else{
      if( id ){
        if( db[id] ){
          resolve( { status: true, id: id, item: db[id] } );
        }else{
          resolve( { status: false, id: id, error: 'no item found for id = ' + id } );
        }
      }else{
        resolve( { status: false, error: 'no id specified.' } );
      }
    }
  });
};

//. 複数件取得
api.readItems = function( limit, start ){
  return new Promise( function( resolve, reject ){
    if( database_url ){
      if( db ){
        var url = database_url + '/_all_docs?include_docs=true';
        if( limit ){
          url += '&limit=' + limit;
        }
        if( start ){
          url += '&skip=' + start;
        }
        var option = {
          url: url,
          method: 'GET',
          headers: db_headers
        };
        request( option, function( err, res, body ){
          if( err ){
            resolve( { status: false, error: err } );
          }else{
            body = JSON.parse( body );
            var docs = [];
            if( body && body.rows ){
              body.rows.forEach( function( doc ){
                docs.push( doc.doc );
              });
            }
            resolve( { status: true, items: docs } );
          }
        });
      }else{
        resolve( { status: false, error: 'no db' } );
      }
    }else{
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
    }
  });
};

//. 検索
api.queryItems = function( key, limit, start ){
  return new Promise( function( resolve, reject ){
    if( database_url ){
      if( db ){
        var url = database_url + '/_find';
        var option = {
          url: url,
          method: 'POST',
          json: { selector: { name: key } },
          headers: db_headers
        };
        request( option, function( err, res, body ){
          if( err ){
            resolve( { status: false, error: err } );
          }else{
            body = JSON.parse( body );
            var docs = [];
            if( body && body.docs ){
              body.docs.forEach( function( doc ){
                docs.push( doc );
              });
            }

            if( start ){
              docs.splice( 0, start );
            }
            if( limit ){
              docs.splice( limit )
            }
            resolve( { status: true, items: docs } );
          }
        });
      }else{
        resolve( { status: false, error: 'no db' } );
      }
    }else{
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
    }
  });
};

//. 一件更新
api.updateItem = function( item ){
  return new Promise( function( resolve, reject ){
    if( database_url ){
      if( db ){
        if( !item._id ){
          resolve( { status: false, error: 'id needed.' } );
        }else{
          var option = {
            url: database_url + '/' + item.id,
            method: 'GET',
            headers: db_headers
          };
          request( option, function( err, res, body ){
            if( err ){
              resolve( { status: false, error: err } );
            }else{
              body = JSON.parse( body );
              option = {
                url: database_url + '/' + item.id + '?rev=' + body._rev,
                method: 'PUT',
                json: item,
                headers: db_headers
              };
              request( option, function( err, res, result ){
                if( err ){
                  resolve( { status: false, error: err } );
                }else{
                  resolve( { status: true, item: result } );
                }
              });
            }
          });
        }
      }else{
        resolve( { status: false, error: 'no db' } );
      }
    }else{
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
    }
  });
};

//. 複数件更新
api.updateItems = function( items ){
  return new Promise( async function( resolve, reject ){
    if( database_url ){
      if( db ){
        var t = ( new Date() ).getTime();
        for( var i = 0; i < items.length; i ++ ){
          items[i].updated = t;
        }

        var option = {
          url: database_url + '/_bulk_docs',
          method: 'POST',
          json: { docs: items },  //. item._rev があれば更新処理になる
          headers: db_headers
        };
        request( option, function( err, res, body ){
          if( err ){
            resolve( { status: false, error: err } );
          }else{
            resolve( { status: true, items: body } );
          }
        });
      }else{
        resolve( { status: false, error: 'no db' } );
      }
    }else{
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
    }
  });
};

//. 一件削除
api.deleteItem = function( id ){
  return new Promise( function( resolve, reject ){
    if( database_url ){
      if( db ){
        if( !id ){
          resolve( { status: false, error: 'id needed.' } );
        }else{
          var option = {
            url: database_url + '/' + id,
            method: 'GET',
            headers: db_headers
          };
          request( option, async function( err, res, doc ){
            if( err ){
              resolve( { status: false, error: err } );
            }else{
              doc = JSON.parse( doc );
              option = {
                url: database_url + '/' + id + '?rev=' + doc._rev,
                method: 'DELETE',
                headers: db_headers
              };
              request( option, function( err, res, body ){
                if( err ){
                  resolve( { status: false, error: err } );
                }else{
                  body = JSON.parse( body );
                  resolve( { status: true, body: body } );
                }
              });
            }
          });
        }
      }else{
        resolve( { status: false, error: 'no db' } );
      }
    }else{
      if( db[id] ){
        delete db[id];
        resolve( { status: true, id: id } );
      }else{
        resolve( { status: false, id: id, error: 'no item found for id = ' + id } );
      }
    }
  });
};

//. 複数件削除
api.deleteItems = function(){
  return new Promise( function( resolve, reject ){
    if( database_url ){
      if( db ){
        var url = database_url + '/_all_docs?include_docs=true';
        var option = {
          url: url,
          method: 'GET',
          headers: db_headers
        };
        request( option, function( err, res, body ){
          if( err ){
            resolve( { status: false, error: err } );
          }else{
            body = JSON.parse( body );
            if( body && body.rows ){
              var docs = [];
              body.rows.forEach( function( doc ){
                doc.doc._deleted = true;
                docs.push( doc.doc );
              });

              //. バルク削除して resolve
              url = database_url + '/_bulk_docs';
              option = {
                url: url,
                method: 'POST',
                json: { docs: docs },
                headers: db_headers
              };
              request( option, function( err, res, body ){
                if( err ){
                  console.log( err );
                  resolve( { status: false, error: err } );
                }else{
                  resolve( { status: true } );
                }
              });
            }else{
              resolve( { status: false, error: 'no items found.' } );
            }
          }
        });
      }else{
        resolve( { status: false, error: 'no db' } );
      }
    }else{
      db = {};
      resolve( { status: true } );
    }
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
  item._id = item.id;

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
    item._id = item.id;
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
  item._id = item_id;
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
    if( !item.id ){
      item.id = uuidv4();
    }
    item._id = item.id;
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
