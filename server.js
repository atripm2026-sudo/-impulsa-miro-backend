const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
const CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;
const REDIRECT_URI = process.env.TIKTOK_REDIRECT_URI;

let userSession = {
  accessToken: null,
  lastUpdated: null,
};

// Ruta de verificación para Render y navegador
app.get('/', (req, res) => {
  res.send('Impulsa MiRo backend activo');
});

// 1. Conexión con TikTok
app.get('/auth/tiktok', (req, res) => {
  const csrfState = Math.random().toString(36).substring(2);
  const scopes = 'user.info.basic,user.info.stats,video.list';

  const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${CLIENT_KEY}&scope=${scopes}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${csrfState}`;

  res.redirect(authUrl);
});

// Callback de TikTok para intercambiar el código por access_token
app.get('/auth/tiktok/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send('Error: No se recibió autorización de TikTok.');
  }

  try {
    const response = await axios.post(
      'https://open.tiktokapis.com/v2/oauth/token/',
      new URLSearchParams({
        client_key: CLIENT_KEY,
        client_secret: CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    userSession.accessToken = response.data.access_token;
    userSession.lastUpdated = new Date().toISOString();

    res.send('<h1>¡Cuenta Impulsa Mi.Ro conectada con éxito! Ya puedes volver a tu App.</h1>');
  } catch (error) {
    res.status(500).json({
      error: 'Error conectando con TikTok',
      detalle: error.response?.data || error.message,
    });
  }
});

// 2. Métricas + estudio de horario Live (Chile)
app.get('/api/dashboard', async (req, res) => {
  try {
    let stats = { seguidores: 0, meGustaTotales: 0, videosCount: 0 };
    let videos = [];

    if (userSession.accessToken) {
      const userRes = await axios.get(
        'https://open.tiktokapis.com/v2/user/info/?fields=follower_count,likes_count,video_count',
        {
          headers: { Authorization: `Bearer ${userSession.accessToken}` },
        }
      );

      const u = userRes.data?.data?.user || {};
      stats = {
        seguidores: u.follower_count || 0,
        meGustaTotales: u.likes_count || 0,
        videosCount: u.video_count || 0,
      };

      const videoRes = await axios.post(
        'https://open.tiktokapis.com/v2/video/list/?fields=id,title,create_time,view_count,like_count,comment_count',
        { max_count: 10 },
        {
          headers: {
            Authorization: `Bearer ${userSession.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      videos = videoRes.data?.data?.videos || [];
    }

    const analisisChile = calcularMejorHorarioLive(videos);

    res.json({
      conectado: Boolean(userSession.accessToken),
      metricas: stats,
      ultimosVideos: videos,
      estudioMercadoChile: analisisChile,
      tareasHoy: generarTareasDiarias(),
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error leyendo métricas',
      detalle: error.response?.data || error.message,
    });
  }
});

// 3. Cálculo de mejor horario para Live en Chile
function calcularMejorHorarioLive(videos) {
  let mejorHora = '21:00 a 22:30 hrs (Hora Chile)';
  let motivo = 'Horario prime en hogares chilenos tras la jornada laboral y cena.';

  if (Array.isArray(videos) && videos.length >= 3) {
    const mejorVideo = videos.reduce((prev, current) =>
      (current.view_count || 0) + (current.comment_count || 0) * 5 >
      (prev.view_count || 0) + (prev.comment_count || 0) * 5
        ? current
        : prev
    );

    if (mejorVideo.create_time) {
      const fechaChile = new Date(mejorVideo.create_time * 1000).toLocaleTimeString('es-CL', {
        timeZone: 'America/Santiago',
        hour: '2-digit',
        minute: '2-digit',
      });
      mejorHora = `Alrededor de las ${fechaChile} hrs (Hora Chile)`;
      motivo = `Basado en tu video con mayor interacción (${mejorVideo.view_count || 0} vistas).`;
    }
  }

  return {
    horarioRecomendadoLive: mejorHora,
    justificacion: motivo,
    hashtagsTendenciaChile: ['#DatosChile', '#HogarLimpio', '#EmprendedoresChilenos', '#BienestarChile'],
  };
}

// 4. Tareas diarias según día de la semana en Chile
function generarTareasDiarias() {
  const dia = new Date().toLocaleDateString('es-CL', {
    timeZone: 'America/Santiago',
    weekday: 'long',
  });

  return [
    {
      hora: '10:00',
      tarea: `(${dia.toUpperCase()}) Buscar 3 audios en tendencia en Chile con menos de 50k usos`,
    },
    {
      hora: '13:30',
      tarea: 'Publicar video corto de producto hogar o bienestar',
    },
    {
      hora: '13:45',
      tarea: 'Comentar con valor en 10 cuentas chilenas de ahorro/hogar',
    },
    {
      hora: '21:00',
      tarea: 'Responder comentarios y enviar link de WhatsApp',
    },
  ];
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor Impulsa Mi.Ro activo en puerto ${PORT}`));
