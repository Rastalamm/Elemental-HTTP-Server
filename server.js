var http = require('http');
var fs = require('fs');
var querystring = require('querystring');
var PORT = 6464;

var methods = {
  GET : 'GET',
  POST : 'POST',
  HEAD : 'HEAD'
};

var server = http.createServer(handleRequest);


function handleRequest (request, response){

  //validate the request exists on our end

  if(!methods.hasOwnProperty(request.method)){
    response.end('not a valid method');
  }



  //console.log('request', Object.keys(request));



  console.log('request', methods.hasOwnProperty(request.method));
  //console.log('response', response);

  response.end();


};

server.listen(PORT, function(){
  console.log('http server listening on port:', PORT)
})

server.connection