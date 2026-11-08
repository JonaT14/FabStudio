# Modernisation de FabStudio OS — Gestionnaire d'Atelier 3D, Laser 20W & UV

Refonte visuelle et ergonomique complète de **FabStudio OS** pour transformer l'interface actuelle en un poste de pilotage industriel contemporain, inspiré de **Bambu Studio**, **Linear** et **Teenage Engineering**, tout en conservant l'intégralité de vos 10 modules métier, votre catalogue officiel Bambu Lab, le scan iPhone (+1/-1) et la synchronisation Google Drive.

### Revue Utilisateur & Décisions Clés

> [!IMPORTANT]
> Les choix recommandés suivants ont été retenus par défaut pour moderniser l'interface sans perdre aucune fonctionnalité existante :

- **Esthétique & Thème** : Direction **Sombre Industriel Haute Précision** par défaut (`#09090B` / `#121215`) avec bascule instantanée vers un **Mode Clair Atelier** (`#F8FAFC` / `#FFFFFF`), sans bordures épaisses parasites ni badges redondants.
- **Architecture de Navigation Clarifiée** : Barre latérale structurée en **4 pôles métier logiques** regroupant vos 10 vues (Pilotage & Parc, Stock & Bobines, Production & Devis, Qualité & IA) accompagnée d'une **Palette de Commande Rapide (`⌘K` /Recherche globale)** pour accéder ou agir sur n'importe quelle bobine, machine ou commande en une seconde.
- **Zéro Perte Fonctionnelle & Persistance Locale + Cloud** : Conservation à 100 % des données, du scanner caméra iPhone (`html5-qrcode`), de la passerelle Google Drive (`13rKelLC7tY2SDjm-Ry0sPD_-cRoavn_i`) et ajout d'une sauvegarde automatique `localStorage` doublant la synchronisation Cloud.

---

### 1. Vue d'Ensemble & Concept

- **Ce que fait l'application** : Un système d'exploitation centralisé d'atelier de fabrication numérique pilotant 5 machines (**Bambu Lab X1C, P1S, A1**, **xTool M2 20W + Inkjet**, **eufyMake E1/E2 UV**), le stock officiel de bobines Bambu Lab par scan code-barres, le chiffrage de devis multi-procédés (**ForgeCalc**), l'ordonnancement **Kanban**, la génération d'**étiquettes thermiques QR** et la maintenance prédictive.
- **Public Cible** : Fabmanager, créateur et opérateur d'atelier multi-machines (Desktop 1440px au poste de contrôle et iPhone en mobilité devant les racks de filaments).
- **Valeur Ajoutée de la Modernisation** :
  - Suppression de l'aspect « empilement de boîtes dans des boîtes » au profit de surfaces épurées à élévation unique, séparées par de fines lignes de structure (`1px`) et une hiérarchie typographique nette.
  - Remplacement des simples pastilles de couleur par de **véritables rendus vectoriels SVG de bobines Bambu Lab**, des jauges AMS/UV haute lisibilité et un **plan Digital Twin 2D isométrique/technique** beaucoup plus immersif.

---

### 2. Expérience Utilisateur & Design Visuel

- **Parcours Utilisateur Optimisés** :
  - **Barre Supérieure Épurée (Contrat 3 Zones)** : Fil d'Ariane contextuel à gauche, recherche/commande rapide au centre, et action principale contextuelle à droite (Scan iPhone `+1/-1`, Nouvelle Étiquette QR, et synchro Cloud/Drive).
  - **Navigation Latérale Structurée & Dock Mobile** : Sur ordinateur, une barre latérale de `260px` organise les 10 modules sous des en-têtes éditoriaux clairs avec aperçu télémétrique discret des 5 machines. Sur iPhone, une barre d'accès rapide facilite le scan de bobines à une main.
- **Identité Visuelle & Thème** :
  - *Direction Esthétique* : Instrumentation industrielle de précision — surfaces mates profondes, grilles techniques subtiles, contrastes francs et indicateurs lumineux réservés aux vraies données temps réel.
  - *Palette de Couleurs (Règle 60-30-10)* :
    - **60 % Canevas Neutre** : Zinc profond (`#09090B` en mode sombre, `#F8FAFC` en mode clair).
    - **30 % Surfaces Structurelles** : Panneaux `#121215` (ou `#FFFFFF` en clair) avec bordures subtiles `border-zinc-800/80` (`border-slate-200` en clair).
    - **10 % Accents Sémantiques** : Vert Bambu (`#00AE42` / `#10B981`) pour la production active et les actions primaires, Ambre (`#F59E0B`) pour le laser xTool et les pré-alertes, Violet UV (`#A855F7`) pour l'eufyMake E1, et Rose (`#F43F5E`) pour les alertes critiques.
  - *Typographie & Hiérarchie (Règle 2+1)* :
    - **Titres & Navigation** : `Plus Jakarta Sans` (géométrique, technique et moderne).
    - **Corps & Interface** : `DM Sans` pour une lisibilité parfaite à haute densité.
    - **Données, Températures, Devis & Codes Bambu** : `JetBrains Mono` avec alignement tabulaire strict (`tabular-nums`) pour tous les prix, grammes, watts, pourcentages et codes à 5 chiffres.
  - *Discipline Anti-Surcharge* : Métadonnées présentées sous forme de texte épuré séparé par des points médians (`PLA Basic · #10100 · 190-230°C`) au lieu d'une accumulation de capsules colorées.
- **Interactions & Micro-Animations** :
  - Transitions fluides entre les onglets et modales (`motion/react` $\le 180\text{ms}$).
  - Raccourci clavier `⌘K` / `Ctrl+K` ouvrant la palette d'actions rapides (chercher une bobine, ajouter +1 au stock, basculer une prise Shelly/Tapo, créer un devis).

---

### 3. Décisions Produit & Arbitrages

- **Décision 1 : Regroupement visuel des 10 modules sans supprimer aucun onglet**
  - *Approche choisie* : Conserver les 10 modules accessibles en un clic dans la barre latérale mais les diviser en 4 sections claires (*01. Atelier & Temps Réel*, *02. Stocks & Filaments*, *03. Production & Chiffrage*, *04. Qualité & Maintenance*).
  - *Pourquoi* : Évite la fatigue visuelle d'une liste plate de 10 boutons tout en gardant chaque outil à portée immédiate d'un seul clic.
- **Décision 2 : Visualisation matérielle enrichie (Digital Twin, Bobines SVG, ForgeCalc)**
  - *Approche choisie* : Dessiner de vraies bobines vectorielles avec moyeu Bambu Lab et jauge d'ouverture, un plan d'atelier 2D architectural avec flux énergétiques entre les îlots, et une barre de répartition visuelle des coûts dans ForgeCalc.
  - *Pourquoi* : Rend le tableau de bord immédiatement lisible d'un coup d'œil sans avoir à lire chaque chiffre.
- **Décision 3 : Double persistance (LocalStorage + Firebase / Google Drive)**
  - *Approche choisie* : Sauvegarder instantanément chaque modification (bobines, Kanban, logs, inventaire, commandes, prises) dans `localStorage` tout en maintenant la synchronisation Firebase et le Webhook Google Apps Script vers le dossier Drive `13rKelLC7tY2SDjm-Ry0sPD_-cRoavn_i`.
  - *Pourquoi* : Garantit zéro perte de données même hors connexion ou lors d'un rafraîchissement de page sur iPhone.

---

### 4. Architecture Technique & Stratégie de Données

#### Schéma d'Architecture & Hiérarchie des Composants

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        FabStudio OS (Application Shell)                      │
│  ┌───────────────────────┐  ┌─────────────────────────────────────────────┐  │
│  │   Sidebar Navigation  │  │ Top Header (3-Zone Contract)                │  │
│  │  • 4 Pôles Métier     │  │  • Fil d'Ariane & Statut Parc               │  │
│  │  • Mini-Télémétrie 5x │  │  • Palette Rapide (⌘K) & Thème Clair/Sombre │  │
│  │  • Alerte Critique UV │  │  • CTA Scan iPhone (+1/-1) & Synchro Drive  │  │
│  └───────────┬───────────┘  └──────────────────────┬──────────────────────┘  │
│              │                                     │                         │
│              ▼                                     ▼                         │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                     Viewport Principal (10 Modules)                    │  │
│  │  ├─ 01. Digital Twin 2D & Prises Shelly/Tapo (Plan SVG + Inspecteur)   │  │
│  │  ├─ 02. Passerelle Cloud/LAN (Bambu MQTT + AMS 12 slots, xTool, eufy)  │  │
│  │  ├─ 03. Parc & Télémétrie (Cartes X1C/P1S/A1, Laser 20W, 6 Canaux UV)  │  │
│  │  ├─ 04. Bobines Bambu & Scan iPhone (Catalogue 35+ réfs, Bobines SVG)  │  │
│  │  ├─ 05. Calculateur ForgeCalc (Devis 3D/Laser/UV + Barre de Coûts)     │  │
│  │  ├─ 06. Kanban Print & Cut Queue (5 Colonnes Drag & Drop + Avancement) │  │
│  │  ├─ 07. Maintenance Prédictive & Pièces (Jauges Horaires + Stock PEI)  │  │
│  │  ├─ 08. Journal Qualité & Échecs (Recettes Certifiées & Diagnostics)   │  │
│  │  ├─ 09. Consommables & Chimie UV (Filtres, Jauges, Alertes Stock Bas)  │  │
│  │  └─ 10. Commandes & Étiquettes QR + Assistant Paramètres IA            │  │
│  └───────────────────────────────────┬────────────────────────────────────┘  │
│                                      │                                       │
│                                      ▼                                       │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │         Couche de Persistance & Modales Transactionnelles              │  │
│  │  • Scanner Caméra iPhone (html5-qrcode) + Association Code EAN Inconnu │  │
│  │  • Synchronisation Cloud (Firestore + Webhook Google Drive + JSON)     │  │
│  │  • Sauvegarde Locale Automatique (localStorage)                        │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### Modèle de Données & Correspondance des Interactions
- **Catalogue Bobines Bambu Lab (`bambuCatalog`)** : Filtres combinés par vue (`Mon Stock` / `Catalogue Officiel`), par famille de matériau (`PLA Basic`, `PLA Matte`, `PETG HF`, `ABS / ASA`, `TPU / Technique`) et par recherche textuelle/code-barres. Actions `+1` / `-1`, scan caméra iPhone, association d'un nouveau code-barres inconnu à une bobine existante, et création de bobine personnalisée.
- **Télémétrie & Digital Twin (`machines`, `smartPlugs`, `liveTemps`)** : Fluctuation thermique temps réel des buses/plateaux, bascule `ON/OFF` des 5 prises connectées avec recalcul instantané des Watts et kWh cumulés, et synchronisation simulée ou réelle des 12 slots AMS.
- **Moteur Financier ForgeCalc (`calcForm` → `forgeCalcBreakdown`)** : Calcul réactif du coût matière (poids + purge AMS + encre UV en ml + plaque support), électricité, amortissement machine, main-d'œuvre, provision d'échec, prix HT/TTC unitaire et série, avec conversion directe en commande dotée d'une étiquette thermique QR.
- **Flux de Production (`kanbanTasks`, `orders`, `printLogs`, `maintenance`, `inventory`)** : Glisser-déposer et boutons rapides sur les 5 étapes Kanban, impression et simulation de scan d'étiquette thermique `100x60mm` qui met à jour la machine cible en mode `Impression`, validation des maintenances remettant le compteur horaire à zéro, et gestion complète des consommables.
