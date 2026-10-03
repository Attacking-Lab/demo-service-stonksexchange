Stonks Exchange
===============

Authors:

* ldruschk (Lucas Druschke)

Categories:

* web


Overview
--------

A small message board with the theme of a stock exchange.

The service is an Express application with a MongoDB backend. It renders its
pages from pug templates. The `SERVICE_PORT` variable sets the port and the
default is 9000.

A user registers with a username and a password. The service hashes the
password with argon2 and stores the hash. Login reads the user record by
username and gives the stored hash and the sent password to `argon2.verify`.
On a match the service writes the username into the session.

A logged-in user reads the own messages at `GET /messages`. The service
selects them by the username in the session, sorts them newest first and
returns at most 50. `POST /message` writes a message to another user. The
message record holds the name of the addressee, the text and the name of the
sender.

### Flag Store 1

The checker registers two users and sends a message with the flag from the
first user to the second one. The checker reads the flag back from
`GET /messages` with the session of the second user. The service publishes no
attack info.


Vulnerabilities
---------------

### Flag Store 1, Vuln 1

`POST /login` passes `req.body.username` straight into
`db.collection('users').findOne()`. The route accepts a JSON body, so the
username may arrive as an object. MongoDB then reads that object as a query
operator instead of a value.

The route writes the same unchecked value into `req.session.user` on a
successful login. `GET /messages` selects the messages with that session
value, so the operator reaches a second query.

We can register an account whose username sorts low, and then log in with
`{"$gte": "<our username>"}` as the username and our own password. The query
sorts by `$natural: -1`, so it returns our own record, the argon2 check
passes, and the session holds the operator. `GET /messages` then matches the
messages of every user and returns the flag among them.

A participant of BambiCTF #5 published a write-up of this vulnerability.
See https://danielhabenicht.github.io/blog/2021/04/17/first-ctf-at-tu-berlin-bambi.html

* Difficulty: medium
* Discoverability: medium
* Patchability: easy
* Categories: web
* Checker exploit: `exploit_test`, variant id 0


Patches
-------

### Flag Store 1, Vuln 1

We can mitigate the vulnerability with a cast of the username and the
password to a string. An object then collapses to the text
`[object Object]`, which matches no user, and an ordinary login keeps its
behaviour. The cast belongs in all three places: the user query, the argon2
call and the write to the session.

### Patch files

* `patches/0-nosql-login-injection` applies the fix for exploit variant 0.
  The file is a shell script with an inline unified diff against
  `routes/index.js`. `enochecker_test` runs the script with the working
  directory set to a copy of `service/`.

The diff carries the styled error responses of `POST /login` as context
lines. A change to those responses needs a new hunk.
