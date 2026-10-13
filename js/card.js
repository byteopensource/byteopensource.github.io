// "Get Your Card": a personal, shareable Open Source BYTE 2K26 card, drawn on a <canvas> in the browser.
// Anyone can make one. Contributors (people on the wall) get their real number (#001, #002...) in joining order,
// verified from contributors.json; everyone else sees which number is waiting for them.
// Nothing is uploaded: the PNG is made on the visitor's device.
// Wrapped in a function so its names (plane, draw...) never clash with main.js.
(() => {
  const form = document.querySelector(".card-form");
  const canvas = document.querySelector(".card-maker__canvas");
  const ctx = canvas.getContext("2d");
  const status = document.querySelector(".card-maker__status");
  const tiltBox = document.querySelector(".card-maker__preview");
  const SITE = "byteopensource.github.io";
  const USER_RE = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
  const LEVEL_NAMES = ["Set up", "First PR", "Docs", "Small code", "Feature", "Graduate"];
  const SUPERPOWERS = [
    "merge-conflict survivor", "commit-message poet", "fork whisperer", "reads the README first",
    "typo hunter", "good-first-issue magnet", "rebases without fear", "googles the error first",
    "dark mode by default", "turns bugs into features", "always reads CONTRIBUTING", "git push, never --force",
    "one PR a day dreamer", "Stack Overflow regular", "writes the docs nobody wrote", "asks great questions",
  ];
  const THEMES = {
    day: { bg: "#b8def2", dots: "rgba(22,33,62,.08)", card: "#fffdf7", ink: "#16213e", soft: "rgba(22,33,62,.62)", accent: "#e3341e", pop: "#ffe03d", line: "rgba(22,33,62,.14)", photo: "#e6f1f7" },
    night: { bg: "#173049", dots: "rgba(138,233,221,.10)", card: "#0f1d2b", ink: "#eef8ff", soft: "rgba(238,248,255,.66)", accent: "#8ae9dd", pop: "#6a84f5", line: "rgba(238,248,255,.16)", photo: "#1f3e5c" },
  };

  let people = [];
  let leaderboard = [];
  let superpower = SUPERPOWERS[Math.floor(Math.random() * SUPERPOWERS.length)];
  let style = "day";
  let size = "post";
  let avatar = null;
  let avatarFor = null;
  let upload = null; // a photo picked on this device, already cropped square
  const logo = new Image();
  logo.src = "assets/byte-logo.webp";

  const pad = (n) => String(n).padStart(3, "0");

  // Prefill from the First PR card if they used it.
  try {
    const saved = JSON.parse(localStorage.getItem("byte-details")) || {};
    if (saved.name) form.elements.cardName.value = saved.name;
    if (saved.github) form.elements.cardGithub.value = saved.github;
  } catch {}

  function readForm() {
    const github = form.elements.cardGithub.value.trim().replace(/^@/, "");
    const validGithub = USER_RE.test(github) ? github : "";
    const index = validGithub ? people.findIndex((p) => p.github.toLowerCase() === validGithub.toLowerCase()) : -1;
    const person = people[index];
    const board = person && leaderboard.find((b) => b.github.toLowerCase() === person.github.toLowerCase());

    // Level: verified data first (graduate = 5, contributor = at least 1), plus their own ticked Journey levels.
    let level = person ? (person.graduated ? 5 : 1) : 0;
    try {
      const mine = JSON.parse(localStorage.getItem("byte-details"))?.github?.toLowerCase();
      const done = JSON.parse(localStorage.getItem("byte-journey")) || [];
      if (!validGithub || validGithub.toLowerCase() === mine) level = Math.max(level, ...done.filter((l) => l >= 0 && l <= 5)); // highest finished level
    } catch {}

    return {
      name: form.elements.cardName.value.trim() || person?.name || "Your Name",
      github: validGithub,
      from: form.elements.cardFrom.value.trim(),
      role: form.elements.cardRole.value,
      number: index >= 0 ? index + 1 : null,
      nextNumber: people.length + 1,
      prs: board?.prs || 0,
      level: Math.min(level, 5),
      graduated: Boolean(person?.graduated),
    };
  }

  // ---------- drawing helpers ----------
  const font = (weight, size, family) => `${weight} ${size}px ${family}`;
  const BRUSH = '"Knewave", cursive';
  const HAND = '"Caveat", cursive';
  const SANS = '"DM Sans", system-ui, sans-serif';

  function fitFont(text, weight, family, start, min, maxWidth) {
    let s = start;
    ctx.font = font(weight, s, family);
    while (s > min && ctx.measureText(text).width > maxWidth) ctx.font = font(weight, (s -= 2), family);
    return s;
  }

  function background(th, W, H) {
    ctx.fillStyle = th.bg;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = th.dots;
    for (let y = 30; y < H; y += 44) for (let x = 30; x < W; x += 44) ctx.fillRect(x, y, 4, 4);
    // the Journey route drifting across the background, and a paper plane
    ctx.save();
    ctx.strokeStyle = th.accent;
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 6;
    ctx.setLineDash([16, 16]);
    ctx.beginPath();
    ctx.moveTo(-20, H * 0.82);
    ctx.bezierCurveTo(W * 0.3, H * 0.95, W * 0.55, H * 0.55, W * 0.75, H * 0.2);
    ctx.bezierCurveTo(W * 0.82, H * 0.08, W * 0.9, H * 0.06, W * 0.95, H * 0.07);
    ctx.stroke();
    ctx.restore();
    plane(th, W * 0.9, H * 0.065, 1.2);
  }

  function plane(th, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.rotate(-0.2);
    ctx.fillStyle = th.card;
    ctx.strokeStyle = th.ink;
    ctx.lineWidth = 4;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(-40, 6); ctx.lineTo(40, -30); ctx.lineTo(18, 34); ctx.lineTo(4, 14); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(4, 14); ctx.lineTo(40, -30); ctx.stroke();
    ctx.restore();
  }

  function tape(th, x, y, w, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = th === THEMES.night ? "rgba(106,132,245,.85)" : "rgba(255,224,61,.88)";
    ctx.fillRect(-w / 2, -22, w, 44);
    ctx.restore();
  }

  function initials(name) {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "?";
  }

  // The card itself, centred on (cx, cy). 860 x 1120.
  function cardBody(d, th, cx, cy) {
    const w = 860, h = 1120, x = -w / 2, y = -h / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.03);

    ctx.shadowColor = "rgba(0,0,0,.22)";
    ctx.shadowBlur = 50;
    ctx.shadowOffsetY = 24;
    ctx.fillStyle = th.card;
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 22); ctx.fill();
    ctx.shadowColor = "transparent";
    tape(th, 0, y + 4, 220, -0.04);

    // header: logo, program name, number
    ctx.save();
    ctx.beginPath(); ctx.arc(x + 92, y + 108, 44, 0, Math.PI * 2); ctx.clip();
    if (logo.complete && logo.naturalWidth) ctx.drawImage(logo, x + 48, y + 64, 88, 88);
    ctx.restore();
    ctx.fillStyle = th.ink;
    ctx.textAlign = "left";
    ctx.font = font(700, 36, SANS);
    ctx.fillText("Open Source BYTE 2K26", x + 156, y + 104);
    ctx.fillStyle = th.accent;
    ctx.font = font(700, 34, HAND);
    ctx.fillText("by The BYTE Club", x + 156, y + 142);

    ctx.textAlign = "right";
    if (d.number) {
      ctx.fillStyle = th.soft;
      ctx.font = font(700, 20, SANS);
      ctx.fillText("CONTRIBUTOR", x + w - 48, y + 82);
      ctx.fillStyle = th.accent;
      ctx.font = font(400, 64, BRUSH);
      ctx.fillText(`#${pad(d.number)}`, x + w - 48, y + 146);
    } else {
      ctx.fillStyle = th.soft;
      ctx.font = font(700, 20, SANS);
      ctx.fillText("NUMBER WAITING", x + w - 48, y + 82);
      ctx.fillStyle = th.accent;
      ctx.font = font(400, 64, BRUSH);
      ctx.fillText(`#${pad(d.nextNumber)}?`, x + w - 48, y + 146);
    }

    ctx.strokeStyle = th.line;
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 10]);
    ctx.beginPath(); ctx.moveTo(x + 48, y + 186); ctx.lineTo(x + w - 48, y + 186); ctx.stroke();
    ctx.setLineDash([]);

    // photo, as a little polaroid
    ctx.save();
    ctx.translate(0, y + 430);
    ctx.rotate(0.035);
    ctx.shadowColor = "rgba(0,0,0,.18)"; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-200, -210, 400, 440);
    ctx.shadowColor = "transparent";
    ctx.fillStyle = th.photo;
    ctx.fillRect(-176, -186, 352, 352);
    const photo = upload || (avatarFor === d.github && avatar);
    if (photo) {
      ctx.drawImage(photo, -176, -186, 352, 352);
    } else {
      ctx.fillStyle = th === THEMES.night ? "#8ae9dd" : "#e3341e";
      ctx.textAlign = "center";
      ctx.font = font(400, 150, BRUSH);
      ctx.fillText(initials(d.name), 0, 50);
    }
    ctx.fillStyle = "#16213e";
    ctx.textAlign = "center";
    ctx.font = font(700, 34, HAND);
    ctx.fillText(d.number ? "day one ♡" : "hello, open source ♡", 0, 212);
    ctx.restore();
    tape(th, -150, y + 238, 120, -0.6);

    // name, handle, role
    ctx.textAlign = "center";
    ctx.fillStyle = th.accent;
    const nameSize = fitFont(d.name, 400, BRUSH, 92, 46, w - 120);
    ctx.font = font(400, nameSize, BRUSH);
    ctx.fillText(d.name, 0, y + 756);

    const sub = [d.github && `@${d.github}`, d.from].filter(Boolean).join("  ·  ");
    if (sub) {
      ctx.fillStyle = th.soft;
      fitFont(sub, 600, SANS, 32, 20, w - 120);
      ctx.fillText(sub, 0, y + 810);
    }

    const role = (d.number ? `${d.role} · ${d.prs || 1} PR${(d.prs || 1) === 1 ? "" : "s"} merged` : d.role).toUpperCase();
    ctx.font = font(800, 26, SANS);
    const rw = ctx.measureText(role).width + 56;
    ctx.fillStyle = th.accent;
    ctx.beginPath(); ctx.roundRect(-rw / 2, y + 846, rw, 52, 26); ctx.fill();
    ctx.fillStyle = th.card;
    ctx.fillText(role, 0, y + 882);

    ctx.fillStyle = th.ink;
    fitFont(`superpower: ${superpower}`, 700, HAND, 42, 28, w - 120);
    ctx.fillText(`superpower: ${superpower}`, 0, y + 962);

    // the six Journey stops, filled up to their level
    const gap = 112, startX = -gap * 2.5, dotsY = y + 1028;
    ctx.strokeStyle = th.accent;
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 10]);
    ctx.beginPath(); ctx.moveTo(startX, dotsY); ctx.lineTo(-startX, dotsY); ctx.stroke();
    ctx.setLineDash([]);
    for (let i = 0; i <= 5; i++) {
      const cx2 = startX + i * gap;
      const reached = i <= d.level && (d.level > 0 || i === 0);
      ctx.fillStyle = reached ? th.pop : th.card;
      ctx.strokeStyle = th.ink;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(cx2, dotsY, i === d.level ? 26 : 21, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = reached && th === THEMES.night ? "#0f1d2b" : th.ink;
      ctx.font = font(400, i === d.level ? 26 : 22, BRUSH);
      ctx.fillText(String(i), cx2, dotsY + 9);
    }
    ctx.fillStyle = th.soft;
    ctx.font = font(700, 30, HAND);
    ctx.fillText(d.level > 0 ? `Level ${d.level} · ${LEVEL_NAMES[d.level]}` : "ready to start the journey", 0, y + 1092);

    ctx.restore();
  }

  function draw() {
    const d = readForm();
    const th = THEMES[style];
    const W = 1080;
    const H = size === "story" ? 1920 : 1350;
    if (canvas.height !== H) canvas.height = H;
    ctx.setLineDash([]);
    ctx.textBaseline = "alphabetic";
    background(th, W, H);

    if (size === "story") {
      ctx.save();
      ctx.translate(W / 2, 230);
      ctx.rotate(-0.05);
      ctx.textAlign = "center";
      ctx.fillStyle = th.pop;
      ctx.beginPath(); ctx.roundRect(-330, 10, 660, 40, 20); ctx.fill();
      ctx.fillStyle = th.accent;
      ctx.font = font(400, 120, BRUSH);
      ctx.fillText(d.number ? "I'm in! ✱" : "Count me in!", 0, 30);
      ctx.restore();
      cardBody(d, th, W / 2, 940);
      footer(th, W, H, 1700);
    } else {
      cardBody(d, th, W / 2, 640);
      footer(th, W, H, 1300);
    }

    status.textContent = d.number
      ? `Verified ✓ You're contributor #${pad(d.number)} on the wall.`
      : d.github
        ? `@${d.github} isn't on the wall yet. Make your first PR to claim #${pad(d.nextNumber)}.`
        : `Add your GitHub username (or upload a photo), and your number if you're a contributor.`;
    canvas.setAttribute("aria-label", `${d.name}'s Open Source BYTE 2K26 card. ${status.textContent}`);
    return d;
  }

  function footer(th, W, H, y) {
    ctx.textAlign = "left";
    ctx.fillStyle = th.ink;
    ctx.font = font(700, 30, SANS);
    ctx.fillText(`get yours → ${SITE}/#card`, 60, y);
    ctx.textAlign = "right";
    ctx.fillStyle = th.accent;
    ctx.font = font(700, 34, HAND);
    ctx.fillText("@thebyteclubnie", W - 60, y);
    if (size === "story") {
      ctx.textAlign = "center";
      ctx.fillStyle = th.soft;
      ctx.font = font(700, 40, HAND);
      ctx.fillText("small commits, big journeys ✱", W / 2, y + 90);
    }
  }

  // ---------- avatar (GitHub photos are served with CORS, so the canvas stays exportable) ----------
  function loadAvatar(github) {
    if (!github || github === avatarFor) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { avatar = img; avatarFor = github; draw(); };
    img.onerror = () => { avatar = null; avatarFor = null; draw(); };
    // avatars.githubusercontent.com sends CORS headers (github.com/x.png redirects without them), so the PNG can still be exported.
    img.src = `https://avatars.githubusercontent.com/${encodeURIComponent(github)}?s=400`;
  }

  // ---------- uploaded photo: check -> decode -> square-crop (zoomable) -> downscale. Never leaves the device ----------
  const MAX_PHOTO = 15 * 1024 * 1024;
  const photoInput = form.elements.cardPhoto;
  const removePhoto = form.querySelector(".card-photo__remove");

  const zoomBox = form.querySelector(".card-zoom");
  const zoom = form.elements.cardZoom;
  let source = null; // the decoded photo, kept so zooming can re-crop it
  let sourceUrl = null;

  // Square from the middle, 1/zoom of the short side, scaled to 2x the polaroid window (sharp, fast to redraw).
  function cropPhoto() {
    const side = Math.min(source.naturalWidth, source.naturalHeight) / Number(zoom.value);
    const out = document.createElement("canvas");
    out.width = out.height = 704;
    out.getContext("2d").drawImage(source, (source.naturalWidth - side) / 2, (source.naturalHeight - side) / 2, side, side, 0, 0, 704, 704);
    upload = out;
  }

  function dropPhoto() {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    source = sourceUrl = upload = null;
    removePhoto.hidden = zoomBox.hidden = true;
  }

  async function usePhoto(file) {
    if (!file) return;
    if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) return say("That file isn't a photo. Try a JPG, PNG or WebP.");
    if (file.size > MAX_PHOTO) return say("That photo is over 15 MB. Try a smaller one.");
    const url = URL.createObjectURL(file);
    photoInput.value = ""; // picking the same file again still works
    try {
      const img = new Image();
      img.src = url;
      await img.decode(); // browsers apply the phone's rotation (EXIF) here
      dropPhoto();
      source = img;
      sourceUrl = url;
      zoom.value = 1;
      cropPhoto();
      removePhoto.hidden = zoomBox.hidden = false;
      draw();
      say("Photo added ✓ Use Zoom to get your face in the frame.");
    } catch {
      URL.revokeObjectURL(url);
      say("Couldn't read that photo. Try another one.");
    }
  }
  function say(text) { status.textContent = text; }

  photoInput.addEventListener("change", () => usePhoto(photoInput.files[0]));
  zoom.addEventListener("input", () => source && cropPhoto()); // the form's input handler redraws right after
  removePhoto.addEventListener("click", () => { dropPhoto(); draw(); });
  tiltBox.addEventListener("dragover", (e) => { e.preventDefault(); tiltBox.classList.add("is-dropping"); });
  tiltBox.addEventListener("dragleave", () => tiltBox.classList.remove("is-dropping"));
  tiltBox.addEventListener("drop", (e) => {
    e.preventDefault();
    tiltBox.classList.remove("is-dropping");
    usePhoto(e.dataTransfer.files[0]);
  });

  let typing;
  form.addEventListener("input", () => {
    draw();
    clearTimeout(typing);
    typing = setTimeout(() => loadAvatar(readForm().github), 500); // wait until they stop typing
  });
  form.addEventListener("submit", (e) => e.preventDefault());

  form.querySelectorAll("[data-card-style] button").forEach((b) => b.addEventListener("click", () => {
    style = b.dataset.value;
    form.querySelectorAll("[data-card-style] button").forEach((x) => x.setAttribute("aria-pressed", x === b));
    draw();
  }));
  form.querySelectorAll("[data-card-size] button").forEach((b) => b.addEventListener("click", () => {
    size = b.dataset.value;
    form.querySelectorAll("[data-card-size] button").forEach((x) => x.setAttribute("aria-pressed", x === b));
    canvas.classList.toggle("is-story", size === "story");
    draw();
  }));
  form.querySelector(".card-shuffle").addEventListener("click", () => {
    let next;
    do next = SUPERPOWERS[Math.floor(Math.random() * SUPERPOWERS.length)]; while (next === superpower);
    superpower = next;
    draw();
  });

  // ---------- download, share, caption ----------
  function caption(d) {
    const who = d.number ? `I'm contributor #${pad(d.number)} in Open Source BYTE 2K26` : "Just got my Open Source BYTE 2K26 card";
    return `${who} ✱ Small commits, big journeys. Make yours at https://${SITE}/#card @thebyteclubnie #OpenSource #BYTE2K26 #FirstPR`;
  }
  const fileName = (d) => `byte-opensource-card-${d.github || d.name.replace(/[^\w]+/g, "-").toLowerCase() || "me"}.png`;
  const toBlob = () => new Promise((r) => canvas.toBlob(r, "image/png"));

  function saveBlob(blob, name) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  async function copyCaption(d) {
    try { await navigator.clipboard.writeText(caption(d)); return true; } catch { return false; }
  }

  form.querySelector(".card-download").addEventListener("click", async () => {
    const d = draw();
    saveBlob(await toBlob(), fileName(d));
    confetti(90);
    toast("Card saved ✱ Post it and tag @thebyteclubnie");
  });

  form.querySelector(".card-share").addEventListener("click", async () => {
    const d = draw();
    const blob = await toBlob();
    const file = new File([blob], fileName(d), { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], text: caption(d) }); confetti(90); return; } catch { return; } // cancelled
    }
    saveBlob(blob, file.name); // laptops: save it and put the caption on the clipboard
    const copied = await copyCaption(d);
    confetti(90);
    toast(copied ? "Card saved and caption copied ✱ Paste both into your post" : "Card saved ✱ Post it and tag @thebyteclubnie");
  });

  form.querySelector(".card-caption").addEventListener("click", async () => {
    toast((await copyCaption(readForm())) ? "Caption copied ✱" : "Couldn't copy. Select it from the post box instead");
  });

  // ---------- the preview tilts towards the mouse ----------
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    tiltBox.addEventListener("pointermove", (e) => {
      const r = tiltBox.getBoundingClientRect();
      tiltBox.style.setProperty("--ry", `${((e.clientX - r.left) / r.width - 0.5) * 14}deg`);
      tiltBox.style.setProperty("--rx", `${((e.clientY - r.top) / r.height - 0.5) * -14}deg`);
    });
    tiltBox.addEventListener("pointerleave", () => { tiltBox.style.setProperty("--rx", "0deg"); tiltBox.style.setProperty("--ry", "0deg"); });
  }

  // ---------- data, then first draw ----------
  Promise.all([
    fetch("contributors.json").then((r) => r.json()).catch(() => []),
    fetch("stats.json").then((r) => r.json()).catch(() => ({})),
    document.fonts.load(font(400, 92, BRUSH)),
    document.fonts.load(font(700, 40, HAND)),
    document.fonts.load(font(700, 36, SANS)),
    document.fonts.load(font(800, 26, SANS)),
    logo.decode().catch(() => {}),
  ]).then(([list, stats]) => {
    people = Array.isArray(list) ? list.filter((p) => p && USER_RE.test(p.github || "")) : [];
    leaderboard = stats.leaderboard || [];
    draw();
    loadAvatar(readForm().github);
  });
  draw(); // a first version straight away, redrawn when the fonts and data arrive
})();
