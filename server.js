'use strict';

const pg = require('pg');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const PORT = process.env.PORT || 3000;
const app = express();
const cors = require('cors');
// const conString = 'postgres://postgres:tabinLync@localhost:5432/booklist';

const conString = 'postgres://postgres:postgres@localhost:5432/booklist';

const client = new pg.Client(conString);

client.connect();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('./public'));

app.get('/', (request, response) =>{
  response.sendFile('index.html', {root: './public'});
})
app.get('/api/v1/books', (request, response) => {
    client.query(
        `SELECT * FROM books;`
      )
        .then(function(result) {
          response.send(result.rows)
        })
        .catch(function(err) {
          console.error(err);
        });
});
app.get('/api/v1/books/:id', (request, response) => {
    client.query(
        `SELECT * FROM books WHERE book_id=$1;`,
        [
          request.params.id
        ]
      )
        .then(function(result) {
          response.send(result.rows)
        })
        .catch(function(err) {
          console.error(err);
        });
});

app.post('/api/v1/books/addNewBook', (request, response) => {
  client.query(`INSERT INTO books(title,author,isbn,image_url,description) VALUES ($1,$2,$3,$4,$5);`,
    [
      request.body.title,
      request.body.author,
      request.body.isbn,
      request.body.image_url,
      request.body.description
    ]
  )
    .then(function() {
      response.send('insert complete')
    })
    .catch(function(err) {
      console.error(err);
    });
});

app.put('/api/v1/books/updateBook/:id', (request, response) => {
  client.query(
    `UPDATE books
    SET
      title=$1,author=$2,isbn=$3,image_url=$4,description=$5
    WHERE book_id=$6;
    `,
    [
      request.body.title,
      request.body.author,
      request.body.isbn,
      request.body.image_url,
      request.body.description,
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

app.delete('/api/v1/books/deleteBook/:id', (request, response) => {
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

app.delete('/api/v1/books/deleteAllBooks', (request, response) => {
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
function loadBooks() {
  client.query('SELECT COUNT(*) FROM books')
    .then(result => {
      if(!parseInt(result.rows[0].count)) {
        fs.readFile('./public/data.json', 'utf8', (err, fd) => {
          JSON.parse(fd).forEach(ele => {
            client.query(`
              INSERT INTO
              books(title, author,isbn,image_url,description)
              VALUES ($1,$2,$3,$4,$5)`,
              [ele.title, ele.author,ele.isbn,ele.image_url,ele.description]
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
      author VARCHAR(255) NOT NULL,
      isbn VARCHAR(255) NOT NULL,
      image_url VARCHAR(255) NOT NULL,
      description VARCHAR(2055) NOT NULL)`
  )
    .then(() => {
      loadBooks();
    })
    .catch(err => {
      console.error(err);
    });
}

app.use((request, response) => response.status(404).sendFile('404.html', {root: './public'}))