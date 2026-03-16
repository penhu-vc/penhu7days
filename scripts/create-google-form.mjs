import { google } from 'googleapis';

const KEY_FILE = process.env.GOOGLE_APPLICATION_CREDENTIALS || '/Users/yaja/projects/service-account-key.json';

const auth = new google.auth.GoogleAuth({
  keyFile: KEY_FILE,
  scopes: [
    'https://www.googleapis.com/auth/forms.body',
    'https://www.googleapis.com/auth/drive',
  ],
});

const forms = google.forms({ version: 'v1', auth });
const drive = google.drive({ version: 'v3', auth });

const title = 'Penhu 報名表單';
const description = '新手七天陪跑課程報名資料蒐集';

const created = await forms.forms.create({
  requestBody: {
    info: { title, documentTitle: title },
  },
});

const formId = created.data.formId;
if (!formId) throw new Error('formId missing');

const requests = [
  {
    updateFormInfo: {
      info: { description },
      updateMask: 'description',
    },
  },
  {
    createItem: {
      location: { index: 0 },
      item: {
        title: 'LINE 名稱',
        questionItem: {
          question: {
            required: true,
            textQuestion: { paragraph: false },
          },
        },
      },
    },
  },
  {
    createItem: {
      location: { index: 1 },
      item: {
        title: 'LINE ID',
        questionItem: {
          question: {
            required: true,
            textQuestion: { paragraph: false },
          },
        },
      },
    },
  },
  {
    createItem: {
      location: { index: 2 },
      item: {
        title: '電話',
        questionItem: {
          question: {
            required: true,
            textQuestion: { paragraph: false },
          },
        },
      },
    },
  },
  {
    createItem: {
      location: { index: 3 },
      item: {
        title: 'OKX UID',
        questionItem: {
          question: {
            required: true,
            textQuestion: { paragraph: false },
          },
        },
      },
    },
  },
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
              shuffle: false,
            },
          },
        },
      },
    },
  },
  {
    createItem: {
      location: { index: 5 },
      item: {
        title: '你願意在加密貨幣投入多少新台幣（0 ~ 1,000,000）',
        questionItem: {
          question: {
            required: true,
            textQuestion: { paragraph: false },
          },
        },
      },
    },
  },
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
              shuffle: false,
            },
          },
        },
      },
    },
  },
];

await forms.forms.batchUpdate({
  formId,
  requestBody: { requests },
});

// Give anyone with link reader access to the form file so it is discoverable by your account if needed
await drive.permissions.create({
  fileId: formId,
  requestBody: {
    role: 'reader',
    type: 'anyone',
  },
});

const finalForm = await forms.forms.get({ formId });

console.log(JSON.stringify({
  formId,
  formUrl: finalForm.data.responderUri,
  editUrl: `https://docs.google.com/forms/d/${formId}/edit`,
}, null, 2));
