### require-ejs

Allows requiring [EJS](https://github.com/visionmedia/ejs) template files as modules in Node.js.  Requiring any file with an .ejs extension returns a compiled EJS template function.

#### installation

npm install require-ejs

#### about

After noticing that in the [original EJS](https://github.com/visionmedia/ejs) source there was code for registering an EJS file as a Node.js module, but that it did not work when I tried to use it, I forked and modified the EJS compiler source and wrote this extension.  I have sent a pull request to the original repo but until if/when it is accepted I'm using this fork.
