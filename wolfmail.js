const Imap = require('imap');
const { simpleParser } = require('mailparser');
const fetch = require('node-fetch');
const nodemailer = require('nodemailer');

const EMAIL = 'ton_email@gmail.com';
const PASSWORD = 'ton_mot_de_passe';

const imapConfig = {
  user: EMAIL,
  password: PASSWORD,
  host: 'imap.gmail.com',               // Serveur IMAP
  port: 993,                            // Port IMAP
  tls: true
};

// URL contenant la liste d'emails au format JSON
const emailListUrl = 'https://example.com/emails.json';

// Fonction pour récupérer la liste d'emails depuis l'URL
async function getEmailList() {
  try {
    const response = await fetch(emailListUrl);
    const data = await response.json();
    return data.emails; // Supposons que le JSON a une clé 'emails' avec un tableau
  } catch (error) {
    throw new Error('Erreur lors de la récupération de la liste d\'emails : ' + error.message);
  }
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL,
    pass: PASSWORD
  }
});

async function sendEmail(to, subject, body) {
  await transporter.sendMail({
    from: EMAIL,
    to: to,
    subject: subject,
    text: body
  });
  console.log(`Email envoyé à ${to}`);
}

// Connexion au serveur IMAP
const imap = new Imap(imapConfig);

// Lorsque la connexion est prête
imap.once('ready', async () => {
  try {
    // Récupérer la liste d'emails depuis l'URL
    const emailList = await getEmailList();
    console.log('Liste d\'emails récupérée :', emailList);

    // Ouvrir la boîte de réception
    imap.openBox('INBOX', false, (err, box) => {
      if (err) throw err;

      // Rechercher les emails non lus
      imap.search(['UNSEEN'], (err, results) => {
        if (err) throw err;

        if (results.length === 0) {
          console.log('Aucun email non lu trouvé.');
          imap.end();
          return;
        }

        // Récupérer les emails non lus
        const fetchEmails = imap.fetch(results, { bodies: '' });

        fetchEmails.on('message', (msg, seqno) => {
          msg.on('body', (stream, info) => {
            // Parser le contenu de l'email
            simpleParser(stream, (err, parsed) => {
              if (err) throw err;

              const subject = parsed.subject || 'Sans sujet';
              const body = parsed.text || 'Aucun contenu';

              // Rediriger l'email vers chaque adresse de la liste
              emailList.forEach(email => {
                sendEmail(email, subject, body);
              });

              // Marquer l'email comme lu (optionnel)
              imap.setFlags(seqno, ['\\Seen'], err => {
                if (err) console.error('Erreur lors du marquage comme lu :', err);
              });
            });
          });
        });

        fetchEmails.once('end', () => {
          console.log('Tous les emails non lus ont été traités.');
          imap.end();
        });
      });
    });
  } catch (error) {
    console.error('Erreur dans le traitement :', error);
    imap.end();
  }
});

// Gestion des erreurs IMAP
imap.once('error', err => {
  console.error('Erreur de connexion IMAP :', err);
});

// Fin de la connexion
imap.once('end', () => {
  console.log('Connexion IMAP terminée.');
});

// Lancer la connexion
imap.connect();
