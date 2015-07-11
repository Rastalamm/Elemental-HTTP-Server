var http = require('http');
var fs = require('fs');
var querystring = require('querystring');
var PORT = 6464;
var PUBLIC_DIR = './public/';
var ELEMENTS_DIR = PUBLIC_DIR + 'elements/';

var Method = {
  GET : 'GET',
  POST : 'POST',
  HEAD : 'HEAD'
};

var server = http.createServer(handleRequest);


function handleRequest(request, response){

  console.log('request', request.url);

  var requestBody = '';

  if([Method.GET, Method.HEAD].indexOf(request.method) > -1){

    GETandHEADActions (request, response);

  }else if(request.method === Method.POST){

    request.on('data', function(chunk){
      requestBody += chunk.toString();
    })

    request.on('end', function(){

      var postData = querystring.parse(requestBody)

      //create new file, in public

      // fs.writeFile(PUBLIC_DIR+postData.filename, postData.content, function(err){
      //   if(err){
      //     response.write(err);
      //     response.end();
      //     throw err;
      //   }else{
      //     response.write('success');
      //     response.end();
      //   }
      // });
    });
  }
}

function GETandHEADActions (request, response){
  var uri = request.url;

  if(uri === '/'){
    uri = 'index.html';
  }

  fs.exists(PUBLIC_DIR + uri, function(exists){
    if(exists){
      //is file is there, give it to them
      serveFileToClient (response, uri);
    }else{
      //if there is a 404 error
      handle404Error (response)
    }
  });
}

function serveFileToClient (response, uri){

  fs.readFile(PUBLIC_DIR + uri, function (err, data){
    if(err) throw err;
    response.write(data);
    response.end();
  });
}

function handle404Error (response){

  response.statusCode = 404;

  fs.readFile(PUBLIC_DIR + '404.html', function (err, data){
    if(err) throw err;
    response.write(data);
    response.end();
  })
}




server.listen(PORT, function(){
  console.log('http server listening on port:', PORT)
})


