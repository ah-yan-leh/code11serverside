'use strict';

const pg = require('pg');
const fs = require('fs');
const express = require('express');

const bodyParser = require('body-parser');
const PORT = process.env.PORT || 3000;
const app = express();
const conString = 'postgres://postgres:tabinLync@localhost:5432/booklist';

const client = new pg.Client(conString);

client.connect();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('./public'));


app.get('/allBooks', (request, response) => {
    client.query(
        `SELECT * FROM books;`
      )
        .then(function(result) {
          response.send(result)
        })
        .catch(function(err) {
          console.error(err);
        });
});

app.post('/addNewBook', (request, response) => {
  client.query(`INSERT INTO books(title, authors) VALUES ($1, $2);`,
    [
      request.body.title,
      request.body.authors
    ]
  )
    .then(function() {
      response.send('insert complete')
    })
    .catch(function(err) {
      console.error(err);
    });
});

app.put('/updateBook/:id', (request, response) => {
  client.query(
    `UPDATE books
    SET
      title=$1, authors=$2
    WHERE book_id=$3;
    `,
    [
      request.body.title,
      request.body.authors,
      request.params.id
    ]
  )
    .then(() => {
      response.send('update complete')
    })
    .catch(err => {
      console.error(err);
    });
});

app.delete('/deleteBook/:id', (request, response) => {
  client.query(
    `DELETE FROM books WHERE book_id=$1;`,
    [request.params.id]
  )
    .then(() => {
      response.send('Delete complete')
    })
    .catch(err => {
      console.error(err);
    });
});

app.delete('/deleteAllBooks', (request, response) => {
  client.query(
    'DELETE FROM books;'
  )
    .then(() => {
      response.send('Delete complete')
    })
    .catch(err => {
      console.error(err);
    });
});

loadDB();

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}!`);
});


//////// ** DATABASE LOADER ** ////////
////////////////////////////////////////
function loadArticles() {
  client.query('SELECT COUNT(*) FROM books')
    .then(result => {
      if(!parseInt(result.rows[0].count)) {
        fs.readFile('./public/data.json', 'utf8', (err, fd) => {
          JSON.parse(fd).forEach(ele => {
            client.query(`
              INSERT INTO
              books(title, authors)
              VALUES ($1, $2)`,
              [ele.title, ele.authors]
            )
          })
        })
      }
    })
}

function loadDB() {
  client.query(`
    CREATE TABLE IF NOT EXISTS books (
      book_id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      authors VARCHAR(255) NOT NULL)`
  )
    .then(() => {
      loadArticles();
    })
    .catch(err => {
      console.error(err);
    });
}

app.use((request, response) => response.status(404).sendFile('404.html', {root: './public'}))