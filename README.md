# Transcodification des identifiants des gares en Île-de-France

## Présentation

Le fichier [`matching.csv`](./matching.csv) a pour objectif de faire correspondre les identifiants IDFM d'arrêts de transport en commun aux codes UIC normalisés, utilisés notamment par la SNCF, afin de pouvoir relier les données d'arrêts utilisant ces deux systèmes d'identifiants.

Le fichier se présente sous la forme d'un fichier CSV (le séparateur est le point-virgule), contenant :

- **Le numéro UIC8 de l'arrêt.** Pour le vrai numéro UIC à 7 chiffres, il suffit de tronquer le dernier chiffre (la SNCF ajoute systématiquement le 8ème chiffre dans ses jeux de données à des fins de vérification d'erreur)
- **L'identifiant IDFM de l'arrêt.** Il s'agit de l'identifiant "Zone de correspondance" (Zdc), aussi nommé "StopArea" dans certains jeux de données, bien qu'il soit à distinguer de la zone d'arrêt (Zda).
- **Un nom.** Celui-ci est présent à titre **STRICTEMENT INDICATIF**, notamment afin de faciliter le maintien du fichier.

Des détails sur la signification des différents identifiants sont disponibles [plus bas](#signification-des-identifiants).

## Sources

Le fichier de transcodification, fourni en pièce jointe du [GTFS Transilien de la SNCF](https://ressources.data.sncf.com/explore/dataset/sncf-transilien-gtfs/information/), a servi de base pour la création de ce fichier.

Celui-ci a ensuite été **largement enrichi manuellement**, afin d'être le plus complet possible. Voici les différentes sources qui ont permis cet enrichissement :

- [Le référentiel des arrêts de l'Open Data d'IDFM : arrêts, zones d'arrêts, zones de correspondance](https://data.iledefrance-mobilites.fr/explore/dataset/arrets/information/)
- [Le jeu de données "Arrêts et lignes associées" de l'Open Data d'IDFM](https://data.iledefrance-mobilites.fr/explore/dataset/arrets-lignes/information/?disjunctive.route_long_name&disjunctive.id)
- [Le jeu de données "Liste des gares" publié par SNCF Réseau](https://ressources.data.sncf.com/explore/dataset/liste-des-gares/information)
- [Le fichier "stations.csv" des gares européennes, produit par Trainline et disponible sur GitHub](https://github.com/trainline-eu/stations/tree/master)
- [Les listes de gares utilisées par les sites TER SNCF](https://ter.sncf.com/)

## ⚠️ Mises en garde

### Ce jeu de données n'est pas garanti exact et complet

Le fichier [`matching.csv`](./matching.csv) n'étant pas officiel, et contenant de nombreuses données reliées manuellement, n'est pas garanti exact et complet.

Bien qu'au moins les principales gares et arrêts ne devraient pas présenter de souci, il est fort probable que des arrêts routiers (pour des substitutions routières), qui constituent la face immergée de l'iceberg qu'est ce jeu de données, soient manquants. Il n'est pas non plus impossible que des erreurs ou imprécisions soient présentes, notamment concernant les arrêts supprimés ou dépréciés (gares fermées ou ayant quitté le RFN, arrêts "Noctilien", etc.).

Cependant, **pour vérifier et garantir la qualité et l'exhaustivité des données, un script de vérification est disponible dans le dossier `check`**. Sa documentation détaillée se trouve dans [le fichier README.md du dossier](check/README.md).

**Si vous constatez une erreur ou un manque dans les données, n'hésitez pas à me le faire savoir** afin que ce soit corrigé, en [**ouvrant une issue**](https://github.com/Bouboufez/transcodification-id-gares-idf/issues/new) ou en me contactant.

### La relation entre identifiants UIC et IDFM n'est pas une relation 1 <-> 1 !

De par leur nature très différente (voir [plus bas](#signification-des-identifiants)), la relation créée par le fichier [`matching.csv`](./matching.csv) entre les codes UIC et les identifiants IDFM n'est pas une relation 1 <-> 1. Même si, dans la plupart des cas, un code UIC sera associé à un seul identifiant IDFM et inversement, un code UIC peut être relié à plusieurs identifiants IDFM, et un identifiant IDFM peut être associé à plusieurs codes UIC.

Quelques exemples simples (il y a bien pire !) :

- **Le Stade (Colombes)** : cette gare a pour code UIC `87381095` mais a 2 identifiants IDFM : `72287` pour la gare ferroviaire (ligne J) et les bus à proximité immédiate de celle-ci (sur le parvis de la gare, sur le boulevard passant sous la gare, etc.), et `72301` pour l'arrêt de bus situé sur le boulevard d'Achères, situé à 400m de la gare et associé à celle-ci (car utilisé notamment par les bus de substitution de la ligne J).
- **Charles de Gaulle - Etoile (Paris)** : cette station a pour identifiant IDFM `71347`, mais possède 2 codes UIC : `87758003` pour la gare ferroviaire souterraine du RER A, et `87987453` pour la desserte Noctilien en surface (sur l'avenue de Friedland, à proximité immédiate de la place de l'Etoile).

### L'IA n'a PAS été utilisée pour ce projet

Afin d'éviter toute erreur ou approximation liée à des hallucinations, surtout dans une situation où la donnée source est faible, aucun outil d'IA n'a été utilisé pour créer ou maintenir le jeu de données. Son utilisation n'est cependant pas exclue à des fins de vérification ou de relecture, sans modification de fichier.

## Signification des identifiants

### Numéros UIC

Les codes UIC sont des identifiants uniques mondialement, associés aux gares ferroviaires, et par extension aux arrêts de transport en commun non ferroviaires lorsqu'ils servent à la substitution d'un transport ferroviaire, lorsqu'ils servent à des transports opérés par un opérateur ferroviaire (cas des lignes Noctilien à 3 chiffres, opérées par la SNCF avant l'ouverture à la concurrence), à des arrêts qui sont d'anciennes haltes ferroviaires déclassées (par exemple dans le cas d'une tramification), etc.

Ces codes sont constitués d'un préfixe à [2 chiffres identifiant le pays](https://fr.wikipedia.org/wiki/Liste_des_codes_pays_UIC) (87 pour la France), et de 5 chiffres identifiant l'arrêt dans le pays.

En France, la SNCF ajoute systématiquement un 8ème chiffre (on nomme alors souvent ce code "UIC8") à des fins de vérification d'erreur. Pour les codes français, cet identifiant est calculé en appliquant [l'algorithme de Luhn](https://fr.wikipedia.org/wiki/Formule_de_Luhn) sur le code UIC, **préfixe pays exclu**.

### Identifiants IDFM

Ile-de-France Mobilités (IDFM) utilise plusieurs niveaux de codes pour identifier chaque arrêt. Les 3 principaux niveaux sont :

- L'arrêt : désigne un point d'arrêt unique (par exemple, un quai d'une station de métro). Celui-ci est identifié à la fois avec un code transporteur (propre à l'opérateur) et un code communautaire, utilisable globalement
- La zone d'arrêts : une zone regroupant de façon cohérente (géographiquement et commercialement) des arrêts **d'un même mode** (par exemple, tous les quais d'une station de métro)
- La zone de correspondance : une zone regroupant, toujours de façon cohérente, les arrêts **de différents** modes (par exemple, une station de métro avec ses quais et les arrêts de bus associés en surface)

Dans les jeux et systèmes de données ne supportant que 2 niveaux de granularité (par exemple le GTFS), seuls les arrêts et les zones de correspondance sont utilisés. Lorsqu'il est nécessaire d'utiliser les zones d'arrêts, celles-ci sont identifiées avec le préfixe `IDFM:monomodalStopPlace:` au lieu du préfixe habituel `IDFM:`.

Le détail du fonctionnement des identifiants IDFM est présenté dans [cette présentation sur les référentiels de transport d'IDFM](https://eu.ftp.opendatasoft.com/stif/Documentation/2023_idfm_referentiels.pdf).