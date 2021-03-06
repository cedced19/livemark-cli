#!/usr/bin/env node
'use strict';
var hapi = require('hapi'),
    app = new hapi.Server(),
    fs = require('fs'),
    program = require('commander'),
    marked = require('marked'),
    gdata,
    pkg = require('./package.json'),
    port = 7773,
    colors = require('colors');

program
  .version(pkg.version)
  .option('-p, --port [number]', 'specified the port')
  .parse(process.argv);

if (!isNaN(parseFloat(program.port)) && isFinite(program.port)){
  port = program.port;
}

marked.setOptions({
  renderer: new marked.Renderer(),
  gfm: true,
  tables: true,
  breaks: true,
  pedantic: true,
  sanitize: true,
  smartLists: true,
  smartypants: true
});

app.connection({ port: port });

app.route({
    method: 'GET',
    path: '/api/',
    handler: function (request, reply) {
        reply(gdata);
    }
});

app.route({
    method: 'GET',
    path: '/vendor/{param*}',
    handler: {
        directory: {
            path: __dirname + '/vendor/'
        }
    }
});

app.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
        reply.file(__dirname + '/index.html');
    }
});


app.route({
    method: 'GET',
    path: '/favicon.ico',
    handler: function (request, reply) {
        reply.file(__dirname + '/favicon.ico');
    }
});

app.start(function() {
    require('check-update')({packageName: pkg.name, packageVersion: pkg.version, isCLI: true}, function(err, latestVersion, defaultMessage){
        if(!err){
            console.log(defaultMessage);
        }
    });
    console.log('Server running at\n  => ' + colors.green('http://localhost:' + port) + '\nCTRL + C to shutdown');
});

var io = require('socket.io').listen(app.listener);
io.sockets.on('connection', function(socket){
    socket.on('change', function(data){
         data.after = marked(data.before).replace(/\n/g, '');
         gdata = data;
         io.sockets.emit('change', data);
    });
});
