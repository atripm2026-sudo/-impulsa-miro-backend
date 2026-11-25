// ============================================================================
// SERVIDOR BACKEND OFICIAL - IMPULSA MI.RO (TIKTOK + ESTUDIO MERCADO CHILE)
// ============================================================================
const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// TUS CREDENCIALES (Se configuran en la nube de Render/Railway, no aquí)
const CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
const CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;
const REDIRECT_URI = process.env.TIKTOK_REDIRECT_URI;

// Memoria temporal de sesión (En producción se conecta a Supabase)
let userSession = {
  accessToken: null,
  lastUpdated: null,
};

// ----------------------------------------------------------------------------
// 1. RUTA DE CONEXIÓN: Vincula tu cuenta @impulsamiro con un clic
// ----------------------------------------------------------------------------
app.get('/auth/tiktok', (req, res) => {
  const csrfState = Math.random().toString(36).substring(2);
  const scopes = 'user.info.basic,user.info.stats,video.list';
  
  const authUrl = `https://tiktok.com{CLIENT_KEY}&scope=${scopes}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${csrfState}`;
  
  res.redirect(authUrl);
});

// TikTok devuelve el código aquí y lo convertimos en llave de acceso real
app.get('/auth/tiktok/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('Error: No se recibió autorización de TikTok.');

  try {
    const response = await axios.post(
      'https://tiktokapis.com',
      new URLSearchParams({
        client_key: CLIENT_KEY,
        client_secret: CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    userSession.accessToken = response.data.access_token;
    userSession.lastUpdated = new Date().toISOString();

    res.send('<h1>¡Cuenta Impulsa Mi.Ro conectada con éxito! Ya puedes volver a tu App.</h1>');
  } catch (error) {
    res.status(500).json({ error: 'Error conectando con TikTok', detalle: error.response?.data });
  }
});

// ----------------------------------------------------------------------------
// 2. MÉTRICAS EN TIEMPO REAL + ESTUDIO DE HORARIO LIVE (CHILE)
// ----------------------------------------------------------------------------
app.get('/api/dashboard', async (req, res) => {
  try {
    let stats = { seguidores: 0, meGustaTotales: 0, videosCount: 0 };
    let videos = [];

    // Si la cuenta ya está vinculada, trae datos 100% reales de TikTok
    if (userSession.accessToken) {
      const userRes = await axios.get(
        'https://tiktokapis.com',
        { headers: { Authorization: `Bearer ${userSession.accessToken}` } }
      );
      const u = userRes.data.data.user;
      stats = {
        seguidores: u.follower_count,
        meGustaTotales: u.likes_count,
        videosCount: u.video_count,
      };

      const videoRes = await axios.post(
        'https://tiktokapis.com',
        { max_count: 10 },
        { headers: { Authorization: `Bearer ${userSession.accessToken}` } }
      );
      videos = videoRes.data.data.videos || [];
    }

    // Motor de Estudio de Mercado y Cálculo de Horario Live (Zona Horaria Chile)
    const analisisChile = calcularMejorHorarioLive(videos);

    res.json({
      conectado: Boolean(userSession.accessToken),
      metricas: stats,
      ultimosVideos: videos,
      estudioMercadoChile: analisisChile,
      tareasHoy: generarTareasDiarias(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Error leyendo métricas', detalle: error.message });
  }
});

// ----------------------------------------------------------------------------
// 3. ALGORITMO DE ESTUDIO DE MERCADO PARA CHILE
// ----------------------------------------------------------------------------
function calcularMejorHorarioLive(videos) {
  // Analiza a qué hora tus videos tuvieron más comentarios y vistas
  // Si aún no hay historial suficiente, aplica benchmark de consumo Hogar/Bienestar en Chile
  let mejorHora = '21:00 a 22:30 hrs (Hora Chile)';
  let motivo = 'Horario prime en hogares chilenos tras la jornada laboral y cena.';

  if (videos.length >= 3) {
    const mejorVideo = videos.reduce((prev, current) =>
      (current.view_count + current.comment_count * 5) > (prev.view_count + prev.comment_count * 5)
        ? current
        : prev
    );
    const fechaChile = new Date(mejorVideo.create_time * 1000).toLocaleTimeString('es-CL', {
      timeZone: 'America/Santiago',
      hour: '2-digit',
      minute: '2-digit',
    });
    mejorHora = `Alrededor de las ${fechaChile} hrs (Hora Chile)`;
    motivo = `Basado en tu video con mayor interacción (${mejorVideo.view_count} vistas).`;
  }

  return {
    horarioRecomendadoLive: mejorHora,
    justificacion: motivo,
    hashtagsTendenciaChile: ['#DatosChile', '#HogarLimpio', '#EmprendedoresChilenos', '#BienestarChile'],
  };
}

// ----------------------------------------------------------------------------
// 4. GENERADOR DE TAREAS Y MENSAJES DIARIOS SEGÚN DÍA DE LA SEMANA
// ----------------------------------------------------------------------------
function generarTareasDiarias() {
  const dia = new Date().toLocaleDateString('es-CL', {
    timeZone: 'America/Santiago',
    weekday: 'long',
  });

  return [
    {
      hora: '10:00',
      tarea: `(${dia.toUpperCase()}) Revisar 3 audios en tendencia en Chile con menos de 50k usos`,
    },
    {
      hora: '13:30',
      tarea: 'Subir video corto (15 seg) mostrando beneficio real de producto hogar/nutrición',
    },
    {
      hora: '13:45',
      tarea: 'Comentar con valor en 10 videos chilenos de hogar, ahorro o maternidad',
    },
    {
      hora: '21:00',
      tarea: 'Responder comentarios nuevos y enviar enlace directo de asesoría por WhatsApp',
    },
  ];
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor Impulsa Mi.Ro activo en puerto ${PORT}`));
