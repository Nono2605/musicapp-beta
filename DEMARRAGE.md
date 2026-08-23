# Demarrage de SoundWave

## 1. Conditions necessaires

- Node.js installe
- PostgreSQL demarre
- ngrok installe et configure
- Le fichier `.env` present a la racine du projet

Exemple de fichier `.env` :

```env
DATABASE_URL=postgresql://utilisateur:mot_de_passe@localhost:5432/nom_de_la_base
PORT=3000
```

Ne partage jamais ce fichier.

## 2. Demarrer le serveur

Ouvre un premier terminal PowerShell et execute :

```powershell
cd "A:\Projets\Musique IA"
npm install
node server.js
```

Le terminal doit afficher :

```text
Server running on http://localhost:3000
Database initialized successfully
```

Laisse ce terminal ouvert.

## 3. Tester en local

Ouvre cette adresse dans ton navigateur :

```text
http://localhost:3000
```

Si la page d'accueil s'affiche, le serveur fonctionne.

## 4. Demarrer ngrok

Ouvre un deuxieme terminal PowerShell et execute :

```powershell
cd "A:\Projets\Musique IA"
ngrok http 3000
```

Ngrok affiche une ligne similaire a :

```text
Forwarding https://exemple.ngrok-free.app -> http://localhost:3000
```

Copie l'adresse qui commence par `https://`.

## 5. Partager le site

Envoie l'adresse HTTPS ngrok a ton ami :

```text
https://exemple.ngrok-free.app
```

Il pourra ouvrir le site depuis un autre reseau ou un autre telephone.

Les deux terminaux doivent rester ouverts pendant toute la duree du partage :

- le terminal avec `node server.js`
- le terminal avec `ngrok http 3000`

## 6. Verification de l'API

Les fichiers JavaScript doivent utiliser une URL relative :

```js
const API_URL = '/api';
```

Cela permet au site de fonctionner aussi bien sur `localhost` qu'avec l'adresse ngrok.

Tu peux tester l'API localement avec :

```powershell
Invoke-WebRequest http://localhost:3000/api/tracks
```

## 7. Problemes courants

### `Cannot GET /`

Le serveur n'est pas demarre avec la version actuelle de `server.js`. Relance :

```powershell
node server.js
```

### `ERR_NGROK_8012`

Le serveur Node.js n'est pas actif sur le port 3000. Demarre d'abord :

```powershell
node server.js
```

### `Erreur de connexion au serveur`

Verifie que les appels utilisent :

```js
const API_URL = '/api';
```

Puis recharge la page avec `Ctrl + F5`.

### ngrok demande un authtoken

Configure-le une seule fois :

```powershell
ngrok config add-authtoken TON_NOUVEAU_TOKEN
```

Ne publie jamais ton authtoken.

### L'adresse ngrok ne fonctionne plus

Relance :

```powershell
ngrok http 3000
```

Puis partage la nouvelle adresse HTTPS.

## 8. Arreter le site

Dans chaque terminal actif, appuie sur :

```text
Ctrl + C
```

Cela arrete le serveur et le tunnel ngrok.
