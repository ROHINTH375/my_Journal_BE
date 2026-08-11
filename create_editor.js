// Out-of-band editor provisioning — there's no self-service registration
// endpoint by design (same pattern as tyreshop-server's create_admin.js).
// Usage: node create_editor.js "Full Name" email@example.com password [editor|admin]
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const Editor = require('./models/Editor');

dotenv.config();

const [name, email, password, role = 'editor'] = process.argv.slice(2);

if (!name || !email || !password) {
  console.error('Usage: node create_editor.js "Full Name" email@example.com password [editor|admin]');
  process.exit(1);
}

if (!['editor', 'admin'].includes(role)) {
  console.error('role must be "editor" or "admin"');
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB Connected');

    const existing = await Editor.findOne({ email });
    if (existing) {
      console.log('An editor with that email already exists.');
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const editor = new Editor({ name, email, password: await bcrypt.hash(password, salt), role });
    await editor.save();

    console.log('=================================');
    console.log('Editor created');
    console.log(`Name:  ${name}`);
    console.log(`Email: ${email}`);
    console.log(`Role:  ${role}`);
    console.log('=================================');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
