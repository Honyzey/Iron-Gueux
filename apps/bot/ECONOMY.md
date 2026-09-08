# 🪙 Modèle Économique & Équilibrage — Iron Gueux

Ce document détaille les constantes, les mécaniques de rétention et l'équilibrage monétaire du bot.

---

## 🎯 Philosophie du Système
* **Ressource d'accès :** Les crédits servent principalement de « jetons d'arcade » pour exécuter des commandes fun à privilèges (ex: `/roulette` vocal).
* **Frustration calculée :** L'épargne passive via `/work` couvre tout juste les besoins quotidiens d'un joueur régulier. Le casino (`/slot`, `/roulette-casino`) agit comme un accélérateur à forte volatilité pour sauter les temps d'attente.
* **Lazy Initialization :** Les profils membres sont créés en base de données PostgreSQL uniquement lors de leur première interaction économique.

---

## 📊 Grille d'Acquisition & Tarification

| Action / Commande | Type | Valeur / Coût | Cooldown | Objectif / Rôle |
| :--- | :--- | :--- | :--- | :--- |
| **Capital de départ** | Octroi unique | `15 crédits` | — | Petit solde de bienvenue à la création du profil. |
| **`/daily`** | Revenu passif | `20 crédits` | `24 heures` | Bonus quotidien fixe (hameçon de rétention). |
| **`/work`** | Revenu actif | `12 à 20 crédits`<br>*(Moyenne : 16)* | `2 heures` | Récompense l'assidueté sur une journée active. |
| **Commande Majeure**<br>*(ex: `/roulette` vocal)* | Sink (Destruction) | `100 crédits` | Variable | Le verrou d'accès principal. |

---

## ⏳ Simulation d'une Journée Type (9h00 - 19h00)

L'objectif est de permettre à un joueur **moyen** réalisant **5 sessions de travail** dans sa journée de débloquer **1 commande majeure (100 crédits)** pour sa soirée en vocal.

```text
[09h00]  /daily (+20) + /work #1 (Moyenne +16)  ──>   36 crédits
[11h00]  /work #2 (Moyenne +16)                 ──>   52 crédits
[13h00]  /work #3 (Moyenne +16)                 ──>   68 crédits
[15h30]  /work #4 (Moyenne +16)                 ──>   84 crédits
[18h00]  /work #5 (Moyenne +16)                 ──>  100 crédits  ✅ (Objectif atteint)