var http = require('http');
var fs = require('fs');
var querystring = require('querystring');
var PORT = 6464;
var PUBLIC_DIR = './public/';
var requestBody = '';
var incomingData;
var theUri;
var fileName;
var fileContent;
var numOfElementsOnIndex;
var elementListOnIndex;
var newIndexContent;
var fileExists;

var HTTPmethod = {
  GET : 'GET',
  POST : 'POST',
  HEAD : 'HEAD',
  PUT : 'PUT'
};


var server = http.createServer(getsResponseFromClient);

function getsResponseFromClient(request, response){
  setTheUri(request);
  grabBodyOfRequest(request, response);
  EndOfDataStream(request, response);
}

function setTheUri(request){
  theUri = request.url;

  if(theUri === '/'){
    theUri = 'index.html';
  }
}

function grabBodyOfRequest (request, response){
  request.on('data', function(data){
    requestBody += data.toString();
  })
}


function EndOfDataStream(request, response){
  request.on('end', function(){

    //grab all the incomind Data an make it readable
    incomingData = querystring.parse(requestBody);

    generateFile(request, response);

  });

}

function generateFile (request, response) {

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

  checkFileExisting(request, response);

}



function checkFileExisting (request, response){

  fs.exists(PUBLIC_DIR + fileName, function(exists){
    if(exists){
      //if the file exists
      fileExists = true;
      // response.write('File exists. Need New Element');
      // response.end()
    }else{
      //is file is not there, create it!
      fileExists = false;
      //creatingFiles(response);
    }
  });

  handleRequest(request, response);

}



function handleRequest(request, response){
console.log('running get', request.method);
  switch(request.method){
    case HTTPmethod.HEAD :
      //run the http head
      processHEADMethod(request, response);
    break;

    case HTTPmethod.GET:
      // run GET
      processGETMethod(request, response);
    break;

    case HTTPmethod.POST:
      //run POST
    break;

    case HTTPmethod.PUT:
      //run PUT
    break;

    // case HTTPmethod.DELETE:
    //   //run delete
    // break;

    default:
      //default action
    break;

  }
}

function POSTactions (request, response){

    var uri = request.url;

    console.log('uri', uri);

    //grabBodyOfRequest (request, response)

}

function PUTactions (request, response){

    var uri = request.url;

    console.log('uri', uri);

    grabBodyOfRequest (request, response)

    request.on('end', function(){

      //grab all the incomind Data an make it readable
      incomingData = querystring.parse(requestBody);

      generateFile(response);

    });

}







function creatingFile (response){

  fs.writeFile(PUBLIC_DIR + fileName, fileContent, function(err){
    if(err){
      response.write(err);
      throw err;
    }else{
      //Autoupdates the index.html file
      readIndexFile();
      response.setHeader("Content-Type", "application/json");
      response.write("{ \"success\" : true }");
      response.end();
    }
  });

}


function readIndexFile (response){
  fs.readFile(PUBLIC_DIR + 'index.html', function(err, data){
    if(err){
      response.write(err);
      throw err;
    }else{
    setNumofElement(data, response);
    }
  });
};

function setNumofElement (data, response){

  var numOfEleStripper = /(\d+)<\/h3>/g;
  var numOfEleProcess = numOfEleStripper.exec(data);

  numOfElementsOnIndex = Number(numOfEleProcess[1]) + 1;

  setElementList(data, response);
}

function setElementList (data, response){
  var setElementStripper = /<ol>(.*)<\/ol>/g;
  var setElementProcess = setElementStripper.exec(data);

  elementListOnIndex = setElementProcess[1];

  createsNewIndexContent(response);
};


function createsNewIndexContent (response){

  newIndexContent ='<!DOCTYPE html> <html lang="en"> <head> <meta charset="UTF-8"> <title>The Elements</title> <link rel="stylesheet" href="/css/styles.css"> </head> <body> <h1>The Elements</h1> <h2>These are all the known elements.</h2> <h3>These are ' +
  numOfElementsOnIndex +
  '</h3> <ol>' +
  elementListOnIndex +
  '<li> <a href="/' +
  incomingData.elementName +
  '">' +
  incomingData.elementName +
  '</a> </li> </ol> </body> </html>';

  updateIndexFile(response);
}

function updateIndexFile (response){
  fs.writeFile(PUBLIC_DIR + 'index.html', newIndexContent, function(err){
    if(err){
      response.write(err);
      throw err;
    }
  });
}


function processHEADMethod (request, response){


  fs.exists(PUBLIC_DIR + theUri, function(exists){
    if(exists){
      //is file is there, give it to them
      serveFileToClient (response, theUri);
    }else{
      //if there is a 404 error
      handle404Error (response);
    }
  });
}



function processGETMethod (request, response){


  fs.exists(PUBLIC_DIR + theUri, function(exists){
    if(exists){
      //is file is there, give it to them
      serveFileToClient (response, theUri);
    }else{
      //if there is a 404 error
      handle404Error (response);
    }
  });
}

function serveFileToClient (response, theUri){

  fs.readFile(PUBLIC_DIR + theUri, function (err, data){
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


