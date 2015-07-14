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

var HTTPmethod = {
  GET : 'GET',
  POST : 'POST',
  HEAD : 'HEAD',
  PUT : 'PUT'
};

var count = 0;

var server = http.createServer(getsResponseFromClient);


function getsResponseFromClient(request, response){

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
  request.fileName = incomingData.elementName+'.html';

  request.fileContent ='<!DOCTYPE html> <html lang="en"> <head> <meta charset="UTF-8"> <title>The Elements - ' +
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

  fs.exists(PUBLIC_DIR + request.url, function(exists){
    if(exists){
      request.fileExists = true;
    }else{
      request.fileExists = false;
    }

    handleRequest(request, response);
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
      // //Autoupdates the index.html file
      // readIndexFile();

      response.setHeader("Content-Type", "application/json");
      response.write("{ \"success\" : true }");
      response.end();
    }
  });

}

//beginning of the update index function
function readIndexFile (response){
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

  createsNewIndexContent(response);
};


function createsNewIndexContent (request, response){

  request.newIndexContent ='<!DOCTYPE html> <html lang="en"> <head> <meta charset="UTF-8"> <title>The Elements</title> <link rel="stylesheet" href="/css/styles.css"> </head> <body> <h1>The Elements</h1> <h2>These are all the known elements.</h2> <h3>These are ' +
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


