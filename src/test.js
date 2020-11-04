var rerejs = require("rerejs");
var Regex="\1";
var flag='u';
var parser = new rerejs.Parser(Regex, flag);
var pattern = parser.parse();
console.log(pattern);
console.log("u");
console.log(pattern.child.children);