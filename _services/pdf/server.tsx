import ReactPDF from '@react-pdf/renderer';
import { TenantDocument } from './templates/tenant_template';
import * as express from 'express';
import * as pkg from './package.json';

const app = express();
// use PORT + 1 to avoid conflict with Breeze_backend
const port = (parseInt(process.env.PORT) || 3000) + 1;

app.get('/status', (req, res) => {
  res.json({ status: 'ok', version: pkg.version });
})

app.get('/pdf', async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/pdf');
    res.attachment('tenant.pdf');

    // @todo add data from request to pdf
    const pdfStream = await ReactPDF.renderToStream(<TenantDocument />);
    pdfStream.pipe(res);
  } catch (err) {
    // @todo report proper error to caller
    console.error(err);
  }
});

app.listen(port, () => {
  console.log(`Pdf render app listening on port ${port}`);
});
