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

console.log('Démarrage de l\'application avec la base de données Firestore en ligne...');
console.log('Vous pourrez accéder à l\'application depuis votre iPhone en utilisant l\'adresse:');
console.log('http://192.168.8.105:3001');

// Démarrer l'application sans l'émulateur et sur le port 3001
process.env.NEXT_PUBLIC_USE_EMULATOR = 'false';
runCommand('npx next dev -p 3001');
