import ReactPDF from '@react-pdf/renderer';
import { TenantDocument } from './templates/tenant_template';
import express from 'express';
import * as pkg from './package.json';
import i18next from 'i18next';
import Backend from 'i18next-http-backend';
import middleware from 'i18next-http-middleware';
import { getAllTranslatedKeyValues, getTranslation } from './util/translatedKey';

i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    fallbackLng: 'en',
    fallbackNS: 'translation',
    backend: {
      loadPath: '../pdf/locales/{{lng}}/{{ns}}.json',
      request: (__options: any, url: any, __payload: any, callback: any) => {
        try {
          const [lng] = url.split('|');
          const language = lng.includes('en') ? 'en' : 'de';
          getAllTranslatedKeyValues(language).then((response) => {
            callback(null, {
              data: response.data,
              status: 200,
            });
          });
        } catch (e) {
          console.error('backendOptions-error', e);
          callback(null, {
            status: 500,
          });
        }
      },
    },
  });

const app = express();
app.use(middleware.handle(i18next));
app.use(express.json());
// use PORT + 1 to avoid conflict with Breeze_backend
const port = (parseInt(process.env.PORT) || 3000) + 1;

app.get('/status', (req, res) => {
  res.json({ status: 'ok', version: pkg.version });
});

app.post('/pdf', async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/pdf');
    res.attachment(
      `${getTranslation(req.t, 'prospect.profile.pdf.file_name').replace(/\s+/g, '')}.pdf`
    );

    // @todo add data from request to pdf
    const pdfStream = await ReactPDF.renderToStream(
      <TenantDocument t={req.t} {...req.body.data} />
    );
    pdfStream.pipe(res);
  } catch (err) {
    // @todo report proper error to caller
    console.error(err);
  }
});

app.listen(port, () => {
  console.log(`Pdf render app listening on port ${port}`);
});
