import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');
const indexHtmlPath = path.join(distDir, 'index.html');

if (!fs.existsSync(indexHtmlPath)) {
  console.error('dist/index.html not found!');
  process.exit(1);
}

const indexContent = fs.readFileSync(indexHtmlPath, 'utf8');

const htaccessPath = path.resolve('public/.htaccess');
if (fs.existsSync(htaccessPath)) {
  fs.copyFileSync(htaccessPath, path.join(distDir, '.htaccess'));
  console.log('✓ Copied .htaccess to dist/');
}

fs.writeFileSync(path.join(distDir, '404.html'), indexContent);

const routes = [
  'ega',
  'ega/login',
  'ega/competitions',
  'ega/olympiads',
  'ega/leaderboard',
  'ega/ratings',
  'ega/subjects',
  'ega/locations',
  'ega/team',
  'ega/users',
  'ega/proctoring',
  'ega/certificates',
  'ega/finance',
  'ega/payments',
  'ega/notifications',
  'ega/support',
  'ega/packages',
  'ega/security',
  'ega/settings',
  'ega/baholash',
  'ega/baholash/rubric',
  'admin',
  'admin/login',
  'dashboard',
  'dashboard/milliy-sertifikat',
  'dashboard/baholash',
  'student/olympiads',
  'student/leaderboard',
  'teacher/dashboard',
  'teacher/olympiads',
  'results',
  'certificates',
  'profile',
  'olympiads',
  'leaderboard',
  'verify-certificate',
  'about',
  'terms',
  'privacy',
  'rules',
  'baholash',
  'rash-modul',
  'auth/login',
  'auth/register',
  'auth/forgot-password',
  'login',
  'register',
  'swagger',
  'api-docs'
];

routes.forEach((route) => {
  const dir = path.join(distDir, route);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), indexContent);
});

console.log(`✓ Successfully generated route directories for ${routes.length} routes.`);
