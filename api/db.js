// https://github.com/mapbox/node-sqlite3/wiki/API
// https://www.freecodecamp.org/news/javascript-from-callbacks-to-async-await-1cc090ddad99/
// https://davidwalsh.name/async-await
var sqlite3 = require('sqlite3').verbose();
const DB_NAME = process.env.SQLITE_DB || '/sqlite.db';

const db = new sqlite3.Database(DB_NAME, err => {
  if (err) {
    return console.error(err.message);
  }
  console.log(`[CONFIG] DB_NAME: ${DB_NAME}`);
  init_db();
});

function run(query, params = []) {
  return new Promise(function (resolve, reject) {
    db.run(query, params, function (err) {
      if (err) {
        reject(err);
      }
      resolve([this.lastID, this.changes]);
    })
  })
}

function all(query, params = []) {
  return new Promise(function (resolve, reject) {
    db.all(query, params, function (err, rows) {
      if (err) {
        reject(err);
      }
      resolve(rows);
    })
  })
}

function init_db() {
  const query_create_configs = `CREATE TABLE IF NOT EXISTS configs(
    name TEXT PRIMARY KEY,
    yaml TEXT
  )
  `;
  run(query_create_configs);
}

module.exports = {
  run,
  all,
};
