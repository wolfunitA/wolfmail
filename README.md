# wolfmail

Pré-requis pour l'installation :

**npm install imap mailparser node-fetch nodemailer**

Modifier les ligne 6 et 7 pour mettre email et mot de passe.

Modifier le ligne 18 avec URL de la liste des emails.
La liste des emails est stockées sous la forme d'un tableau JSON, par example :
```
{
  "emails": ["destinataire1@example.com", "destinataire2@example.com"]
}
```

**Pour lancer :**
```node wolfmail.js```
