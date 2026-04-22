import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const ASSETS_ROOT = path.join(ROOT, "src", "assets");
const SHOP_ROOT = path.join(ASSETS_ROOT, "shop");
const MANIFEST_PATH = path.join(ROOT, "scripts", "shop-upload-manifest.json");

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".bmp"]);

function parseEnvFile(content) {
  const out = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

async function loadLocalEnv() {
  const files = [".env.local", ".env"];
  const merged = {};

  for (const file of files) {
    const fullPath = path.join(ROOT, file);
    try {
      const raw = await fs.readFile(fullPath, "utf8");
      Object.assign(merged, parseEnvFile(raw));
    } catch {
      // ignore missing env files
    }
  }

  return merged;
}

function getConfig(env) {
  const projectUrl = process.env.SUPABASE_STORAGE_URL || env.SUPABASE_STORAGE_URL || env.VITE_STORAGE_PROJECT_URL;
  const apiKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_STORAGE_KEY || env.SUPABASE_STORAGE_KEY || env.VITE_STORAGE_PUBLISHABLE_KEY;
  const bucket = process.env.SUPABASE_BUCKET || env.SUPABASE_BUCKET || process.env.VITE_STORAGE_BUCKET || env.VITE_STORAGE_BUCKET || "products";

  if (!projectUrl) {
    throw new Error("Missing SUPABASE_STORAGE_URL or VITE_STORAGE_PROJECT_URL in env.");
  }
  if (!apiKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY/SUPABASE_STORAGE_KEY or VITE_STORAGE_PUBLISHABLE_KEY in env.");
  }

  return {
    projectUrl: projectUrl.replace(/\/$/, ""),
    apiKey,
    bucket,
  };
}

async function listImageFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listImageFiles(full)));
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (IMAGE_EXTENSIONS.has(ext)) {
      files.push(full);
    }
  }

  return files;
}

function toPosixPath(filePath) {
  return filePath.split(path.sep).join("/");
}

function encodeStoragePath(p) {
  return p.split("/").map((seg) => encodeURIComponent(seg)).join("/");
}

function sanitizeStorageSegment(segment) {
  return segment
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ._\-()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function toStorageSafePath(relPath) {
  return relPath
    .split("/")
    .map((segment) => sanitizeStorageSegment(segment) || "_")
    .join("/");
}

function inferContentType(ext) {
  switch (ext.toLowerCase()) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".avif":
      return "image/avif";
    case ".bmp":
      return "image/bmp";
    default:
      return "application/octet-stream";
  }
}

function normalizeProductToken(value) {
  return value
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/\b(front|back|side|left|right|angle|detail|zoom|main|hero|image|img|photo|view)\b/g, "")
    .replace(/[\s._-]+/g, " ")
    .replace(/\s*\(\d+\)\s*/g, " ")
    .replace(/\b\d+\b/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s+/g, "-");
}

function inferGroupKey(relFromAssets) {
  const parts = relFromAssets.split("/");
  const filename = parts.at(-1) || "";
  const productDir = parts.slice(0, -1).join("/");
  const nameToken = normalizeProductToken(filename) || "unknown";
  return `${productDir}::${nameToken}`;
}

function parseArgs(argv) {
  const opts = {
    concurrency: 4,
    limit: 0,
    dryRun: false,
    retryFailedOnly: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--dry-run") opts.dryRun = true;
    if (arg === "--concurrency") opts.concurrency = Number(argv[i + 1] || "4");
    if (arg === "--limit") opts.limit = Number(argv[i + 1] || "0");
    if (arg === "--retry-failed-only") opts.retryFailedOnly = true;
  }

  if (!Number.isFinite(opts.concurrency) || opts.concurrency < 1) {
    opts.concurrency = 4;
  }
  if (!Number.isFinite(opts.limit) || opts.limit < 0) {
    opts.limit = 0;
  }

  return opts;
}

function buildPublicUrl(projectUrl, bucket, storagePath) {
  return `${projectUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodeStoragePath(storagePath)}`;
}

async function uploadOne({ filePath, storagePath, config }) {
  const buffer = await fs.readFile(filePath);
  const endpoint = `${config.projectUrl}/storage/v1/object/${encodeURIComponent(config.bucket)}/${encodeStoragePath(storagePath)}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      apikey: config.apiKey,
      Authorization: `Bearer ${config.apiKey}`,
      "x-upsert": "true",
      "content-type": inferContentType(path.extname(filePath)),
    },
    body: buffer,
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(`Upload failed (${response.status}) for ${storagePath}: ${responseText}`);
  }

  return {
    storagePath,
    publicUrl: buildPublicUrl(config.projectUrl, config.bucket, storagePath),
    response: responseText,
  };
}

async function uploadWithRetry({ filePath, storagePath, config, retries = 3 }) {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return await uploadOne({ filePath, storagePath, config });
    } catch (error) {
      lastError = error;
      const msg = String(error?.message || "");
      const isTransient =
        msg.includes("(502)") ||
        msg.includes("(503)") ||
        msg.includes("(504)") ||
        msg.includes("(520)") ||
        msg.includes("<html>") ||
        msg.includes("Cloudflare");
      if (!isTransient || attempt === retries) break;
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }

  throw lastError;
}

async function run() {
  const opts = parseArgs(process.argv.slice(2));
  const localEnv = await loadLocalEnv();
  const config = getConfig(localEnv);

  console.log(`Using project: ${config.projectUrl}`);
  console.log(`Using bucket: ${config.bucket}`);

  let allFiles = await listImageFiles(SHOP_ROOT);
  allFiles.sort((a, b) => a.localeCompare(b));

  if (opts.retryFailedOnly) {
    try {
      const existingManifest = JSON.parse(await fs.readFile(MANIFEST_PATH, "utf8"));
      const failedSet = new Set((existingManifest.failedFiles || []).map((f) => f.localPath));
      allFiles = allFiles.filter((fullPath) => failedSet.has(toPosixPath(path.relative(ASSETS_ROOT, fullPath))));
      console.log(`Retry mode: ${allFiles.length} failed files loaded from manifest`);
    } catch {
      console.log("Retry mode requested but no prior manifest found; processing all files.");
    }
  }

  const files = opts.limit > 0 ? allFiles.slice(0, opts.limit) : allFiles;

  console.log(`Found ${files.length} image files under src/assets/shop`);
  if (opts.dryRun) {
    console.log("Dry run mode: no uploads will be performed.");
  }

  const startedAt = Date.now();
  let index = 0;
  let uploaded = 0;
  let failed = 0;
  let bytesUploaded = 0;

  const manifest = {
    generatedAt: new Date().toISOString(),
    projectUrl: config.projectUrl,
    bucket: config.bucket,
    totalFiles: files.length,
    uploadedFiles: [],
    failedFiles: [],
    groupedByProduct: {},
  };

  const worker = async () => {
    while (true) {
      const current = index;
      index += 1;
      if (current >= files.length) return;

      const filePath = files[current];
      const relFromAssets = toPosixPath(path.relative(ASSETS_ROOT, filePath));
      const productDir = relFromAssets.split("/").slice(0, -1).join("/");
      const productKey = inferGroupKey(relFromAssets);
      const storagePath = toStorageSafePath(relFromAssets);

      try {
        const stats = await fs.stat(filePath);

        if (!opts.dryRun) {
          await uploadWithRetry({
            filePath,
            storagePath,
            config,
            retries: 6,
          });
        }

        uploaded += 1;
        bytesUploaded += stats.size;

        const publicUrl = buildPublicUrl(config.projectUrl, config.bucket, storagePath);
        manifest.uploadedFiles.push({
          localPath: relFromAssets,
          storagePath,
          bytes: stats.size,
          publicUrl,
        });

        if (!manifest.groupedByProduct[productKey]) {
          manifest.groupedByProduct[productKey] = {
            productDir,
            productKey,
            images: [],
          };
        }
        manifest.groupedByProduct[productKey].images.push({
          localPath: relFromAssets,
          publicUrl,
        });

        if (uploaded % 100 === 0 || uploaded === files.length) {
          console.log(`Progress: ${uploaded}/${files.length} uploaded`);
        }
      } catch (error) {
        failed += 1;
        manifest.failedFiles.push({
          localPath: relFromAssets,
          error: String(error?.message || error),
        });
        console.error(`Failed: ${relFromAssets}`);
        console.error(String(error?.message || error));
      }
    }
  };

  const workers = [];
  for (let i = 0; i < opts.concurrency; i += 1) {
    workers.push(worker());
  }
  await Promise.all(workers);

  await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf8");

  const elapsedSec = Math.round((Date.now() - startedAt) / 1000);
  console.log("--- Upload complete ---");
  console.log(`Uploaded: ${uploaded}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total bytes: ${bytesUploaded}`);
  console.log(`Elapsed: ${elapsedSec}s`);
  console.log(`Manifest: ${path.relative(ROOT, MANIFEST_PATH)}`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
