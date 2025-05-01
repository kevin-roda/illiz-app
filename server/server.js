require("dotenv").config();
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");
const http = require("http");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const SAVE_DIR = path.join(__dirname, "saves");
if (!fs.existsSync(SAVE_DIR)) {
  fs.mkdirSync(SAVE_DIR);
}

const rooms = {}; // In-memory rooms
const lastOfferTimestamps = {}; // Anti-spam par socket

const DELAI_ANTI_SPAM = 5000;
const PROLONGATION_MINUTES = 2;
const DELAI_PROLONGATION_MS = PROLONGATION_MINUTES * 60 * 1000;

const WORDPRESS_API_URL = "https://illiz.fr/wp-json/wp/v2/nos-biens/";

// --- Fonctions utilitaires ---

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function isNonEmptyString(str) {
  return typeof str === "string" && str.trim().length > 0;
}
function sanitizePrice(input) {
  const value = Number(input);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function saveRoomToDisk(roomId) {
  const filePath = path.join(SAVE_DIR, `room-${roomId}.json`);
  const { timerFin, ...roomSansTimer } = rooms[roomId]; // On enlève timerFin
  fs.writeFileSync(filePath, JSON.stringify(roomSansTimer, null, 2));
}

function loadRoomFromDisk(roomId) {
  const filePath = path.join(SAVE_DIR, `room-${roomId}.json`);
  if (fs.existsSync(filePath)) {
    const raw = fs.readFileSync(filePath);
    return JSON.parse(raw);
  }
  return null;
}

function deleteRoomDisk(roomId) {
  const filePath = path.join(SAVE_DIR, `room-${roomId}.json`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

function enregistrerParticipant(roomId, socket, email, prenom, nom) {
  const room = rooms[roomId];
  if (!room) return;

  let participantExiste = room.participants.find((p) => p.email === email);

  if (participantExiste) {
    participantExiste.socketId = socket.id; // mise à jour socketId
  } else {
    const participantNumber = room.participants.length + 1;
    room.participants.push({
      socketId: socket.id,
      email,
      prenom,
      nom,
      numero: participantNumber,
    });
  }
  saveRoomToDisk(roomId);
}

async function genererRapportFinal(roomId) {
  const room = rooms[roomId];
  if (!room) return null;

  const encheres = room.encheres || [];
  if (encheres.length === 0) return null;

  const participantsUniques = new Set(room.participants.map((p) => p.email));
  const nombreParticipants = participantsUniques.size;
  const nombreOffres = encheres.length;

  const premiereOffre = encheres[encheres.length - 1].prix;
  const derniereOffre = encheres[0].prix;
  const prixMinimum = room.prix_depart || 0;

  const evolutionDepuisPremier =
    ((derniereOffre - premiereOffre) / premiereOffre) * 100;
  const evolutionDepuisMin =
    ((derniereOffre - prixMinimum) / prixMinimum) * 100;

  const deltas = [];
  for (let i = 1; i < encheres.length; i++) {
    deltas.push(encheres[i - 1].heure - encheres[i].heure);
  }
  const tempsMoyenEntreOffres = deltas.length
    ? Math.round(deltas.reduce((a, b) => a + b, 0) / deltas.length / 1000)
    : 0;

  const timestampFin = room.fin_enchere;
  const offresDerniereMinute = encheres.filter(
    (offre) => timestampFin - offre.heure <= 60000
  ).length;

  return {
    nombre_participants: nombreParticipants,
    nombre_offres: nombreOffres,
    premiere_offre: premiereOffre,
    derniere_offre: derniereOffre,
    evolution_depuis_premiere_offre: Math.round(evolutionDepuisPremier),
    evolution_depuis_prix_minimum: Math.round(evolutionDepuisMin),
    temps_moyen_entre_offres_sec: tempsMoyenEntreOffres,
    nombre_offres_derniere_minute: offresDerniereMinute,
    participants: room.participants,
    courbe_prix: encheres.map((e) => ({
      heure: new Date(e.heure).toLocaleTimeString("fr-FR", {
        timeZone: "Europe/Paris",
      }),
      prix: e.prix,
      participant: e.participant,
    })),
  };
}

function enregistrerRapportDansWordPress(roomId, rapport) {
  const options = {
    hostname: "illiz.fr",
    path: `${WORDPRESS_API_URL}${roomId}`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.JWT_TOKEN}`,
    },
  };

  const req = http.request(options, (res) => {
    let data = "";

    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      if (res.statusCode !== 200) {
        console.error(`Erreur WordPress ${res.statusCode}`);
        return;
      }

      console.error(`✅ Rapport sauvegardé pour ${roomId}`);
      supprimerRoom(roomId);
    });
  });

  req.on("error", (error) => {
    console.error("❌ Erreur WordPress:", error.message);
  });

  req.write(
    JSON.stringify({
      meta: {
        statistiques_vente: JSON.stringify(rapport),
      },
    })
  );
  req.end();
}

function supprimerRoom(roomId) {
  delete rooms[roomId];
  deleteRoomDisk(roomId);
  console.error(`🧹 Room ${roomId} supprimée`);
}

// --- Timer automatique de fin de vente ---
function lancerTimerDeFin(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  // Nettoyer timer existant avant tout
  if (room.timerFin) {
    clearTimeout(room.timerFin);
  }

  const now = Date.now();
  const tempsRestant = room.fin_enchere - now;

  if (tempsRestant <= 0) {
    console.warn(`⏰ Vente déjà finie pour room ${roomId}`);
    return;
  }

  console.error(
    `⏳ Timer lancé pour ${roomId}, fin prévue à ${new Date(
      room.fin_enchere
    ).toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris" })}`
  );

  // Stocker le nouveau timer
  room.timerFin = setTimeout(async () => {
    console.error(`⏰ Vente terminée automatiquement pour room ${roomId}`);

    const rapport = await genererRapportFinal(roomId);
    if (rapport) await enregistrerRapportDansWordPress(roomId, rapport);
  }, tempsRestant);
}

// --- Recharger les rooms au démarrage ---
function chargerInfosDepuisWordPress(roomId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "illiz.fr",
      path: `/wp-json/illiz/v1/enchere/${roomId}`,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = http.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        if (res.statusCode !== 200) {
          return reject(new Error("Fetch échoué"));
        }

        try {
          const meta = JSON.parse(data);
          resolve({
            prix_depart: sanitizePrice(meta?.prix_de_depart) || 0,
            palier: sanitizePrice(meta?.pas_des_offres) || 2000,
            fin_enchere: (Number(meta?.date_de_fin_des_offres) - 7200) * 1000,
          });
        } catch (err) {
          reject(new Error("Erreur lors du parsing JSON"));
        }
      });
    });

    req.on("error", (error) => {
      reject(new Error(`Erreur requête : ${error.message}`));
    });

    req.end();
  });
}

function rechargerToutesLesRooms() {
  const files = fs.readdirSync(SAVE_DIR);
  files.forEach((file) => {
    if (file.startsWith("room-") && file.endsWith(".json")) {
      const roomId = file.replace("room-", "").replace(".json", "");
      const roomData = loadRoomFromDisk(roomId);
      if (roomData) {
        rooms[roomId] = roomData;
        lancerTimerDeFin(roomId);
        console.error(`✅ Room ${roomId} rechargée au démarrage`);
      }
    }
  });
}

// --- SOCKET IO ---

io.on("connection", async (socket) => {
  console.error("Nouvelle connexion :", socket.id);

  const { email, roomId } = socket.handshake.query;
  const prenom = decodeURIComponent(socket.handshake.query.prenom || "");
  const nom = decodeURIComponent(socket.handshake.query.nom || "");

  if (
    !isValidEmail(email) ||
    !roomId ||
    !isNonEmptyString(prenom) ||
    !isNonEmptyString(nom)
  ) {
    console.warn("❌ Données invalides reçues :", {
      email,
      roomId,
      prenom,
      nom,
    });
    socket.emit("error", { message: "Informations invalides." });
    socket.disconnect();
    return;
  }
  socket.join(roomId);

  if (!rooms[roomId]) {
    const loadedRoom = loadRoomFromDisk(roomId);

    if (loadedRoom) {
      rooms[roomId] = loadedRoom;
      console.error(`✅ Room ${roomId} restaurée`);
      enregistrerParticipant(roomId, socket, email, prenom, nom);

      socket.emit("init", {
        encheres: rooms[roomId].encheres,
        prix_depart: rooms[roomId].prix_depart,
        palier: rooms[roomId].palier,
        fin_enchere: rooms[roomId].fin_enchere,
      });
    } else {
      try {
        const infos = await chargerInfosDepuisWordPress(roomId);
        if (!infos) {
          socket.emit("error", { message: "Erreur chargement vente" });
          return socket.disconnect();
        }

        rooms[roomId] = {
          encheres: [],
          prix_depart: infos.prix_depart,
          palier: infos.palier,
          fin_enchere: infos.fin_enchere,
          participants: [],
        };

        lancerTimerDeFin(roomId);
        saveRoomToDisk(roomId);
      } catch (err) {
        console.error("❌ Erreur chargement depuis WordPress :", err.message);
        socket.emit("error", { message: "Erreur chargement vente" });
        return socket.disconnect();
      }
    }
  } else {
    enregistrerParticipant(roomId, socket, email, prenom, nom);
    socket.emit("init", {
      encheres: rooms[roomId].encheres,
      prix_depart: rooms[roomId].prix_depart,
      palier: rooms[roomId].palier,
      fin_enchere: rooms[roomId].fin_enchere,
    });
  }

  socket.on("faire_offre", async () => {
    try {
      const room = rooms[roomId];
      if (!room) {
        socket.emit("error", { message: "Vente introuvable." });
        return;
      }

      const now = Date.now();
      if (now > room.fin_enchere) {
        const rapport = await genererRapportFinal(roomId);
        if (rapport) await enregistrerRapportDansWordPress(roomId, rapport);
        socket.emit("error", { message: "Vente terminée." });
        return;
      }

      if (
        lastOfferTimestamps[socket.id] &&
        now - lastOfferTimestamps[socket.id] < DELAI_ANTI_SPAM
      ) {
        socket.emit("error", {
          message: "Veuillez patienter entre les offres.",
        });
        return;
      }

      lastOfferTimestamps[socket.id] = now;

      const dernierPrix = room.encheres.length
        ? Math.max(...room.encheres.map((e) => e.prix))
        : room.prix_depart;

      const nouveauPrix = dernierPrix + room.palier;

      const participantInfo = room.participants.find(
        (p) => p.socketId === socket.id
      );
      if (!participantInfo) {
        socket.emit("error", { message: "Participant introuvable." });
        return;
      }

      const nouvelleOffre = {
        heure: now,
        participant: participantInfo.numero,
        prenom: participantInfo.prenom,
        nom: participantInfo.nom,
        email: participantInfo.email,
        prix: nouveauPrix,
      };

      room.encheres.unshift(nouvelleOffre);
      saveRoomToDisk(roomId);

      if (room.fin_enchere - now <= DELAI_PROLONGATION_MS) {
        room.fin_enchere = now + DELAI_PROLONGATION_MS; // ➔ Réinitialise à 5 min à partir de maintenant
        lancerTimerDeFin(roomId); // ➔ Redémarre proprement le timer
        io.to(roomId).emit("prolongation", { fin_enchere: room.fin_enchere });
        console.error(
          `🕑 Prolongation à 5 minutes depuis maintenant pour room ${roomId}`
        );
      }
      io.to(roomId).emit("nouvelle_offre", nouvelleOffre);
    } catch (error) {
      console.error("Erreur offre :", error.message);
    }
  });

  socket.on("disconnect", () => {
    console.error(`Déconnexion socket ${socket.id}`);
  });
});

// --- Démarrage serveur ---
rechargerToutesLesRooms();

httpServer.listen(3001, () => {
  console.error("🚀 Serveur Socket.IO prêt sur http://localhost:3001");
});
