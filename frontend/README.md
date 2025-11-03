# Cloudinary
The Cloudinary SDK’s uploader.upload() and upload_large() methods work using callbacks
That’s fine, but callback-based code can quickly become messy, especially when using modern async/await style.
To make this cleaner and easier to work with, we wrap the upload in a Promise

# Multer
1. multer({ dest: 'uploads/' })

This initializes Multer, a popular Node.js middleware for handling multipart/form-data — the kind of data sent when users upload files (like images or videos) in forms.

dest: 'uploads/' means all uploaded files are first saved temporarily in the uploads/ folder on your server.

Each file gets a random name by default (for example, uploads/3bff2b3d7a8b).

You’ll often clean these up later — like how your Cloudinary upload function deletes the local file with fs.unlink.

2. .single('media')

This tells Multer to:

Expect only one file in the request.

The file should come from the form field named "media".

Example:

<form method="POST" enctype="multipart/form-data" action="/upload">
  <input type="file" name="media" />
  <button type="submit">Upload</button>
</form>


When a user submits that form, Multer processes the file and attaches it to req.file in your Express route.


# Logout
res.clearCookie("auth_token", {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
});
This tells Express:

“Hey, browser — delete the cookie named auth_token and make sure it matches the same settings it was created with.”

🧠 Why do we need to call clearCookie()?
When you set a cookie, it’s stored by the browser with specific attributes (path, domain, sameSite, etc.).
To remove it, the browser needs to receive another “Set-Cookie” header with:

The same cookie name, and

Matching options (like path, domain, etc.), and

An expired date.

Express’s res.clearCookie() automatically does this — it sets the cookie’s expiration to a date in the past and sends that response header back.

🔍 What each option means
1. httpOnly: true
This makes the cookie inaccessible to JavaScript in the browser.

✅ Prevents attacks like XSS (Cross-Site Scripting), because malicious scripts can’t steal your JWT from document.cookie.

So:

true = safer, cookie can only be read/written by the server.

false = JavaScript can access it (not recommended for auth tokens).

2. sameSite: "lax"
This controls when browsers send the cookie during cross-site requests.

"lax" — send the cookie for same-site navigation and top-level GETs (safe default).

"strict" — send only for same-site requests (very restrictive).

"none" — send it for all requests, but requires secure: true.

✅ "lax" is usually best for authentication because it prevents most CSRF attacks but still lets your frontend and backend (if on the same domain) communicate smoothly.

3. secure: process.env.NODE_ENV === "production"
This ensures the cookie is only sent over HTTPS when your app is in production.

✅ Prevents cookies from being exposed over plain HTTP.

So:

In production (NODE_ENV=production): only send over HTTPS.

In development: it’s okay to use HTTP (for localhost testing).

