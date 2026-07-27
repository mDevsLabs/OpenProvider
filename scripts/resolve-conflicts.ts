import { execSync } from 'child_process';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

async function main() {
  console.log("🔍 Recherche des fichiers en conflit...");
  
  let unmergedFiles: string[] = [];
  try {
    const statusOutput = execSync('git diff --name-only --diff-filter=U', { encoding: 'utf-8' });
    unmergedFiles = statusOutput.split('\n').map(f => f.trim()).filter(f => f.length > 0);
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des fichiers en conflit.", error);
    process.exit(1);
  }

  if (unmergedFiles.length === 0) {
    console.log("✅ Aucun conflit détecté !");
    process.exit(0);
  }

  console.log(`⚠️  ${unmergedFiles.length} fichier(s) en conflit trouvé(s).\n`);

  for (const file of unmergedFiles) {
    let resolved = false;
    
    while (!resolved) {
      console.log(`\n================================================`);
      console.log(`📄 Fichier en conflit : ${file}`);
      console.log(`1) Garder Actuel (Ours / HEAD)`);
      console.log(`2) Garder Entrant (Theirs / Upstream)`);
      console.log(`3) Voir le diff des conflits`);
      console.log(`4) Ouvrir dans VS Code pour résolution manuelle`);
      console.log(`5) Passer ce fichier pour le moment`);
      console.log(`================================================`);
      
      const answer = await askQuestion('👉 Votre choix (1-5) : ');
      
      switch (answer.trim()) {
        case '1':
          console.log(`✅ Garder actuel (Ours) pour ${file}...`);
          execSync(`git checkout --ours "${file}"`);
          execSync(`git add "${file}"`);
          resolved = true;
          break;
        case '2':
          console.log(`✅ Garder entrant (Theirs) pour ${file}...`);
          execSync(`git checkout --theirs "${file}"`);
          execSync(`git add "${file}"`);
          resolved = true;
          break;
        case '3':
          console.log(`\n--- DIFF ---`);
          try {
            const diff = execSync(`git diff "${file}"`, { encoding: 'utf-8' });
            console.log(diff);
          } catch (e) {
            console.log("Impossible d'afficher le diff complet.");
          }
          console.log(`------------\n`);
          break;
        case '4':
          console.log(`✏️ Ouverture de ${file} dans VS Code... (sauvegardez et fermez quand c'est prêt)`);
          try {
            execSync(`code --wait "${file}"`);
            execSync(`git add "${file}"`);
            console.log(`✅ Fichier marqué comme résolu !`);
            resolved = true;
          } catch (e) {
            console.log("❌ Erreur lors de l'ouverture de VS Code. Est-ce que 'code' est dans le PATH ?");
          }
          break;
        case '5':
          console.log(`⏭️ Fichier ignoré pour l'instant.`);
          resolved = true;
          break;
        default:
          console.log("❌ Choix invalide, veuillez entrer un chiffre entre 1 et 5.");
      }
    }
  }
  
  console.log("\n🎉 Tous les conflits traités !");
  rl.close();
}

main().catch(console.error);
