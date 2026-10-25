//Q1
const http = require('http');
http.createServer((req, res) => {
  if (req.url === '/') {
    res.end("WELCOME");
  }
}).listen(3000);
console.log("RUNNING ON PORT 3000");
const http = require('http');
//Q2
http.createServer((req, res) => {
  if (req.url === '/home') res.end("Home Page");
  else if (req.url === '/about') res.end("About Page");
  else if (req.url === '/contact') res.end("Contact Page");
  else res.end("PAGE NOT FOUND");
}).listen(3000);
//Q3
const http = require('http');
const fs = require('fs');
http.createServer((req, res) => {
  if (req.url === '/readfile') {
    fs.readFile('sample.txt', 'utf8', (err, data) => {
      if (err) return res.end("ERROR");
      res.end(data);
    });
  }
}).listen(3000);

//Q4
const http = require('http');
const fs = require('fs');

http.createServer((req, res) => {
  if (req.url === '/writefile') {
    fs.writeFile('output.txt', 'Hello World', err => {
      if (err) res.end("Write failed");
      else res.end("DONE");
    });
  }
}).listen(3000);
//que5
const http = require('http');
const fs = require('fs');

http.createServer((req, res) => {
  if (req.url === '/log') {
    const time = new Date().toString() + "\n";
    fs.appendFile('log.txt', time, () => {
      res.end("ADDED");
    });
  }
}).listen(3000);