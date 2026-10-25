# Script de vérification des données

## Objectif

Ce simple script écrit en JavaScript a pour objectif de vérifier que les données du fichier [`transcodification.csv`](../transcodification.csv) sont aussi correctes et exhaustives que possibles.

## Exécuter la vérification

### Prérequis

Pour lancer le script, il faut :

- Disposer d'un environnement NodeJS ou équivalent pour exécuter des scripts JS, et télécharger les dépendances avec la commande `npm i` (la seule dépendance étant *proj4*, une bibliothèque de conversion de coordonnées géographiques, pour passer du Lambert 93 utilisé par les données d'IDFM au WGS 84 utilisé par le reste du monde)
- Télécharger manuellement [ce fichier](https://www.ter.sncf.com/_next/data/DtFt70D_mtuFYZsfhU2D0/normandie/se-deplacer/gares/liste-des-gares.json) dans ce dossier (ouvrir dans le navigateur et enregistrer le fichier, le nom de fichier étant exclu dans le [`.gitignore`](./.gitignore)). En effet, le site TER SNCF a des mécanismes solides pour empêcher les bots et les scripts de télécharger directement des fichiers, il est donc plus simple de le faire manuellement.

### Commandes

Une fois les prérequis remplis, il suffit de lancer :

```bash
$ node check.js
```

Le script va télécharger les différentes données dont il a besoin, puis faire les vérifications en affichant ce qui ne va pas.

## Fonctionnement du script

Ce script s'articule en 3 étapes.

### 1. Vérification de la concordance UIC-IDFM

Cette étape a pour objectif de vérifier que chaque association code UIC/identifiant IDFM soit correcte. Pour cela, on récupère les coordonnées de l'arrêt IDFM d'un côté, les coordonnées de l'arrêt SNCF de l'autre côté (lorsque disponibles), et on vérifie que les coordonnées soient "proches".

L'écart actuellement choisi est large : un centième pour chaque direction (x et y) en coordonnées WGS 84, ce qui correspond à environ 1.1 km. C'est suffisant pour détecter les erreurs flagrantes sans faire sonner trop d'alarmes en cas de coordonnées peu précises (ce qui arrive parfois au fin fond de la Seine-et-Marne notamment) ou mal placées dans les jeux de données sources.

### 2. Vérification de l'exhaustivité IDFM

Pour cette étape, on utilise différents jeux de données d'IDFM de la façon suivante :

1. Une liste de lignes ciblées est prédéfinie dans le code (RER, Transilien, Tram-trains, TER, et leurs bus de substitution associés).
2. Pour chaque ligne, on récupère la liste des arrêts de la ligne.
3. Pour chaque arrêt ainsi récupéré, on vérifie que son identifiant ZDC soit présent au moins une fois dans le fichier [`transcodification.csv`](../transcodification.csv).

### 3. Vérification de l'exhaustivité SNCF

De la même façon, on récupère des codes UIC et on vérifie leur présence dans le fichier. Ces codes UIC sont récupérés depuis :

- La liste des gares du RFN dressée par SNCF Réseau (on prend les gares situées dans les 8 départements d'Ile-de-France)
- La liste des gares d'Ile-de-France utilisée par les sites TER SNCF (bien plus complète, notamment concernant les arrêts routiers, que ne couvre pas le point précédent)

## Limites actuelles du script

**Ce script est loin d'être parfait dans son état actuel**, mais a le mérite d'effectuer les vérifications de base.

Son principal défaut découle du manque d'exhaustivité des différentes sources de données SNCF pour obtenir tous les arrêts (y compris routiers) avec leur code UIC. Il faut piocher les données à différents endroits sans tout avoir, si bien que le script marque encore de nombreuses entrées du fichier [`transcodification.csv`](../transcodification.csv) comme possédant un code UIC inconnu (**ce qui rend le script assez verbeux**), alors que ce code UIC existe sans être présent dans les jeux de données utilisés en entrée. Peut-être un projet (ambitieux) pour moi à l'avenir de tenter d'en faire un jeu de données national unique et le plus exhaustif possible ?