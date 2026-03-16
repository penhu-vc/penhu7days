import fs from 'node:fs/promises';
import { google } from 'googleapis';

const credRaw = JSON.parse(await fs.readFile('/Users/yaja/projects/oauth-credentials.json', 'utf8'));
const tokenRaw = JSON.parse(await fs.readFile('/Users/yaja/projects/oauth-token.json', 'utf8'));

const cfg = credRaw.installed || credRaw.web;
if (!cfg) throw new Error('oauth credentials format unsupported');

const client = new google.auth.OAuth2(cfg.client_id, cfg.client_secret, (cfg.redirect_uris || [])[0]);
client.setCredentials(tokenRaw);

const forms = google.forms({ version: 'v1', auth: client });

const created = await forms.forms.create({
  requestBody: {
    info: { title: 'Penhu 報名表單', documentTitle: 'Penhu 報名表單' },
  },
});

const formId = created.data.formId;
if (!formId) throw new Error('formId missing');

await forms.forms.batchUpdate({
  formId,
  requestBody: {
    requests: [
      { updateFormInfo: { info: { description: '新手七天陪跑課程報名資料蒐集' }, updateMask: 'description' } },
      { createItem: { location: { index: 0 }, item: { title: 'LINE 名稱', questionItem: { question: { required: true, textQuestion: { paragraph: false } } } } } },
      { createItem: { location: { index: 1 }, item: { title: 'LINE ID', questionItem: { question: { required: true, textQuestion: { paragraph: false } } } } } },
      { createItem: { location: { index: 2 }, item: { title: '電話', questionItem: { question: { required: true, textQuestion: { paragraph: false } } } } } },
      { createItem: { location: { index: 3 }, item: { title: 'OKX UID', questionItem: { question: { required: true, textQuestion: { paragraph: false } } } } } },
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
                    { value: '5 - 具備基礎' }
                  ],
                  shuffle: false
                }
              }
            }
          }
        }
      },
      { createItem: { location: { index: 5 }, item: { title: '你願意在加密貨幣投入多少新台幣（0 ~ 1,000,000）', questionItem: { question: { required: true, textQuestion: { paragraph: false } } } } } },
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
                  shuffle: false
                }
              }
            }
          }
        }
      }
    ]
  }
});

const finalForm = await forms.forms.get({ formId });
console.log(JSON.stringify({ formId, formUrl: finalForm.data.responderUri, editUrl: `https://docs.google.com/forms/d/${formId}/edit` }, null, 2));
