const fs = require("fs"), p = require("path");
const existing = JSON.parse(fs.readFileSync(p.join(__dirname,"..","backend","scripts","catalog_import.json"),"utf8"));
function I(n,d,u,c,b,c2){return {name:n,description:d,unit:u,category:c,basePrice:b??null,costPrice:c2??null};}
function D(c,...p){return "Categoria: "+c+" | "+p.filter(Boolean).join(" | ");}
function C(b,n=55,x=75){return Math.round(b*(n+Math.random()*(x-n))/100);}
const a = [];
