var http = require('http');
var fs = require('fs');
var querystring = require('querystring');
var PORT = 6464;
var PUBLIC_DIR = './public/';
var requestBody = '';
var incomingData;
var fileName;
var fileContent;

var Method = {
  GET : 'GET',
  POST : 'POST',
  HEAD : 'HEAD',
  PUT : 'PUT'
};


var server = http.createServer(handleRequest);


function handleRequest(request, response){

  // console.log('request', request.url);
  // console.log('uri', request.url);


  if([Method.GET, Method.HEAD].indexOf(request.method) > -1){
    GETandHEADActions (request, response);
  }else if(request.method === Method.POST){
    POSTactions (request, response)
  } else if(request.method === Method.PUT){

  }
}

function POSTactions (request, response){

    var uri = request.url;

    console.log('uri', uri);

    grabBodyOfRequest (request, response)

    request.on('end', function(){

      //grab all the incomind Data an make it readable
      incomingData = querystring.parse(requestBody);

      generateFile(response);

    });
}

function grabBodyOfRequest (request, response){

  request.on('data', function(data){
    requestBody += data.toString();
  })
}


function generateFile (response) {

  fileName = incomingData.elementName+'.html';

  fileContent ='<!DOCTYPE html> <html lang="en"> <head> <meta charset="UTF-8"> <title>The Elements - ' +
  incomingData.elementName +
  '</title> <link rel="stylesheet" href="/css/styles.css"> </head> <body> <h1>' +
  incomingData.elementName +
  '</h1> <h2>' +
  incomingData.elementSymbol +
  '</h2> <h3>Atomic number ' +
  incomingData.elementAtomicNumber +
  '</h3> <p>' +
  incomingData.elementDescription +
  '</p> <p><a href="/">back</a></p> </body> </html>' ;

  checkFileExisting(response);

}

function checkFileExisting (response){

  fs.exists(PUBLIC_DIR + fileName, function(exists){
    if(exists){
      //if the file exists
      response.write('File exists. Need New Element');
      response.end()
    }else{
      //is file is not there, create it!
      creatingFiles(response);
    }
  });
}



function creatingFiles (response){

  fs.writeFile(PUBLIC_DIR + fileName, fileContent, function(err){
    if(err){
      response.write(err);
      throw err;
    }else{
      updateIndexFile();
      response.setHeader("Content-Type", "application/json");
      response.write("{ \"success\" : true }");
      response.end();
    }
  });

}


//read index file

function readIndexFile (){

  fs.readFile(PUBLIC_DIR + 'index.html', function(err, data){
    if(err){
      response.write(err);
      throw err;
    }else{

    setNumofElement();
    setElementList();
  }

  });


}

//use regex to set variables for
function setNumofElement (){

}
var numOfElementsOnIndex = 2;
// the number of elements
// regex: /(\d+)</h3>/g

function setElementList (){

}
var elementListOnIndex;
//the list
// regex: /<ol>(.*)</ol>/g



//re-write the index file just like a new file name is created
function updateIndexFile (response){

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
      handle404Error (response);
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


