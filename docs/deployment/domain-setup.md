# Domain Setup

Production domain:

```text
dominovibes.com
```

Recommended canonical domain:

```text
https://dominovibes.com
```

Use `www.dominovibes.com` as an alias that redirects to `dominovibes.com` unless there is a product reason to make `www` primary.

Reference docs:

- Netlify custom domains: https://docs.netlify.com/manage/domains/get-started-with-domains/
- Netlify DNS: https://docs.netlify.com/manage/domains/set-up-netlify-dns/
- Netlify HTTPS/SSL: https://docs.netlify.com/domains-https/https-ssl/

## Netlify Domain Management

Since the domain is already with Netlify, use the simple dashboard path:

1. Open the Domino Vibes Netlify site.
2. Go to Site configuration.
3. Open Domain management.
4. Add custom domain `dominovibes.com`.
5. Confirm the DNS zone is managed by Netlify or points correctly to the Netlify site.
6. Set `dominovibes.com` as the primary domain.
7. Add `www.dominovibes.com` as a domain alias if it is not already present.
8. Confirm `www.dominovibes.com` redirects to `dominovibes.com`.

## HTTPS / SSL

1. In Domain management, open HTTPS.
2. Confirm Netlify has provisioned a certificate for `dominovibes.com`.
3. Confirm the certificate also covers `www.dominovibes.com` if using the alias.
4. Visit `https://dominovibes.com` in a fresh browser session.
5. Confirm the browser shows a valid secure connection.

DNS and certificate provisioning can take time. If SSL is pending:

- Confirm DNS records point to the correct Netlify site.
- Confirm no old A, CNAME, ALIAS, or conflicting records point elsewhere.
- Wait for DNS propagation.
- Retry certificate provisioning from Netlify if DNS has recently changed.

## Wrong Site or 404 Checks

If the domain points to the wrong site:

- Confirm `dominovibes.com` is attached to only the Domino Vibes Netlify site.
- Check for another Netlify site still using the domain.
- Confirm the primary domain and aliases are set on the intended site.
- Confirm DNS records are not pointing to an old host.

If deep routes such as `/lobby` or `/games/:gameId` return 404 after refresh:

- Confirm the deployed repo includes `netlify.toml`.
- Confirm the redirect rule rewrites `/*` to `/index.html` with status `200`.
- Redeploy from `main`.

## Supabase Auth Redirects

After the domain is live, update Supabase Auth settings:

- Site URL: `https://dominovibes.com`
- Redirect URLs: include `https://dominovibes.com/*`
- Keep localhost redirect URLs for local development if needed.
