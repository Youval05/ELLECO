const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Fonction pour exécuter des commandes shell
function runCommand(command) {
  try {
    console.log(`Exécution de: ${command}`);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`Erreur lors de l'exécution de: ${command}`);
    console.error(error.message);
    return false;
  }
}

// Vérifier si .env.production existe, sinon le créer à partir de .env.local
if (!fs.existsSync('.env.production')) {
  console.log('Création du fichier .env.production à partir de .env.local...');
  if (fs.existsSync('.env.local')) {
    const envContent = fs.readFileSync('.env.local', 'utf8')
      // Supprimer la variable d'émulateur pour la production
      .replace(/NEXT_PUBLIC_USE_EMULATOR=.*\n?/g, '');
    fs.writeFileSync('.env.production', envContent);
    console.log('.env.production créé avec succès!');
  } else {
    console.error('.env.local non trouvé. Impossible de créer .env.production');
    process.exit(1);
  }
}

// Vérifier si nous sommes en mode production
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  console.log('Construction de l\'application en mode production...');
  
  // Construire l'application
  if (!runCommand('npx next build')) {
    console.error('Échec de la construction de l\'application');
    process.exit(1);
  }
  
  console.log('Démarrage de l\'application en mode production...');
  
  // Démarrer le serveur Next.js
  if (!runCommand('npx next start -p 3001')) {
    console.error('Échec du démarrage de l\'application');
    process.exit(1);
  }
} else {
  console.log('Démarrage de l\'application en mode développement...');
  
  // Démarrer le serveur Next.js en mode développement
  if (!runCommand('npx next dev -p 3001')) {
    console.error('Échec du démarrage de l\'application');
    process.exit(1);
  }
}
