// ============================================================
// WEATHER
// ============================================================
async function getWeather(city) {
  const apiKey = process.env.WEATHER_API_KEY || process.env.API_KEY;
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=ro`;
  try {
    const res = await https.get(url);
    let data = '';
    res.on('data', chunk => data += chunk);
    await new Promise(resolve => res.on('end', () => resolve()));
    try {
      const w = JSON.parse(data);
      if (w.cod !== 200) return `❌ Oraș negăsit: ${city}`;
      return `🌤 *${w.name}*: ${w.weather[0].description}, ${w.main.temp}°C, umiditate ${w.main.humidity}%`;
    } catch { return '❌ Eroare parsare meteo'; }
  } catch (e) {
    return `❌ Meteo indisponibil: ${e.message}`;
  }
}

// ============================================================
// GITHUB - Salvare cod generat automat
// ============================================================
async function saveToGithub(filename, content, commitMsg) {
  const [owner, repo] = (process.env.GITHUB_REPO || '/').split('/');
  if (!owner || !repo) return false;
  let sha;
  try {
    const checkRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filename}`, {
      headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` }
    });
    if (checkRes.ok) sha = (await checkRes.json()).sha;
  } catch {}
  const body = {
    message: commitMsg || `Nexus: ${filename}`,
    content: Buffer.from(content).toString('base64'),
  };
  if (sha) body.sha = sha;
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filename}`, {
      method:  'PUT',
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });
    return res.ok;
  } catch (e) {
    console.error('GitHub fail:', e.message);
    return false;
  }
}
