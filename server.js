var http = require('http');
var fs = require('fs');
var querystring = require('querystring');
var PORT = 6464;
var PUBLIC_DIR = './public/';
var incomingData;
var theUri;

var HTTPmethod = {
  GET : 'GET',
  POST : 'POST',
  HEAD : 'HEAD',
  PUT : 'PUT',
  DELETE : 'DELETE'
};

var count = 0;

var server = http.createServer(getsResponseFromClient);

function getsResponseFromClient(request, response){
  request.requestBody = '';

  setTheUri(request);
  grabBodyOfRequest(request);
  EndOfDataStream(request, response);
}

function setTheUri(request){
  request.url = request.url;

  if(request.url === '/'){
    request.url = 'index.html';
    request.fileExists = true;
  }
}

function grabBodyOfRequest (request){
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

function generateFile (request) {

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
      processHEADMethod(request, function(status, message){
        if(status == 200){
          response.write(message);
          response.end();
        }else{
          response.write(message);
          response.statusCode = 404;
          response.end();
        }
      });
    break;

    case HTTPmethod.GET:
      // run GET

      processGETMethod(request, function(status, message){
        if(status == 200){
          response.write(message);
          response.end();
        }else{
          response.write(message);
          response.statusCode = 404;
          response.end();
        }
      });
    break;

    case HTTPmethod.POST:
      processPOSTMethod(request, function(status, message){
        if(status == 200){
          response.setHeader("Content-Type", "application/json");
          response.write(message);
          response.end();
        }else{
          response.write(message);
          response.statusCode = 404;
          response.end();
        }
      });
    break;

    case HTTPmethod.PUT:

      processPUTMethod(request, function(status, message){
        if(status == 200){
          response.setHeader("Content-Type", "application/json");
          response.write(message);
          response.end();
        }else{
          response.write(message);
          response.statusCode = 404;
          response.end();
        }
      });
    break;

    case HTTPmethod.DELETE:
      processDELETEMethod(request, function(status, message){
        if(status == 200){
          response.setHeader("Content-Type", "application/json");
          response.write(message);
          response.end();
        }else{
          response.write(message);
          response.statusCode = 404;
          response.end();
        }
      });
    break;

    default:
      //default action
    break;
  }
}

function processPOSTMethod(request, callback){
  if(request.fileExists){
    callback(404, 'File Already Exists')
  }else{
    creatingFile(request, callback);
    readAndUpdateIndex(request, callback);
  }
}

function processPUTMethod(request, callback){

  if(request.fileExists){
    creatingFile(request, callback);
  }else{
    callback(404, 'File Does not Exist')
  }
}

function processDELETEMethod(request, callback){

}

function creatingFile (request, callback){

  fs.writeFile(PUBLIC_DIR + request.fileName, request.fileContent, function(err){
    if(err){
      callback(404, err);
    }else{
      callback(200, "{ \"success\" : true }")
    }
  });
};

//beginning of the update index function
function readAndUpdateIndex (request, callback){
  fs.readFile(PUBLIC_DIR + 'index.html', function(err, data){
    if(err){
      callback(404, err);
    }else{
    setNumofElement(data, request, callback);
    }
  });
};

function setNumofElement (data, request, callback){
  var numOfEleStripper = /(\d+)<\/h3>/g;
  var numOfEleProcess = numOfEleStripper.exec(data);

  request.numOfElementsOnIndex = Number(numOfEleProcess[1]) + 1;

  setElementList(data, request, callback);
}

function setElementList (data, request, callback){
  var setElementStripper = /<ol>(.*)<\/ol>/g;
  var setElementProcess = setElementStripper.exec(data);

  request.elementListOnIndex = setElementProcess[1];

  createsNewIndexContent(request, callback);
};


function createsNewIndexContent (request, callback){
  request.newIndexContent ='<!DOCTYPE html> <html lang="en"> <head> <meta charset="UTF-8"> <title>The Elements</title> <link rel="stylesheet" href="/css/styles.css"> </head> <body> <h1>The Elements</h1> <h2>These are all the known elements.</h2> <h3>These are ' +
  request.numOfElementsOnIndex +
  '</h3> <ol>' +
  request.elementListOnIndex +
  '<li> <a href="/' +
  request.incomingData.elementName +
  '.html">' +
  request.incomingData.elementName +
  '</a> </li> </ol> </body> </html>';

  updateIndexFile(request, callback);
}

function updateIndexFile (request, callback){
  fs.writeFile(PUBLIC_DIR + 'index.html', request.newIndexContent, function(err){
    if(err){
      callback(404, err)
    }
  });
}
//End of entire updating the index

function processHEADMethod (request, callback){
  if(request.fileExists){
    serveFileToClient (request, callback);
  }else{
    handle404Error(callback);
  }
}

function processGETMethod (request, callback){
  if(request.fileExists){
    serveFileToClient(request, callback);
  }else{
    handle404Error(callback);
  }
}

function serveFileToClient (request, callback){
  fs.readFile(PUBLIC_DIR + request.url, function (err, data){
    if(err) throw err;
    callback(200, data);
  });
}

function handle404Error (callback){

  fs.readFile(PUBLIC_DIR + '404.html', function (err, data){
    if(err) throw err;
    callback(400, data);
  })
}

server.listen(PORT, function(){
  console.log('http server listening on port:', PORT)
})