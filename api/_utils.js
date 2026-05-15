export function applyCors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.rrnagar.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // 🔥 Handle preflight request immediately
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }

  return false;
}

export async function getBody(req) {
  // ✅ If already parsed (Vercel sometimes does this)
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", chunk => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        if (!body) {
          resolve({});
        } else {
          resolve(JSON.parse(body));
        }
      } catch (e) {
        console.error("JSON Parse Error:", e);
        reject(new Error("Invalid JSON"));
      }
    });

    req.on("error", err => {
      reject(err);
    });
  });
}