# EL'S BRAIDS

A full-stack MERN business website for EL'S BRAIDS, featuring a branded customer storefront, online appointment flow, shopping cart, checkout flow, and protected admin dashboard.

## Stack

- Frontend: React + Vite + Tailwind
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- Auth: JWT + bcrypt
- Storage: Cloudinary-ready upload integration
- Email: Nodemailer-ready configuration

## Quick start

1. Copy `.env.example` to `.env` and fill the values.
   Generate an admin password hash with `node -e "console.log(require('bcryptjs').hashSync(process.argv[1], 12))" "your-password"`, then set `ADMIN_EMAIL` and `ADMIN_PASSWORD_HASH`. Never commit `.env`.
2. Start the backend:
   ```bash
   cd server
   npm install
   npm run dev
   ```
3. Start the frontend:
   ```bash
   cd client
   npm install
   npm run dev
   ```

## Open on another device over Wi-Fi

1. Connect the phone or other device to the same Wi-Fi network as this computer.
2. Find this computer's IPv4 address with `ipconfig` on Windows.
3. Start the backend and frontend using the commands above.
4. Open `http://YOUR_IPV4_ADDRESS:5173` on the other device, for example `http://192.168.1.20:5173`.

If Windows Firewall prompts for Node.js access, allow it on private networks. Keep both development servers running while using the site.

## Notes

This project ships with a sample in-memory data layer for local demonstration purposes. Production requires configured persistent storage, secrets, an admin email, and a bcrypt admin password hash. The server refuses production startup when required security configuration is absent.
