const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

const appUrl = 'https://farhaan-saloon-app.vercel.app/';
const publicDir = path.resolve(__dirname, 'public');
const artifactDir = 'C:\\Users\\admis\\.gemini\\antigravity\\brain\\40798a6e-dab5-4ecd-a5cd-10d6b4b37e73';

async function generate() {
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const pngPublic = path.join(publicDir, 'farhaan-saloon-qr.png');
  const pngArtifact = path.join(artifactDir, 'farhaan-saloon-qr.png');

  // 1. High-Resolution PNG (1024x1024)
  await QRCode.toFile(pngPublic, appUrl, {
    width: 1024,
    margin: 2,
    color: {
      dark: '#111217',
      light: '#ffffff'
    },
    errorCorrectionLevel: 'H'
  });
  fs.copyFileSync(pngPublic, pngArtifact);

  // 2. High-Quality SVG
  const svgPublic = path.join(publicDir, 'farhaan-saloon-qr.svg');
  const svgArtifact = path.join(artifactDir, 'farhaan-saloon-qr.svg');
  const svgStr = await QRCode.toString(appUrl, {
    type: 'svg',
    margin: 2,
    color: {
      dark: '#111217',
      light: '#ffffff'
    },
    errorCorrectionLevel: 'H'
  });
  fs.writeFileSync(svgPublic, svgStr);
  fs.writeFileSync(svgArtifact, svgStr);

  // 3. Base64 Data URL for in-app or offline use
  const dataUrl = await QRCode.toDataURL(appUrl, {
    width: 512,
    margin: 2,
    errorCorrectionLevel: 'H'
  });
  fs.writeFileSync(path.join(publicDir, 'qr-dataurl.txt'), dataUrl);

  console.log('Generated PNG:', pngPublic, 'Size:', fs.statSync(pngPublic).size, 'bytes');
  console.log('Generated SVG:', svgPublic, 'Size:', fs.statSync(svgPublic).size, 'bytes');
}

generate().catch(console.error);
