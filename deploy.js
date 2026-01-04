import { readFileSync } from 'fs';
import { execSync } from 'child_process';

async function deploy() {
  console.log('Committing and pushing to GitHub...');
  try {
    execSync('git add -A');
    execSync('git diff --cached --quiet || git commit -m "Deploy to zenbin"');
    execSync('git push origin main');
    console.log('✓ Pushed to GitHub');
  } catch (e) {
    console.log('No changes to commit on GitHub');
  }

  const html = readFileSync('dist/index.html', 'utf-8');
  const base64 = Buffer.from(html).toString('base64');

  console.log('Deploying to ZenBin...');
  const response = await fetch('https://zenbin.onrender.com/v1/pages/vox-v1', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      encoding: 'base64',
      html: base64,
      title: 'Voxel Environment'
    })
  });

  if (response.status === 409) {
    console.error('Page ID vox-v1 is already taken on ZenBin');
    process.exit(1);
  }

  const data = await response.json();
  console.log(`✓ Published: ${data.url}`);
  console.log(`  Raw: ${data.raw_url}`);
}

deploy().catch(err => {
  console.error('Deploy failed:', err.message);
  process.exit(1);
});