//. main.js
var API_SERVER = '<%= API_SERVER %>';

$(function(){
  init();
});

function init(){
  $('#items_table_tbody').html( '' );
  $.ajax({
    type: 'GET',
    url: API_SERVER + '/api/db/items',
    success: function( result ){
      if( result && result.status && result.results ){
        for( var i = 0; i < result.results.length; i ++ ){
          var item = result.results[i];
          var tr = '<tr>'
            + '<td>' + item.name + '</td>'
            + '<td>' + item.price + '</td>'
            + '<td>'
            + '<button class="btn btn-warning" onClick="editItem(\'' + item._id + '\',\'' + item.name + '\',\'' + item.price + '\');">編集</button>'
            + '<button class="btn btn-danger" onClick="deleteItem(\'' + item._id + '\',\'' + item.name + '\');">削除</button>'
            + '</td>'
            + '</tr>';
          $('#items_table_tbody').append( tr );
        }

        $.extend( $.fn.dataTable.defaults, {
          language: {
            url: '//cdn.datatables.net/plug-ins/9dcbecd42ad/i18n/Japanese.json'
          }
        });
        $('#items_table').DataTable({
          columnDefs: [{ 
            targets: [ 2 ], 
            orderable: false,
            searchable: false
          }]
          /*
          ,order: [ [ 1, 'desc' ] ]
          */
        });
      }
    },
    error: function( err ){
      console.log( err );
    }
  });
}

function saveItem(){
  var edit_id = $('#edit_id').val();
  var edit_name = $('#edit_name').val();
  var edit_price = $('#edit_price').val();

  if( edit_id ){
    //. 更新
    $.ajax({
      type: 'PUT',
      url: API_SERVER + '/api/db/item/' + edit_id,
      data: { name: edit_name, price: parseInt( edit_price ) },
      success: function( result ){
        location.href = '/';
      },
      error: function( err ){
        console.log( err );
      },
    });
  }else{
    //. 作成
    $.ajax({
      type: 'POST',
      url: API_SERVER + '/api/db/item',
      data: { name: edit_name, price: parseInt( edit_price ) },
      success: function( result ){
        location.href = '/';
      },
      error: function( err ){
        console.log( err );
      },
    });
  }
}

function createItem(){
    $('#edit_id').val( '' );
    $('#edit_name').val( '' );
    $('#edit_price').val( '' );

    $('#itemModal').modal( 'show' );
}

function editItem( item_id, item_name, item_price ){
    $('#edit_id').val( item_id );
    $('#edit_name').val( item_name );
    $('#edit_price').val( item_price );

    $('#itemModal').modal( 'show' );
}

function deleteItem( item_id, item_name ){
  if( confirm( item_name + ' を削除します。よろしいですか？' ) ){
    $.ajax({
      type: 'DELETE',
      url: API_SERVER + '/api/db/item/' + item_id,
      success: function( result ){
        location.href = '/';
      },
      error: function( err ){
        console.log( err );
      },
    });
  }
}

