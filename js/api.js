const API = "http://localhost:3000";

async function timedFetch(url, opts = {}) {
  const start = performance.now();
  try {
    const res = await fetch(url, opts);
    const ms = Math.round(performance.now() - start);
    // copia do status e tempo para logs/retorno
    const info = { ok: res.ok, status: res.status, timeMs: ms };
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw {
        message: `HTTP ${res.status}`,
        status: res.status,
        body: text,
        info,
      };
    }
    const json = await res.json().catch(() => null);
    return { data: json, info };
  } catch (err) {
    const ms = Math.round(performance.now() - start);
    // normalize error object
    if (err && err.info) throw err;
    throw {
      message: err.message || "Network error",
      status: err.status || 0,
      info: { timeMs: ms },
    };
  }
}

export async function getWaves() {
  const resp = await timedFetch(`${API}/waves`);
  return { data: resp.data, meta: resp.info };
}

export async function getScores() {
  const resp = await timedFetch(`${API}/scores`);
  return { data: resp.data, meta: resp.info };
}

export async function postScore(payload) {
  const resp = await timedFetch(`${API}/scores`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { data: resp.data, meta: resp.info };
}

// Segunda API simples (exemplo: hora de São Paulo)
// Não exige chave e serve como "segunda API integrada" para demonstrar latência/códigos.
export async function getServerTime() {
  // usar API pública sem auth; se quiser trocar, substitua a URL
  const resp = await timedFetch(
    "https://worldtimeapi.org/api/timezone/America/Sao_Paulo"
  );
  return { data: resp.data, meta: resp.info };
}

/**
 * Busca os dados de clima atuais para uma determinada latitude e longitude.
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object>} - Resposta da API com dados e metadados de tempo.
 */
export async function getWeather(lat, lon) {
  const endpoint = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
  return await timedFetch(endpoint);
}

/**
 * Wrapper seguro para a função getWeather. Em caso de falha, retorna um
 * estado de clima padrão (tempo limpo) para não quebrar o jogo.
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<{ok: boolean, data: Object, meta: Object, error?: Error}>}
 */
export async function safeGetWeather(lat, lon) {
  try {
    const { data, info } = await getWeather(lat, lon);
    if (!info.ok || !data || !data.current_weather) {
      throw new Error(
        `Dados de clima inválidos recebidos. Status: ${info.status}`
      );
    }
    // Retornamos um objeto padronizado para sucesso
    return { ok: true, data: data.current_weather, meta: info };
  } catch (err) {
    console.warn("API de Clima falhou. Usando fallback.", err.message);
    // Em caso de erro, retornamos um objeto de fallback com tempo limpo
    return {
      ok: false,
      data: {
        temperature: 18,
        windspeed: 2,
        weathercode: 0, // Código para "Céu Limpo"
        is_fallback: true,
      },
      meta: err.info || { timeMs: 0, status: err.status || 0 },
      error: err,
    };
  }
}
