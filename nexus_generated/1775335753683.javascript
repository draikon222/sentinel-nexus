const express = require('express');
const { createReadStream, createWriteStream } = require('fs');
const { pipeline } = require('stream');
const busboy = require('busboy');

const app = express();

app.post('/upload', (req, res) => {
  const busboy = new (req.busboy = require('busboy'))({ headers: req.headers });
  const uploadDir = './uploads';

  busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
    const filePath = `${uploadDir}/${filename}`;
    const writeStream = createWriteStream(filePath);

    pipeline(file, writeStream, (err) => {
      if (err) {
        console.error(err);
        res.status(500).send('Eroare la upload');
      } else {
        res.send(`Fisierul ${filename} a fost uploadat cu succes`);
      }
    });
  });

  req.pipe(busboy);
});

app.listen(3000, () => {
  console.log('Serverul este în rulare pe portul 3000');
});
