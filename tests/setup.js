import fs from 'fs';

const routePath = './src/app/api/ideas/[id]/accept/route.js';
const routeContent = fs.readFileSync(routePath, 'utf8');
const fixedContent = routeContent
  .replace(/@\/lib\/mongodb/g, '../../../src/lib/mongodb.js')
  .replace(/@\/models\/Idea/g, '../../../src/models/Idea.js')
  .replace(/@\/lib\/api-auth/g, '../../../src/lib/api-auth.js')
  .replace(/@\/lib\/api-response/g, '../../../src/lib/api-response.js')
  .replace(/@\/lib\/ai-memory/g, '../../../src/lib/ai-memory.js');

fs.writeFileSync('./tests/temp-route.js', fixedContent);
