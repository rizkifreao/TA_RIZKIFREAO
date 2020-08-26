const mysql = require('mysql')

const db = mysql.createConnection({
  host : "localhost",
  user : "root",
  password : ""
})

module.exports = db;