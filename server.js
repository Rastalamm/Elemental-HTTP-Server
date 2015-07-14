var http = require('http');
var fs = require('fs');
var querystring = require('querystring');
var PORT = 6464;
var PUBLIC_DIR = './public/';
var incomingData;
var theUri;
var fileName;
var fileContent;

var HTTPmethod = {
  GET : 'GET',
  POST : 'POST',
  HEAD : 'HEAD',
  PUT : 'PUT'
};

var count = 0;

var server = http.createServer(getsResponseFromClient);


function getsResponseFromClient(request, response){
  request.requestBody = '';

  setTheUri(request);
  grabBodyOfRequest(request, response);
  EndOfDataStream(request, response);
}

function setTheUri(request){
  request.url = request.url;

  if(request.url === '/'){
    request.url = 'index.html';
    request.fileExists = true;
  }


}

function grabBodyOfRequest (request, response){
  request.on('data', function(data){
    request.requestBody += data.toString();
  })
}


function EndOfDataStream(request, response){
  request.on('end', function(){

    //grab all the incomind Data an make it readable
    request.incomingData = querystring.parse(request.requestBody);

    request.fileName = request.incomingData.elementName+'.html';
    request.fileContent = generateFile(request, response);

    checkFileExisting(request, response, handleRequest);
  });

}

function generateFile (request, response) {

  return '<!DOCTYPE html> <html lang="en"> <head> <meta charset="UTF-8"> <title>The Elements - ' +
  request.incomingData.elementName +
  '</title> <link rel="stylesheet" href="/css/styles.css"> </head> <body> <h1>' +
  request.incomingData.elementName +
  '</h1> <h2>' +
  request.incomingData.elementSymbol +
  '</h2> <h3>Atomic number ' +
  request.incomingData.elementAtomicNumber +
  '</h3> <p>' +
  request.incomingData.elementDescription +
  '</p> <p><a href="/">back</a></p> </body> </html>' ;
}

function checkFileExisting (request, response, callback){

  fs.exists(PUBLIC_DIR + request.url, function(exists){
    if(exists){
      request.fileExists = true;
    }else{
      request.fileExists = false;
    }
    callback(request, response);
  });
}



function handleRequest(request, response){

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
      processPOSTMethod(request, response);
    break;

    case HTTPmethod.PUT:

      processPUTMethod(request, response);
    break;

    // case HTTPmethod.DELETE:
    //   //run delete
    // break;

    default:
      //default action
    break;

  }
}

function processPOSTMethod(request, response){
  if(request.fileExists){
    response.write('File Already Exists');
    response.end();
  }else{
    creatingFile(request, response);
    readAndUpdateIndex(request, response);
  }
}


function processPUTMethod(request, response){

  if(request.fileExists){
    creatingFile(request, response);
  }else{
    response.write('File Does not Exist');
    response.end();
  }
}

function creatingFile (request, response){

  fs.writeFile(PUBLIC_DIR + request.fileName, request.fileContent, function(err){
    if(err){
      response.write(err);
      throw err;
    }else{
      response.setHeader("Content-Type", "application/json");
      response.write("{ \"success\" : true }");
      response.end();
    }
  });

}

//beginning of the update index function
function readAndUpdateIndex (request, response){
  fs.readFile(PUBLIC_DIR + 'index.html', function(err, data){
    if(err){
      response.write(err);
      throw err;
    }else{
    setNumofElement(data, request, response);
    }
  });
};

function setNumofElement (data, request, response){

  var numOfEleStripper = /(\d+)<\/h3>/g;
  var numOfEleProcess = numOfEleStripper.exec(data);

  request.numOfElementsOnIndex = Number(numOfEleProcess[1]) + 1;

  setElementList(data, request, response);
}

function setElementList (data, request, response){
  var setElementStripper = /<ol>(.*)<\/ol>/g;
  var setElementProcess = setElementStripper.exec(data);

  request.elementListOnIndex = setElementProcess[1];

  createsNewIndexContent(request, response);
};


function createsNewIndexContent (request, response){

  request.newIndexContent ='<!DOCTYPE html> <html lang="en"> <head> <meta charset="UTF-8"> <title>The Elements</title> <link rel="stylesheet" href="/css/styles.css"> </head> <body> <h1>The Elements</h1> <h2>These are all the known elements.</h2> <h3>These are ' +
  request.numOfElementsOnIndex +
  '</h3> <ol>' +
  request.elementListOnIndex +
  '<li> <a href="/' +
  request.incomingData.elementName +
  '.html">' +
  request.incomingData.elementName +
  '</a> </li> </ol> </body> </html>';

  updateIndexFile(request, response);
}

function updateIndexFile (request, response){
  fs.writeFile(PUBLIC_DIR + 'index.html', request.newIndexContent, function(err){
    if(err){
      response.write(err);
      throw err;
    }
  });
}
//End of entire updating the index



function processHEADMethod (request, response){
  if(request.fileExists){
    serveFileToClient (request, response);
  }else{
    handle404Error(response);
  }
}

function processGETMethod (request, response){
  if(request.fileExists){
    serveFileToClient(request, response);
  }else{
    handle404Error (response);
  }
}

function serveFileToClient (request, response){

  fs.readFile(PUBLIC_DIR + request.url, function (err, data){
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


