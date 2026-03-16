import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
  keyFile: '/Users/yaja/projects/service-account-key.json',
  scopes: [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/forms.body',
  ],
});

const drive = google.drive({ version: 'v3', auth });
const forms = google.forms({ version: 'v1', auth });

const file = await drive.files.create({
  requestBody: {
    name: 'Penhu 報名表單',
    mimeType: 'application/vnd.google-apps.form',
  },
  fields: 'id,name,webViewLink',
});

const formId = file.data.id;
if (!formId) throw new Error('no form id');

await forms.forms.batchUpdate({
  formId,
  requestBody: {
    requests: [
      { updateFormInfo: { info: { description: '新手七天陪跑課程報名資料蒐集' }, updateMask: 'description' } },
      { createItem: { location: { index: 0 }, item: { title: 'LINE 名稱', questionItem: { question: { required: true, textQuestion: {} } } } } },
      { createItem: { location: { index: 1 }, item: { title: 'LINE ID', questionItem: { question: { required: true, textQuestion: {} } } } } },
      { createItem: { location: { index: 2 }, item: { title: '電話', questionItem: { question: { required: true, textQuestion: {} } } } } },
      { createItem: { location: { index: 3 }, item: { title: 'OKX UID', questionItem: { question: { required: true, textQuestion: {} } } } } },
      { createItem: { location: { index: 4 }, item: { title: '你對於加密貨幣的了解程度', questionItem: { question: { required: true, choiceQuestion: { type: 'RADIO', options: [{value:'1 - 完全新手'},{value:'2 - 剛入門'},{value:'3 - 略有所聞'},{value:'4 - 有操作過'},{value:'5 - 具備基礎'}] } } } } } },
      { createItem: { location: { index: 5 }, item: { title: '你願意在加密貨幣投入多少新台幣（0~100萬）', questionItem: { question: { required: true, textQuestion: {} } } } } },
      { createItem: { location: { index: 6 }, item: { title: '報名梯次', questionItem: { question: { required: true, choiceQuestion: { type: 'DROP_DOWN', options: [{value:'第一梯'}] } } } } } },
    ]
  }
});

const form = await forms.forms.get({ formId });
console.log(JSON.stringify({ formId, responderUri: form.data.responderUri, edit: `https://docs.google.com/forms/d/${formId}/edit` }, null, 2));
