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
