# NORSU Campus Marketplace

A web marketplace where students buy, sell and message each other on campus.
Built with **HTML/CSS/JavaScript pages + a small PHP 8 JSON API + MySQL/MariaDB**. No frameworks, no build step.

## Deploy

1. Upload the project files to the web root (or a sub-folder) of a PHP 8 host with MySQL/MariaDB and Apache
   (`.htaccess` support). Don't upload the `.git` folder.
2. Create a database and import `database/campus_marketplace.sql` (for example with phpMyAdmin).
3. Edit `includes/config.php`: set `DB_HOST`, `DB_NAME`, `DB_USER` and `DB_PASS` to your host's database
   details. `APP_DEBUG` is already `false` (errors are not shown to visitors).
4. Make sure the web server can write to `uploads/listings/` (photos of posted items).
5. Open the site and log in with one of the accounts below.

## Run it locally on XAMPP

1. Start **Apache** and **MySQL** in the XAMPP Control Panel.
2. Copy the folder to `C:\xampp\htdocs\campus-marketplace`, or link it (no copy needed) in PowerShell:
   ```powershell
   New-Item -ItemType Junction -Path "C:\xampp\htdocs\campus-marketplace" -Target "C:\path\to\Campus Marketplace"
   ```
3. Create a `campus_marketplace` database in phpMyAdmin and import `database/campus_marketplace.sql`.
4. Open <http://localhost/campus-marketplace/>.

The site has to be opened through a web server (not by double-clicking the HTML files or with Live Server),
because accounts are checked by PHP and stored in MySQL.

## Accounts in the database

| Name | Email | Student ID |
|------|-------|-----------|
| Maria Santos | maria.santos@campus.edu | 2024-10001 |
| Paolo Villanueva | paolo.villanueva@campus.edu | 2023-10002 |
| Andrea Bautista | andrea.bautista@campus.edu | 2025-10003 |

All three use the password `password123`. Change it after deploying. Maria Santos is the seller of the
23 listings in the database. Anyone can create a new account with **Sign Up**.

## Features

- **Accounts:** Sign Up saves the student (name, school email, student ID, hashed password) in the `users`
  table. Login only works for registered accounts, by email or student ID; wrong passwords are refused,
  and 5 failed tries lock login for 60 seconds. Edit Profile changes name, email and campus.
- **Listings are shared:** every item lives in the `listings` table, so an item one student posts (with up
  to 5 photos, saved in `uploads/listings/`) is seen by every student and guest. Sellers mark items sold
  or remove them from Profile → My Listings.
- **Marketplace:** search, categories, condition filter, and sorting (popular, newest, price). Home and Marketplace can be
  browsed without an account; Favorites, Post an Item, Messages and Profile need one.
- **Favorites and cart** are kept in each student's browser.
- **Checkout:** Cart → **Continue** sends each seller a purchase request as a message; buyer and seller then
  agree on payment and a campus meetup. Requests show under Profile → Items Bought.
- **Messages:** **Message** on an item opens a chat with its seller, with the item shown as a card (the
  seller can mark it sold right there). Replies appear without reloading, and the bell and the Messages
  item show unread messages. **⋯ → Delete chat** removes a conversation for you only.
- **Extra pages:** About, Campus Tour (the norsu.top campus map, embedded and sandboxed) and Terms and
  Conditions.
- **Layout:** a sidebar on desktop and a bottom bar on phones.

## Project structure

```
index.html                                      Home page
login/, marketplace/, favorites/, post-item/,   one folder per page, each with its .html file
profile/, messages/, about/, map/, terms/
css/                                            all stylesheets
  style.css                                     Home page
  login.css, marketplace.css, favorites.css,    one per page
  post-item.css, profile.css, messages.css
  info.css                                      About, Campus Tour and Terms and Conditions
  nav.css                                       sidebar (desktop) / bottom bar (phones)
  header.css                                    bell, cart and profile buttons + menus
  desktop.css                                   desktop layout (769px+), loaded last on every page
js/                                             all scripts
  script.js                                     Home page
  login.js, marketplace.js, favorites.js,       one per page
  post-item.js, profile.js, messages.js
  info.js                                       About, Campus Tour and Terms and Conditions
  auth.js                                       account check shared by every page
  header.js                                     bell, cart and profile buttons + menus
  products.js                                   loads listings from api/listings.php
api/                                            JSON endpoints: session, register, login, logout, profile,
                                                listings, messages
includes/                                       config, database, auth and helpers used by api/
assets/img/placeholder.svg                      shown when an item has no photo
uploads/                                        user-uploaded images (PHP execution is disabled here)
database/campus_marketplace.sql                 the database to import (tables + the 3 accounts + 23 listings)
```

## Security notes

- Passwords are hashed with `password_hash()`; every query uses prepared statements.
- Every change is sent with a CSRF token and checked for ownership on the server.
- Uploads are checked by type, limited to 5 MB, renamed and resized.
- `.htaccess` blocks `includes/`, `database/`, `.git`, this README and script execution in `uploads/`.
