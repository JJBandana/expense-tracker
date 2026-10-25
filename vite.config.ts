import { paraglideVitePlugin } from '@inlang/paraglide-js';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type Plugin } from 'vite';

function oauthDevProxyPlugin(): Plugin {
  return {
    name: 'oauth-dev-proxy',
    configureServer(server) {
      server.middlewares.use('/api/oauth/token', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }

        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const data = JSON.parse(body);
            const clientId = data.client_id || process.env.PUBLIC_SUPABASE_OAUTH_CLIENT_ID;
            const clientSecret = data.client_secret || process.env.SUPABASE_OAUTH_CLIENT_SECRET;

            if (!clientId || !clientSecret) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  error:
                    'Missing OAuth Client ID or Client Secret. Please set PUBLIC_SUPABASE_OAUTH_CLIENT_ID and SUPABASE_OAUTH_CLIENT_SECRET in .env or provide them in the request.'
                })
              );
              return;
            }

            const tokenResponse = await fetch('https://api.supabase.com/v1/oauth/token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Accept: 'application/json',
                Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
              },
              body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: data.code,
                redirect_uri: data.redirect_uri
              })
            });

            const tokenData = await tokenResponse.json();
            res.statusCode = tokenResponse.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(tokenData));
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: message }));
          }
        });
      });
    }
  };
}

export default defineConfig({
  server: {
    allowedHosts: ['.jojomoka.space'],
    host: true,
    port: 3000
  },
  plugins: [
    oauthDevProxyPlugin(),
    tailwindcss(),
    sveltekit(),
    paraglideVitePlugin({ project: './project.inlang', outdir: './src/lib/paraglide' })
  ]
});
