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

let userSession = { accessToken: null };

// 1. PANTALLA PRINCIPAL DE LA APP (SE ABRE DIRECTO EN TU IPHONE)
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <title>Impulsa Mi.Ro Studio</title>
  <style>
    :root { --navy: #0F2942; --gold: #C8963E; --green: #4F772D; --cream: #F8F9FA; }
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { margin: 0; background: var(--cream); color: var(--navy); padding-bottom: 40px; }
    header { background: var(--navy); color: white; padding: 20px; border-bottom: 4px solid var(--gold); text-align: center; }
    header h1 { margin: 0; font-size: 22px; letter-spacing: 1px; }
    header h1 span { color: var(--gold); }
    header p { margin: 5px 0 0; font-size: 13px; color: #D0D8E0; }
    .tabs { display: flex; background: white; box-shadow: 0 2px 6px rgba(0,0,0,0.06); position: sticky; top: 0; z-index: 10; }
    .tab { flex: 1; padding: 14px 5px; text-align: center; font-size: 13px; font-weight: 600; color: #5A6A7E; border: none; background: none; cursor: pointer; }
    .tab.active { color: var(--navy); border-bottom: 3px solid var(--gold); font-weight: bold; }
    .container { padding: 16px; max-width: 500px; margin: auto; }
    .section { display: none; }
    .section.active { display: block; }
    .card { background: white; padding: 16px; border-radius: 14px; margin-bottom: 12px; border-left: 5px solid var(--gold); box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
    .badge { background: var(--navy); color: white; font-size: 11px; font-weight: bold; padding: 4px 8px; border-radius: 6px; display: inline-block; margin-bottom: 6px; }
    .btn-tiktok { display: block; width: 100%; background: var(--navy); color: white; text-align: center; padding: 14px; border-radius: 12px; text-decoration: none; font-weight: bold; border: 2px solid var(--gold); margin-bottom: 16px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .metric { background: white; padding: 18px; border-radius: 14px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
    .metric h2 { margin: 0; font-size: 24px; color: var(--navy); }
    .metric p { margin: 4px 0 0; font-size: 12px; color: #5A6A7E; }
    .post-box { background: var(--navy); color: white; padding: 28px 20px; border-radius: 16px; border: 3px solid var(--gold); text-align: center; }
    .post-tag { background: var(--green); font-size: 11px; font-weight: bold; padding: 5px 12px; border-radius: 20px; display: inline-block; margin-bottom: 14px; }
    .tip { background: #EEF4EA; border: 1px solid var(--green); padding: 14px; border-radius: 12px; font-size: 14px; line-height: 1.4; }
  </style>
</head>
<body>
  <header>
    <h1>IMPULSA <span>MI.RO</span></h1>
    <p>Paola & Mauricio • Centro de Control Chile</p>
  </header>

  <div class="tabs">
    <button class="tab active" onclick="showTab('tareas', this)">Tareas</button>
    <button class="tab" onclick="showTab('tiktok', this)">TikTok</button>
    <button class="tab" onclick="showTab('live', this)">Horarios</button>
    <button class="tab" onclick="showTab('post', this)">Post</button>
  </div>

  <div class="container">
    <!-- TAREAS DIARIAS -->
    <div id="tareas" class="section active">
      <div id="lista-tareas"></div>
      <div class="tip">
        <strong style="color:var(--green)">💡 Guion sugerido hoy:</strong><br/>
        "¿Sabías cuánto gastas al mes en productos diluidos? Te mostramos cómo ahorrar en casa con fórmulas concentradas. Escríbenos en el link de nuestro perfil 👇"
      </div>
    </div>

    <!-- MÉTRICAS TIKTOK -->
    <div id="tiktok" class="section">
      <a href="/auth/tiktok" class="btn-tiktok">🔗 Conectar / Actualizar mi TikTok</a>
      <div class="grid">
        <div class="metric"><h2 id="m-seg">-</h2><p>Seguidores</p></div>
        <div class="metric"><h2 id="m-likes" style="color:var(--green)">-</h2><p>Me Gusta Totales</p></div>
        <div class="metric"><h2 id="m-vids" style="color:var(--gold)">-</h2><p>Videos Subidos</p></div>
        <div class="metric"><h2 id="m-estado">Listo</h2><p>Estado API</p></div>
      </div>
    </div>

    <!-- HORARIOS LIVE CHILE -->
    <div id="live" class="section">
      <div class="card">
        <span class="badge">ESTUDIO DE MERCADO CHILE 🇨🇱</span>
        <h3 style="margin:6px 0; color:var(--green)" id="hora-live">21:00 a 22:30 hrs (Hora Chile)</h3>
        <p style="margin:0; font-size:14px; color:#5A6A7E" id="motivo-live">Bloque de mayor conexión en hogares chilenos después del trabajo.</p>
      </div>
      <div class="card">
        <strong>Hashtags recomendados hoy:</strong>
        <p style="color:var(--navy); font-weight:600; margin-bottom:0">#DatosChile #HogarLimpio #EmprendedoresChilenos #BienestarChile</p>
      </div>
    </div>

    <!-- PLANTILLA POST -->
    <div id="post" class="section">
      <div class="post-box">
        <span class="post-tag">BIENESTAR QUE SE COMPARTE</span>
        <h2 style="margin:0; font-size:20px; line-height:1.4">3 Hábitos que transforman tu hogar y tu bolsillo</h2>
        <div style="width:50px; height:3px; background:var(--gold); margin:16px auto"></div>
        <div style="color:var(--gold); font-weight:bold; font-size:13px">IMPULSA MI.RO • Paola & Mauricio</div>
      </div>
    </div>
  </div>

  <script>
    function showTab(id, btn) {
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.getElementById(id).classList.add('active');
      btn.classList.add('active');
    }

    fetch('/api/dashboard').then(r => r.json()).then(data => {
      document.getElementById('m-seg').innerText = data.metricas.seguidores;
      document.getElementById('m-likes').innerText = data.metricas.meGustaTotales;
      document.getElementById('m-vids').innerText = data.metricas.videosCount;
      document.getElementById('m-estado').innerText = data.conectado ? 'Conectado ✅' : 'Pendiente';
      document.getElementById('hora-live').innerText = data.estudioMercadoChile.horarioRecomendadoLive;
      document.getElementById('motivo-live').innerText = data.estudioMercadoChile.justificacion;

      const cont = document.getElementById('lista-tareas');
      cont.innerHTML = data.tareasHoy.map(t => \`
        <div class="card" onclick="this.style.opacity = this.style.opacity === '0.5' ? '1' : '0.5'">
          <span class="badge">\${t.hora} hrs</span>
          <div style="font-weight:500">\${t.tarea}</div>
        </div>
      \`).join('');
    });
  </script>
</body>
</html>
  `);
});

// 2. CONEXIÓN CON TIKTOK
app.get('/auth/tiktok', (req, res) => {
  const csrfState = Math.random().toString(36).substring(2);
  const scopes = 'user.info.basic,user.info.stats,video.list';
  const authUrl = \`https://tiktok.com\${CLIENT_KEY}&scope=\${scopes}&response_type=code&redirect_uri=\${encodeURIComponent(REDIRECT_URI)}&state=\${csrfState}\`;
  res.redirect(authUrl);
});

app.get('/auth/tiktok/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('No se recibió autorización.');
  try {
    const response = await axios.post(
      'https://tiktokapis.com',
      new URLSearchParams({
        client_key: CLIENT_KEY,
        client_secret: CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    userSession.accessToken = response.data.access_token;
    res.redirect('/');
  } catch (error) {
    res.status(500).send('Error conectando TikTok: ' + JSON.stringify(error.response?.data || error.message));
  }
});

// 3. DATOS EN TIEMPO REAL
app.get('/api/dashboard', async (req, res) => {
  let stats = { seguidores: 0, meGustaTotales: 0, videosCount: 0 };
  let videos = [];
  if (userSession.accessToken) {
    try {
      const userRes = await axios.get('https://tiktokapis.com', {
        headers: { Authorization: \`Bearer \${userSession.accessToken}\` }
      });
      const u = userRes.data.data.user;
      stats = { seguidores: u.follower_count || 0, meGustaTotales: u.likes_count || 0, videosCount: u.video_count || 0 };
    } catch (e) {}
  }
  const dia = new Date().toLocaleDateString('es-CL', { timeZone: 'America/Santiago', weekday: 'long' });
  res.json({
    conectado: Boolean(userSession.accessToken),
    metricas: stats,
    estudioMercadoChile: {
      horarioRecomendadoLive: '21:00 a 22:30 hrs (Hora Chile)',
      justificacion: 'Mayor tráfico de hogares y emprendedores en Chile tras la jornada laboral.'
    },
    tareasHoy: [
      { hora: '10:00', tarea: \`(\${dia.toUpperCase()}) Buscar 3 audios en tendencia en Chile (<50k usos)\` },
      { hora: '13:30', tarea: 'Publicar video corto de producto hogar o bienestar' },
      { hora: '13:45', tarea: 'Comentar con valor en 10 cuentas chilenas de ahorro/hogar' },
      { hora: '21:00', tarea: 'Responder comentarios y enviar link de WhatsApp' }
    ]
  });
});
app.get('/', (req, res) => { res.send('Impulsa MiRo backend activo'); });
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('App Impulsa Mi.Ro lista'));

