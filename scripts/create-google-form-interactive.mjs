import fs from 'node:fs/promises';
import http from 'node:http';
import { google } from 'googleapis';

const CRED_PATH = '/Users/yaja/projects/oauth-credentials.json';
const TOKEN_PATH = '/Users/yaja/projects/oauth-token.json';
const PORT = 3559;

const SCOPES = [
  'https://www.googleapis.com/auth/forms.body',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets',
];

const credRaw = JSON.parse(await fs.readFile(CRED_PATH, 'utf8'));
const cfg = credRaw.installed || credRaw.web;
if (!cfg) throw new Error('Invalid oauth-credentials.json');

const redirectUri = `http://localhost:${PORT}/oauth2callback`;
const oAuth2Client = new google.auth.OAuth2(cfg.client_id, cfg.client_secret, redirectUri);

let token;
try {
  token = JSON.parse(await fs.readFile(TOKEN_PATH, 'utf8'));
  oAuth2Client.setCredentials(token);
  await oAuth2Client.getAccessToken();
} catch {
  token = null;
}

if (!token) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });

  console.log('\n請打開這個網址完成授權：\n');
  console.log(authUrl);
  console.log(`\n等待 Google 回呼到 http://localhost:${PORT}/oauth2callback ...\n`);

  const code = await new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const url = new URL(req.url || '/', `http://localhost:${PORT}`);
        if (url.pathname !== '/oauth2callback') {
          res.writeHead(404).end('Not found');
          return;
        }
        const oauthCode = url.searchParams.get('code');
        if (!oauthCode) {
          res.writeHead(400).end('Missing code');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('授權成功，可以回到終端機。');
        server.close();
        resolve(oauthCode);
      } catch (err) {
        server.close();
        reject(err);
      }
    });
    server.listen(PORT, '127.0.0.1');
  });

  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);
  await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens, null, 2), 'utf8');
}

const forms = google.forms({ version: 'v1', auth: oAuth2Client });

const createRes = await forms.forms.create({
  requestBody: {
    info: {
      title: 'Penhu 報名表單',
      documentTitle: 'Penhu 報名表單',
    },
  },
});

const formId = createRes.data.formId;
if (!formId) throw new Error('Failed to create form');

await forms.forms.batchUpdate({
  formId,
  requestBody: {
    requests: [
      { updateFormInfo: { info: { description: '新手七天陪跑課程報名資料蒐集' }, updateMask: 'description' } },
      { createItem: { location: { index: 0 }, item: { title: 'LINE 名稱', questionItem: { question: { required: true, textQuestion: {} } } } } },
      { createItem: { location: { index: 1 }, item: { title: 'LINE ID', questionItem: { question: { required: true, textQuestion: {} } } } } },
      { createItem: { location: { index: 2 }, item: { title: '電話', questionItem: { question: { required: true, textQuestion: {} } } } } },
      { createItem: { location: { index: 3 }, item: { title: 'OKX UID', questionItem: { question: { required: true, textQuestion: {} } } } } },
      {
        createItem: {
          location: { index: 4 },
          item: {
            title: '你對於加密貨幣的了解程度',
            questionItem: {
              question: {
                required: true,
                choiceQuestion: {
                  type: 'RADIO',
                  options: [
                    { value: '1 - 完全新手' },
                    { value: '2 - 剛入門' },
                    { value: '3 - 略有所聞' },
                    { value: '4 - 有操作過' },
                    { value: '5 - 具備基礎' },
                  ],
                },
              },
            },
          },
        },
      },
      { createItem: { location: { index: 5 }, item: { title: '你願意在加密貨幣投入多少新台幣（0~100萬）', questionItem: { question: { required: true, textQuestion: {} } } } } },
      {
        createItem: {
          location: { index: 6 },
          item: {
            title: '報名梯次',
            questionItem: {
              question: {
                required: true,
                choiceQuestion: {
                  type: 'DROP_DOWN',
                  options: [{ value: '第一梯' }],
                },
              },
            },
          },
        },
      },
    ],
  },
});

const form = await forms.forms.get({ formId });

console.log('\n建立完成：');
console.log(`formId: ${formId}`);
console.log(`填寫網址: ${form.data.responderUri}`);
console.log(`編輯網址: https://docs.google.com/forms/d/${formId}/edit`);
