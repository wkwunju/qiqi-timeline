const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-password',
  'Access-Control-Max-Age': '86400',
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders },
  });

const checkAuth = (request, env) => {
  const pwd = request.headers.get('x-password') || '';
  return !!env.UPLOAD_PASSWORD && pwd === env.UPLOAD_PASSWORD;
};

const readManifest = async (env) => {
  const obj = await env.PHOTOS.get('manifest.json');
  if (!obj) return [];
  return JSON.parse(await obj.text());
};

const writeManifest = async (env, arr) =>
  env.PHOTOS.put('manifest.json', JSON.stringify(arr), {
    httpMetadata: { contentType: 'application/json' },
  });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // ---- GET /manifest ----
    if (path === '/manifest' && request.method === 'GET') {
      const manifest = await readManifest(env);
      return json(manifest);
    }

    // ---- GET /photos/<name> ----
    if (path.startsWith('/photos/') && request.method === 'GET') {
      const key = path.slice(1);
      const obj = await env.PHOTOS.get(key);
      if (!obj) return new Response('not found', { status: 404, headers: corsHeaders });
      return new Response(obj.body, {
        headers: {
          'Content-Type': obj.httpMetadata?.contentType || 'image/jpeg',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'etag': obj.httpEtag,
          ...corsHeaders,
        },
      });
    }

    // ---- POST /verify ----
    if (path === '/verify' && request.method === 'POST') {
      if (!checkAuth(request, env)) return json({ error: 'unauthorized' }, 401);
      return json({ ok: true });
    }

    // ---- POST /upload ----
    if (path === '/upload' && request.method === 'POST') {
      if (!checkAuth(request, env)) return json({ error: 'unauthorized' }, 401);

      const form = await request.formData();
      const photo = form.get('photo');
      const date = form.get('date');
      const age = (form.get('age') || '').toString().slice(0, 60);
      const caption = (form.get('caption') || '').toString().slice(0, 500);

      if (!photo || !date) return json({ error: 'missing fields' }, 400);
      if (photo.size > 10 * 1024 * 1024) return json({ error: 'photo too large' }, 413);

      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const filename = `${id}.jpg`;
      const type = photo.type || 'image/jpeg';

      await env.PHOTOS.put(`photos/${filename}`, photo.stream(), {
        httpMetadata: { contentType: type },
      });

      const manifest = await readManifest(env);
      manifest.push({
        id,
        photo: filename,
        date: date.toString(),
        age,
        caption,
        createdAt: new Date().toISOString(),
      });
      await writeManifest(env, manifest);

      return json({ ok: true, id });
    }

    // ---- POST /edit ----
    if (path === '/edit' && request.method === 'POST') {
      if (!checkAuth(request, env)) return json({ error: 'unauthorized' }, 401);
      const body = await request.json();
      const { id, date, age, caption } = body;
      if (!id) return json({ error: 'missing id' }, 400);

      const manifest = await readManifest(env);
      const idx = manifest.findIndex((e) => e.id === id);
      if (idx === -1) return json({ error: 'not found' }, 404);

      if (date !== undefined) manifest[idx].date = String(date);
      if (age !== undefined) manifest[idx].age = String(age).slice(0, 60);
      if (caption !== undefined) manifest[idx].caption = String(caption).slice(0, 500);

      await writeManifest(env, manifest);
      return json({ ok: true });
    }

    // ---- POST /delete ----
    if (path === '/delete' && request.method === 'POST') {
      if (!checkAuth(request, env)) return json({ error: 'unauthorized' }, 401);

      const { id } = await request.json();
      if (!id) return json({ error: 'missing id' }, 400);

      const manifest = await readManifest(env);
      const entry = manifest.find((e) => e.id === id);
      if (entry) await env.PHOTOS.delete(`photos/${entry.photo}`);
      await writeManifest(env, manifest.filter((e) => e.id !== id));

      return json({ ok: true });
    }

    return new Response('not found', { status: 404, headers: corsHeaders });
  },
};
