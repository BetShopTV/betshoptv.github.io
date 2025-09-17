// scripts/convert-images.js
// Converte JPG/ JPEG em AVIF (otm e tmb).
// Usa git diff para detectar arquivos alterados; se falhar, processa todos os JPGs.

const fg = require('fast-glob');
const fs = require('fs-extra');
const path = require('path');
const sharp = require('sharp');
const { execSync } = require('child_process');

async function run() {
  try {
    const before = process.env.GITHUB_BEFORE || '';
    const sha = process.env.GITHUB_SHA || '';

    let targets = [];

    // Se houver um git diff válido, tenta encontrar arquivos JPG adicionados/alterados em img/
    try {
      if (before && sha && !/^0+$/.test(before)) {
        const out = execSync(`git diff --name-only ${before} ${sha}`, { encoding: 'utf8' }).trim();
        if (out) {
          targets = out.split('\n').filter(p => /^img\/.*\.(jpe?g)$/i.test(p));
        }
      }
    } catch (e) {
      console.log('git diff falhou ou não disponível — continuará listando todos os JPGs');
    }

    // Se nada detectado, processa todos os JPGs
    if (!targets || targets.length === 0) {
      console.log('Nenhum arquivo modificado detectado; listando todos os JPGs em img/ ...');
      targets = await fg(['img/**/*.jpg', 'img/**/*.jpeg'], { dot: false });
    }

    // normalize e dedupe
    targets = [...new Set(targets.map(p => p.replace(/\\/g, '/')))];
    console.log('Arquivos JPG para processar:', targets.length);

    if (targets.length === 0) {
      console.log('Nenhum JPG encontrado. Saindo.');
      return;
    }

    const otmDir = path.join('img', 'otm');
    const tmbDir = path.join('img', 'tmb');
    await fs.ensureDir(otmDir);
    await fs.ensureDir(tmbDir);

    for (const rel of targets) {
      try {
        const absIn = path.resolve(rel);
        if (!await fs.pathExists(absIn)) {
          console.log('Arquivo não existe (pulando):', rel);
          continue;
        }

        const base = path.basename(rel).replace(/\.(jpe?g)$/i, '');
        const outOtm = path.join(otmDir, `${base}.avif`);
        const outTmb = path.join(tmbDir, `${base}.avif`);

        const statIn = await fs.stat(absIn);

        // Skip se output já for mais novo que input
        const skipOtm = await existsAndNewer(outOtm, statIn.mtimeMs);
        const skipTmb = await existsAndNewer(outTmb, statIn.mtimeMs);

        if (skipOtm && skipTmb) {
          console.log('Já convertido (pulando):', rel);
          continue;
        }

        // metadata
        const image = sharp(absIn);
        const meta = await image.metadata();
        const width = meta.width || null;

        // === OTM (versão maior) ===
        // Estratégia: manter a largura original até um teto (ex.: 2048px)
        // primar qualidade e tamanho "grande mas otmizado"
        if (!skipOtm) {
          let pipeline = sharp(absIn);
          const maxOtmWidth = 2048;
          if (width && width > maxOtmWidth) {
            pipeline = pipeline.resize({ width: maxOtmWidth });
          }
          console.log(`Convertendo OTM: ${rel} -> ${path.relative(process.cwd(), outOtm)}`);
          await pipeline
            .avif({
              quality: 80,     // qualidade visual alta
              effort: 6,       // encodar com esforço (mais lento, melhor compressão)
            })
            .toFile(outOtm);
        }

        // === TMB (thumbnail / mobile) ===
        // Estratégia: dimensões menores, qualidade balanceada
        if (!skipTmb) {
          let pipeline = sharp(absIn);
          const tmbWidth = 800; // largura alvo para thumbs (ajustável)
          if (width && width > tmbWidth) pipeline = pipeline.resize({ width: tmbWidth });
          console.log(`Convertendo TMB: ${rel} -> ${path.relative(process.cwd(), outTmb)}`);
          await pipeline
            .avif({
              quality: 60,   // menos qualidade, menor peso
              effort: 4
            })
            .toFile(outTmb);
        }
      } catch (errInner) {
        console.error('Erro processando', rel, errInner);
      }
    }

    console.log('Conversões concluídas.');
  } catch (err) {
    console.error('Erro geral:', err);
    process.exit(1);
  }
}

async function existsAndNewer(p, mtimeMs) {
  try {
    const s = await fs.stat(p);
    return s.mtimeMs >= mtimeMs;
  } catch (e) {
    return false;
  }
}

run();
