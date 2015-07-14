var http = require('http');
var fs = require('fs');
var querystring = require('querystring');
var PORT = 6464;
var PUBLIC_DIR = './public/';
var incomingData;

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

  function writeTheResponse(status, message, content){
    if(content === 'JSON'){
      response.setHeader("Content-Type", "application/json");
    }
    response.statusCode = status; //404|200|500
    response.write(message);
    response.end();
  }

  switch(request.method){

    case HTTPmethod.HEAD :
      processHEADMethod(request, writeTheResponse);
    break;

    case HTTPmethod.GET:
      processGETMethod(request, writeTheResponse);
    break;

    case HTTPmethod.POST:
      processPOSTMethod(request, writeTheResponse);
    break;

    case HTTPmethod.PUT:

      processPUTMethod(request, writeTheResponse);
    break;

    case HTTPmethod.DELETE:
      processDELETEMethod(request, writeTheResponse);
    break;

    default:
      response.write('Error with the command center');
      response.end();
    break;
  }
}

function processPOSTMethod(request, writeTheResponse){
  if(request.fileExists){
    writeTheResponse(404, 'File Already Exists');
  }else{
    creatingFile(request, writeTheResponse);
    readAndUpdateIndex(request, writeTheResponse);
  }

}

function processPUTMethod(request, writeTheResponse){

  if(request.fileExists){
    creatingFile(request, writeTheResponse);
  }else{
    writeTheResponse(500,"{ \"error\" : \"resource /carbon.html does not exist\" }", 'JSON')
  }
}

function processDELETEMethod(request, writeTheResponse){

  if(request.fileExists){
    deleteFileOnServer(request, writeTheResponse);
    removeElementFromIndex (request, writeTheResponse)
  }else{
    writeTheResponse(500, "{ \"error\" : \"File does not exist\" }", 'JSON')
  }
};

function deleteFileOnServer (request, writeTheResponse){
  fs.unlink(PUBLIC_DIR + request.url, function(err){
    if(err){
      writeTheResponse(404, err);

    }
  });
};

function removeElementFromIndex (request, writeTheResponse){

  fs.readFile(PUBLIC_DIR + 'index.html', function(err, data){
    if(err){
      writeTheResponse(404, err);
    }else{
      data = data.toString();
      request.fileName = 'index.html';
      findAndDecreaseNumOfElements(data, request, writeTheResponse);
    }
  });
};

function findAndDecreaseNumOfElements (data, request, writeTheResponse){
  var numOfEleStripper = /(\d+)<\/h3>/g;
  var numOfEleProcess = numOfEleStripper.exec(data);

  data = data.replace(numOfEleStripper, (Number(numOfEleProcess[1])-1) + '</h3>');

  findAndRemoveElement(data, request, writeTheResponse);
}

function findAndRemoveElement(data, request, writeTheResponse){

  var findElementStripper = new RegExp('<li>\\s<a\\shref="(' + request.url + ')">\\w+<\/a>\\s<\/li>','g');

  data = data.replace(findElementStripper, '');

  request.newIndexContent = data;
  updateIndexFile(request, writeTheResponse);

}


function creatingFile (request, writeTheResponse){

  fs.writeFile(PUBLIC_DIR + request.fileName, request.fileContent, function(err){
    if(err){
      writeTheResponse(404, err);
    }else{
      writeTheResponse(200, "{ \"success\" : true }", 'JSON')
    }
  });
};

//beginning of the update index function
function readAndUpdateIndex (request, writeTheResponse){
  fs.readFile(PUBLIC_DIR + 'index.html', function(err, data){
    if(err){
      writeTheResponse(404, err);
    }else{
    increaseNumofElements(data, request, writeTheResponse);
    }
  });
};

function increaseNumofElements (data, request, writeTheResponse){
  var numOfEleStripper = /(\d+)<\/h3>/g;
  var numOfEleProcess = numOfEleStripper.exec(data);

  request.numOfElementsOnIndex = Number(numOfEleProcess[1]) + 1;

  setElementList(data, request, writeTheResponse);
}

function setElementList (data, request, writeTheResponse){
  var setElementStripper = /<ol>(.*)<\/ol>/g;
  var setElementProcess = setElementStripper.exec(data);

  request.elementListOnIndex = setElementProcess[1];

  createsNewIndexContent(request, writeTheResponse);
};


function createsNewIndexContent (request, writeTheResponse){
  request.newIndexContent ='<!DOCTYPE html> <html lang="en"> <head> <meta charset="UTF-8"> <title>The Elements</title> <link rel="stylesheet" href="/css/styles.css"> </head> <body> <h1>The Elements</h1> <h2>These are all the known elements.</h2> <h3>These are ' +
  request.numOfElementsOnIndex +
  '</h3> <ol>' +
  request.elementListOnIndex +
  '<li> <a href="/' +
  request.incomingData.elementName +
  '.html">' +
  request.incomingData.elementName +
  '</a> </li> </ol> </body> </html>';

  updateIndexFile(request, writeTheResponse);
}

function updateIndexFile (request, writeTheResponse){
  fs.writeFile(PUBLIC_DIR + 'index.html', request.newIndexContent, function(err){
    if(err){
      writeTheResponse(404, err)
    }else{
      writeTheResponse(200, "{ \"success\" : true }", 'JSON');
    }
  });
}
//End of entire updating the index

function processHEADMethod (request, writeTheResponse){
  if(request.fileExists){
    serveFileToClient (request, writeTheResponse);
  }else{
    handle404Error(writeTheResponse);
  }
}

function processGETMethod (request, writeTheResponse){
  if(request.fileExists){
    serveFileToClient(request, writeTheResponse);
  }else{
    handle404Error(writeTheResponse);
  }
}

function serveFileToClient (request, writeTheResponse){
  fs.readFile(PUBLIC_DIR + request.url, function (err, data){
    if(err) throw err;
    writeTheResponse(200, data);
  });
}

function handle404Error (writeTheResponse){
  fs.readFile(PUBLIC_DIR + '404.html', function (err, data){
    if(err) throw err;
    writeTheResponse(404, data)
  })
}

server.listen(PORT, function(){
  console.log('http server listening on port:', PORT)
})