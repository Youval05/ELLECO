const { execSync } = require('child_process');

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

console.log('Démarrage de l\'application en mode production...');
console.log('Vous pourrez accéder à l\'application depuis votre iPhone en utilisant l\'adresse:');
console.log('http://192.168.8.105:3001');

// Définir les variables d'environnement pour la production
process.env.NODE_ENV = 'production';
process.env.NEXT_PUBLIC_USE_EMULATOR = 'false';

// Démarrer l'application en mode développement mais avec la configuration de production
runCommand('npx next dev -p 3001');
