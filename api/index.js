import app from '../src/app.js';

export default async function handler(req, res) {
    res.setHeader('x-vercel-function', 'openos-api');

    return app(req, res);
}
