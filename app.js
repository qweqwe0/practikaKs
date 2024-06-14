const express = require('express');
const https = require('https');
const app = express();
const port = 5501;
const host = '127.0.0.1';

const keywordsToUrls = {
  'red' : ['https://www.svgrepo.com/show/250514/coffee-cup-tea.svg', 'https://www.svgrepo.com/show/275700/coffee-cup-coffee.svg', 'https://www.svgrepo.com/show/263407/coffee-cup-food-and-restaurant.svg'],
  'blue': ['', 'https://www.svgrepo.com/show/284580/coffee-cup-coffee.svg','https://www.svgrepo.com/show/221552/coffee-cup-tea-cup.svg','https://www.svgrepo.com/show/229874/coffee-cup-paper-cup.svg', 'https://www.svgrepo.com/show/289839/coffee-cup-tea-cup.svg' ],
  'orange' : ['https://www.svgrepo.com/show/232753/coffee-cup-tea.svg', 'https://www.svgrepo.com/show/259389/coffee-cup-steam.svg'],
  'green' : ['https://www.svgrepo.com/show/263409/coffee-cup-tea-cup.svg', 'https://www.svgrepo.com/show/263401/coffee-cup-food.svg']
};

app.use(express.static('public'));

app.get('/search/:keyword', (req, res) => {
  const keyword = req.params.keyword;
  const urls = keywordsToUrls[keyword];
  if (urls) {
    res.json(urls);
  } else {
    res.status(404).send('Ключевое слово не найдено');
  }
});

app.get('/download/:url', (req, res) => {
  const url = decodeURIComponent(req.params.url);
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  https.get(url, (response) => {
    if (response.statusCode !== 200) {
      res.status(response.statusCode).send(response.statusMessage);
      return;
    }

    const contentLength = parseInt(response.headers['content-length'], 10);
    let bytesReceived = 0;
    let content = [];

    response.on('data', (chunk) => {
      bytesReceived += chunk.length;
      content.push(chunk);
      const progress = ((bytesReceived / contentLength) * 100).toFixed(2);
      res.write(`data: ${JSON.stringify({ progress })}\n\n`);
    });

    response.on('end', () => {
      const contentBuffer = Buffer.concat(content);
      res.write(`data: ${JSON.stringify({ progress: 100, content: contentBuffer.toString('base64') })}\n\n`);
      res.end();
    });

    response.on('error', (error) => {
      res.status(500).send(error.message);
    });
  }).on('error', (error) => {
    res.status(500).send(error.message);
  });
});

app.listen(port, host, () => {
  console.log(`Сервер запущен по адресу: http://${host}:${port}`);
});