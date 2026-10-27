# Tejakrishna Badiganti | Portfolio

Personal portfolio of **Tejakrishna Badiganti**, Full Stack Software Engineer (Java, Spring Boot, microservices, Angular, AWS, Azure and AI agent engineering).

**Live site:** https://tejakrishnabadiganti.github.io/

## How it works

All text, images, certificates and colors live in one file, `data/content.json`. The page builds itself from that file, so the site can be updated without touching HTML, CSS or JavaScript.

There is a hidden admin editor (see [Editing the site](#editing-the-site)) that changes `data/content.json`, uploads new images and PDFs, and saves everything to this repository.

## Sections

| Section | Content |
| --- | --- |
| Hero | Headline, summary, resume download, social links, profile photo |
| Highlights | Years of experience, enterprise clients, certifications |
| About | Professional summary |
| How I work | Short principles about how you approach engineering, each with an example |
| Experience | Roles with achievements |
| Selected Work | Key projects and initiatives, each with an optional role, technologies and impact line |
| Skills | Grouped technical skills. Clicking a skill opens a popup with a plain explanation, an everyday analogy and links to official docs and blogs (edit them under Skill explanations in the admin) |
| Awards | Hackathon wins and performance recognition |
| Moments | Photo gallery of hackathons, teams and award moments, with filter buttons. Hidden until you add photos and tick Show |
| Certifications | Certificate images with matching digital badges, grouped by area |
| Education | Academic background |
| Contact | Email, phone, LinkedIn and GitHub |

## Features

- Responsive layout from mobile to desktop, with an always-visible menu bar (scrolls sideways on narrow screens) and a back-to-top button
- Light and dark themes (follows the system setting, remembered between visits)
- Classic look: serif headings, gold ornaments, double-line frames, scroll progress bar
- 3D effects: tilting framed portrait, tilting cards, 3D reveal on scroll, scrolling badge strip (switched off for touch devices and reduced-motion visitors)
- Accessible: skip link, keyboard focus styles, semantic landmarks, reduced-motion support
- Certificates open in a popup with Download, Verify (Credly) and Close
- Hidden admin editor for every section, theme colors, photo, resume and certifications
- No build step and no JavaScript libraries

## Editing the site

The editor is hidden from visitors and is not even downloaded for them.

1. **Open the login** with any one of these:
   - press `Ctrl + Shift + L` (`Cmd + Shift + L` on Mac)
   - click the copyright line at the bottom of the page 5 times
   - add `#admin` to the address (`https://tejakrishnabadiganti.github.io/#admin`)
2. **Sign in.** The username and password are not case-sensitive.
3. **Edit.** Pick a section from the drop-down. Everything below is editable and the page behind the editor updates as you type:
   - page title and search description
   - **Sections & menu**: reorder sections, hide or show them, rename each section's heading and its menu label
   - **Show on the public site**: every section's page (and Sections & menu) has this switch. Turn it off to hide that section from visitors. While the editor is open the section stays visible, dimmed and marked "Hidden from visitors", so you can turn it back on later.
   - profile, photo, resume, and the two top buttons' text
   - contact details and social links
   - highlights, about, experience, projects, skills, awards, certifications (including the Credly note), education
   - theme colors (including text colors), heading and body fonts, and default light/dark mode

   Still changed in code only: the visual design and layout, small interface labels (skip link, "Back to top", popup buttons, theme toggle), and adding a brand-new kind of section.
4. **Publish.** Choose "Review & publish", paste your GitHub token and press "Publish to GitHub". New images and the PDF are uploaded first, then `data/content.json` is saved. The live site updates in about 1-2 minutes.

Uploaded images are resized automatically (photo to 960px, certificates to 1400px as JPEG, badges to 256px) and named by the convention below. Nothing is saved until you publish, and the editor warns you before you leave with unpublished changes.

### GitHub token

Publishing needs a token that is limited to this one repository:

1. GitHub, then Settings, Developer settings, Personal access tokens, Fine-grained tokens.
2. Generate a new token and select only this repository.
3. Under Repository permissions, set **Contents** to **Read and write**.
4. Paste it into the editor's Publish screen. Tick "Remember on this device" only on a computer you trust.

### Security notes

- A static site has no server, so the username and password only **gate the editor screen**. Their stored form is a salted hash, but the page code is public and a short password can be guessed offline.
- The real protection is the **GitHub token**: nobody can change the live site without it. Never share or commit the token.
- Because of this, keep the token private and use a long, unique password if you change the login.
- Content is always inserted as text, never as HTML, so edited text cannot inject scripts.

To change the login, generate a new hash and replace the values in `packages/js/admin-config.js`:

```bash
node -e "const c=require('crypto');const salt=c.randomBytes(16);const secret='USERNAME'.toLowerCase()+'\n'+'PASSWORD'.toLowerCase();console.log({salt:salt.toString('hex'),iterations:210000,hash:c.pbkdf2Sync(secret,salt,210000,32,'sha256').toString('hex')})"
```

## Contact form (saved to Google Drive and emailed to you)

The "Get in touch" button opens a form that asks for first name, last name, email, phone number and the reason for connecting (for example Hiring: I have a job opportunity for you, Job seeker: I am looking for a job or a referral at your company, career guidance, knowledge sharing). Every field except the message is required. Each submission is added to a Google Sheet in your Drive and emailed to you. A static site has no server, so a small free Google Apps Script does this work. It is already written in `integrations/google-apps-script/Code.gs`.

Setup (about 5 minutes, once):

1. In Google Drive, open the Google Sheet that will hold the messages (or create a new one, for example "Portfolio enquiries"). Set its sharing to **Restricted** (only you). It will contain visitors' names, emails and phone numbers, so it must not be open to "anyone with the link". The script runs as you, so it can still write to it.
2. In the sheet, open **Extensions → Apps Script**. Delete the sample code and paste the whole of `integrations/google-apps-script/Code.gs`.
3. Optional: in `CONFIG`, set `notifyEmail` if the emails should go to a different address. Left empty, they go to your own Google account.
4. Click **Deploy → New deployment**, choose the type **Web app**, set **Execute as: Me** and **Who has access: Anyone**, then **Deploy**. Approve the permission prompt (Google may call the script unverified because you wrote it; choose Advanced, then Go to the project).
5. Copy the **Web app URL** (it starts with `https://script.google.com/macros/s/` and ends with `/exec`).
6. Open the site editor, go to **Contact & social links**, paste the URL into **Contact form: Google Apps Script URL**, then **Review & publish**.
7. Test it: submit the form on the live site. A new row appears in the sheet (tab "Contact requests") and an email arrives with the reply address set to the visitor.

**Confirmation email to the visitor.** After a message is saved, the visitor automatically gets a friendly, designed email: it greets them by first name, confirms their details arrived, mentions their reason (recruiters and job seekers get different replies; job seekers are asked for their resume and the role they want), says you will reach out as soon as you are free, and includes a short intro and your links. Replies go to you. Edit the wording, role, intro and links in `CONFIG` at the top of `Code.gs`, or set `sendConfirmation: false` to turn it off. Each address gets one confirmation every few hours, only the chosen reason (never free text) is echoed back, and a failed confirmation never loses the enquiry. Google limits a free account to about 100 emails a day, and each enquiry now sends two (one to you, one to the visitor).

If you change `Code.gs` later, use **Deploy → Manage deployments → Edit → New version** so the live URL picks up the change.

Until the URL is set, the form opens the visitor's email app with the details filled in instead. The reasons, button text, introduction and thank-you message are all editable in the same editor screen.

Protection against spam and misuse: a hidden field catches bots, the script validates every field and limits length, allows 3 messages per email address and 30 in total per hour, writes text that starts with `=`, `+`, `-` or `@` safely into the sheet, and escapes everything in the email. The site only ever sends data to a `script.google.com` address. The web app URL itself is public (it has to be), but it can only add rows and send you an email.

## Visitor counts

The same Google Sheet also counts visits. Each visit adds one anonymous row to a **Visits** sheet (time, a random visitor ID, new or returning, the website they came from, device type, time zone, language) and a **Visit summary** sheet shows live totals: total visits, unique visitors, returning visits, today, the last 7 days, contact messages and top referring websites.

Names, emails and IP addresses of ordinary visitors are not collected and cannot be read by a static site; the footer says so. The only people you can identify are those who fill in the contact form, who appear in **Contact requests**. Your own visits are skipped on any device where you have signed in to the editor, and so are bots, local testing and browsers with Do Not Track on. To see the numbers without opening the sheet, sign in to the editor and choose **Visitors**: totals, visits per day for the last 14 days, where visitors came from and which devices they use (anonymous totals only). After changing `Code.gs`, publish a new version (see above).

## Search, sharing and extras

- **Link previews and search:** `index.html` carries a static title, description, social preview tags (the portrait is the preview image), a canonical link and structured data about you, because search engines and LinkedIn do not run JavaScript. If your name, title or links change, update that block too. `sitemap.xml` lists the page; submit `https://tejakrishnabadiganti.github.io/sitemap.xml` in Google Search Console after the first publish.
- **Favicon:** `packages/images/favicon.svg` (your initials).
- **Availability badge:** Profile, photo & resume has an *Availability badge* field. Leave it empty to hide the green "Open to new opportunities" badge.
- **Book a call:** Contact & social links has a *Book a call link* (Calendly or Google Calendar). The button only appears when it is filled in.
- **Project impact and links:** each Selected work project can have an *Impact or result* line and a *Project link*.
- **Recommendations:** a new section, hidden until you add a quote and tick *Show*.
- **Printing:** the page prints as a clean resume (no menu, buttons or animations; links show their address).

### Custom domain (optional)

1. Buy a domain, for example `tejakrishna.dev`.
2. In the repository go to Settings, Pages, Custom domain, enter it and save. GitHub adds a `CNAME` file.
3. At your domain provider add the DNS records GitHub lists on that page, then tick *Enforce HTTPS*.
4. Update the address in `index.html` (canonical, social tags, structured data), `sitemap.xml` and the links in `Code.gs` (`CONFIG.links`).

## Project structure

```
.
├── index.html                  # Page shell (sections are filled from content.json)
├── README.md
├── data/
│   └── content.json            # All editable content
├── integrations/
│   └── google-apps-script/
│       └── Code.gs             # Saves contact form messages to a Google Sheet and emails them
├── packages/                   # Everything the live site uses
│   ├── css/
│   │   ├── styles.css          # Design tokens, layout, light/dark themes, editor styles
│   │   ├── classic.css         # Classic ornaments, 3D effects and background shading (loaded after styles.css)
│   │   └── fonts.css           # Self-hosted Inter and Playfair Display
│   ├── js/
│   │   ├── main.js             # Entry point
│   │   ├── site.js             # Loads content.json and refreshes the page
│   │   ├── defaults.js         # Fills in missing content so older saved data still works
│   │   ├── render.js           # Builds each section from the content
│   │   ├── hero-roles.js       # Rotates the job title above the headline
│   │   ├── moments.js          # Photo gallery with group filters
│   │   ├── theme.js            # Applies the theme colors
│   │   ├── reveal.js           # Scroll-reveal animation
│   │   ├── motion.js           # Scroll progress bar and pointer-driven 3D tilt
│   │   ├── contact-form.js     # "Get in touch" popup form and sending
│   │   ├── visit-counter.js    # Anonymous visit count sent to the Google Sheet
│   │   ├── ui.js               # Theme toggle, menu, certificate popup, hidden editor trigger
│   │   ├── dom.js, store.js    # Safe DOM helpers and unpublished-file store
│   │   ├── admin.js            # Editor (loaded only after the hidden trigger)
│   │   ├── admin-visitors.js   # Editor "Visitors" tab (visit totals)
│   │   ├── schema.js           # What each editor section can edit
│   │   ├── auth.js             # Login check (hash comparison)
│   │   ├── admin-config.js     # Login hash
│   │   ├── files.js            # Image resizing and PDF handling
│   │   └── github.js           # Saves changes to GitHub
│   ├── documents/              # Resume PDF
│   ├── fonts/                  # Self-hosted web fonts
│   └── images/
│       ├── og-image.png        # Link preview image (1200x630)
│       ├── profile/            # Hero profile photo
│       ├── certificates/       # Certificate images
│       └── badges/             # Digital badge images
```

Everything in the repository is used by the site. Keep old files, drafts and personal documents outside this public repository.

### Certificate and badge naming

A certificate and its badge use the **same file name** in different folders, so they are always easy to match:

```
packages/images/certificates/<issuer>-<code>-<certification-name>.<ext>
packages/images/badges/<issuer>-<code>-<certification-name>.<ext>
```

Example:

```
packages/images/certificates/microsoft-az-900-azure-fundamentals.jpg
packages/images/badges/microsoft-az-900-azure-fundamentals.png
```

The editor creates these names automatically from the issuer and certification name.

## Run locally

No installation is required. Browsers block loading `data/content.json` from a plain file, so use a local server. From the project folder:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Deployment

The site is served by GitHub Pages from the `main` branch (root folder). Every push to `main` rebuilds the site, including the commits made by the editor.
