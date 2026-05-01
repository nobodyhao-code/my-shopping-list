require('dotenv').config();
const { createStorage } = require('./storage');

async function main() {
  const storage = await createStorage();
  console.log(`Seed completed using storage mode: ${await storage.getMode()}`);
  await storage.close();
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
