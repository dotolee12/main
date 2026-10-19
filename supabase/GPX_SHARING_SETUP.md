# GPX account sharing

The website is hosted by GitHub Pages. Auth and private route delivery use the
existing Supabase project; GitHub never stores users' shared GPX files.

## Deployment

1. In Supabase SQL Editor run `migrations/20261019_gpx_sharing.sql` as the project
   owner. It creates two new tables and three narrowly scoped RPC functions.
   Existing journey tables and authentication are not changed.
2. Set `GILOA_SUPABASE_URL` and `GILOA_SUPABASE_PUBLISHABLE_KEY` in root `config.js`
   using the project's URL and public publishable/anon key. Never put a secret or
   service-role key in this public repository.
3. Enable email/password authentication and set the Supabase Site URL to
   `https://giloa.kr`. Each sender and recipient must authenticate, verify their
   email if required, and register a unique sharing ID in the GPX panel.
4. Test using two accounts A/B and an unrelated account C. A sends a synthetic
   GPX to B's registered ID; B refreshes the received list and opens/downloads it.
   C and anonymous callers must not be able to read it even with the transfer ID.
   Check the 20 sends per UTC day limit and repeat a request UUID to verify that
   a delivery retry returns the existing transfer instead of duplicating it.

## Access model

- Legacy `currentUserId` is a local label, not identity proof. It is never used
  to authorize sending or reading. All operations require a Supabase JWT.
- Sharing IDs are immutable and unique; direct table access is denied. No email
  address or account directory is exposed to clients.
- Only authenticated RPC calls insert transfers. Sender identity comes from
  `auth.uid()`, never from the request body. Recipients can select only their
  own received rows. No authenticated direct insert/update/delete is granted.
- Transfers contain a snapshot of the selected saved GPX only, not photos,
  live position or all travel history. Files are limited to 1 MiB and are
  validated before sending and before reading. DOCTYPE/entities are rejected.
- Received files stay in the private server inbox until the associated sender
  or recipient account is deleted. Opening a route additionally saves a local
  copy in the device's existing saved GPX list. A recipient can forward a file.
- Sending uses an idempotency UUID in memory. A network retry in the same page
  session does not duplicate the send. Reloading the page starts a new intent.
- The inbox loads 20 rows at a time; Load more uses offset pagination. New
  arrivals can shift pages; refresh starts the list from the latest item.

Without project configuration or migration, the UI explains that ID sharing is
not ready; existing file export/import remains available. Browser-only tests
and mocked API tests do not establish that live RLS policies have been deployed.
