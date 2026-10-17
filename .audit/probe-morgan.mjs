// Does morgan('dev') write the query string (i.e. ?key=...) to stdout?
import http from 'node:http';

const lines = [];
const origLog = console.log;
console.log = (...a) => lines.push(a.join(' '));

const { default: express } = await import('express');
const { default: morgan } = await import('morgan');

const app = express();
app.use(morgan('dev'));
app.get('/echo', (req, res) => res.json({ ok: true }));

const srv = http.createServer(app);
await new Promise((r) => srv.listen(0, r));
const port = srv.address().port;

const SECRET = 'opm-live-5x-9f8a3c2e1b4d7f0a';
const res = await fetch(`http://127.0.0.1:${port}/echo?key=${SECRET}`);
await res.text();

// let the log line flush
await new Promise((r) => setTimeout(r, 300));
srv.close();
console.log = origLog;

const joined = lines.join('\n');
console.log('--- morgan output ---');
console.log(joined);
console.log('---');
console.log('SECRET in log:', joined.includes(SECRET));
console.log('query present  :', joined.includes('key=opm-live'));
