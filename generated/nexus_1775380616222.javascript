const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Setare port
app.listen(port, () => {
  console.log(`Server-ul ascultă pe portul ${port}`);
});

// Verificare semnătură HMAC
function verifyHmac(req, res, next) {
  const signature = req.headers['x-hub-signature-256'];
  const payload = req.body;
  const secret = 'secretea_mea'; // Setare secret
  const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  if (signature && signature.startsWith('sha256=')) {
    const signatureValue = signature.substring(7);
    if (crypto.timingSafeEqual(Buffer.from(signatureValue), Buffer.from(expectedSignature)) || signatureValue === expectedSignature) {
      next();
    } else {
      res.status(401).send('Unauthorized');
    }
  } else {
    res.status(401).send('Unauthorized');
  }
}

// Parsează JSON-ul
function parseJson(req, res, next) {
  try {
    const payload = req.body;
    const json = JSON.parse(payload);
    req.json = json;
    next();
  } catch (err) {
    res.status(400).send('Bad Request');
  }
}

// Filtrează prin payload.commits
function filterCommits(req, res, next) {
  const json = req.json;
  const commits = json.commits;
  const deployCommits = commits.filter(commit => commit.message.includes('#deploy'));
  if (deployCommits.length > 0) {
    next();
  } else {
    res.status(200).send('OK');
  }
}

// Execută script local
function executeScript(req, res) {
  const deployScript = path.join(__dirname, 'deploy.sh');
  const childProcess = require('child_process');
  childProcess.execFile(deployScript, (err, stdout, stderr) => {
    if (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    } else {
      res.status(200).send('OK');
    }
  });
}

// Rute
app.use(express.raw({ type: 'application/json' }));
app.post('/', verifyHmac, parseJson, filterCommits, executeScript, (req, res) => {
  res.status(200).send('OK');
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Internal Server Error');
});
