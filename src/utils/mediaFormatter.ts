// FLUX Media Formatter - 1:1 match with FLUX/qml/components/MediaFormatter.js

export interface FormattedMedia {
  title: string;
  subtitle: string;
}

export interface MediaDescription {
  title: string;
  subtitle: string;
  resolution: string;
  year: string;
  episode: string;
  source: string;
  codec: string;
  hdr: string;
  dualAudio: boolean;
}

export function formatMedia(rawTitle: string, isFolder: boolean, formattedSize?: string): FormattedMedia {
  if (!rawTitle || rawTitle.length === 0) {
    return { title: "", subtitle: "" };
  }

  // Strip common media file extensions
  const clean = rawTitle.replace(/\.(mkv|mp4|avi|mov|wmv|ts|m4v|webm|flv)$/i, "").trim();

  let title = "";
  const metaTokens: string[] = [];

  // 1. Detect TV Series episode format (e.g. Title S01E02 ...)
  const seriesMatch = clean.match(/^(.*?)[ ._\-\[]+S(\d{1,2})E(\d{1,2})(.*)$/i);
  if (seriesMatch) {
    title = seriesMatch[1].replace(/[._]/g, " ").replace(/[\-–]+$/, "").trim();
    const sNum = parseInt(seriesMatch[2], 10);
    const eNum = parseInt(seriesMatch[3], 10);
    const rest = seriesMatch[4];

    metaTokens.push(`Season ${sNum} · Episode ${eNum}`);

    const resMatch = rest.match(/\b(2160p|4K|1080p|720p|480p)\b/i);
    if (resMatch) metaTokens.push(resMatch[1].toLowerCase());

    const srcMatch = rest.match(/\b(BluRay|BRRip|WEBRip|WEB-DL|HDTV)\b/i);
    if (srcMatch) metaTokens.push(srcMatch[1]);

    if (/\b(HEVC|x265)\b/i.test(rest)) metaTokens.push("HEVC");
    else if (/\b(x264|AVC)\b/i.test(rest)) metaTokens.push("H.264");

    if (/\bDual Audio\b/i.test(rest)) metaTokens.push("Dual Audio");
  } else {
    // 2. Detect Movie with Year (e.g. Title (2024) ... or Title 2024 ...)
    const movieMatch = clean.match(/^(.*?)[ ._\-\[\(]+(19\d{2}|20\d{2})[ ._\-\]\)](.*)$/i);
    if (movieMatch) {
      title = movieMatch[1].replace(/[._]/g, " ").replace(/[\(\[\)\]]/g, "").replace(/[\-–]+$/, "").trim();
      const year = movieMatch[2];
      const remainder = movieMatch[3];

      metaTokens.push(year);

      const resMatch = remainder.match(/\b(2160p|4K|1080p|720p|480p)\b/i);
      if (resMatch) metaTokens.push(resMatch[1].toLowerCase());

      const srcMatch = remainder.match(/\b(BluRay|BRRip|WEBRip|WEB-DL|HDTV)\b/i);
      if (srcMatch) metaTokens.push(srcMatch[1]);

      if (/\b(HEVC|x265)\b/i.test(remainder)) metaTokens.push("HEVC");
      else if (/\b(x264|AVC)\b/i.test(remainder)) metaTokens.push("H.264");

      if (/\bDual Audio\b/i.test(remainder)) metaTokens.push("Dual Audio");
    } else {
      // 3. Fallback: clean dots and underscores
      title = clean.replace(/[._]/g, " ").replace(/[\-–]+$/, "").trim();

      const resFallback = clean.match(/\b(2160p|4K|1080p|720p|480p)\b/i);
      if (resFallback) metaTokens.push(resFallback[1].toLowerCase());
    }
  }

  if (title.length === 0) {
    title = rawTitle;
  }

  // Add size or folder indicator to metadata
  if (isFolder) {
    metaTokens.push("Directory");
  } else if (formattedSize && formattedSize.length > 0 && formattedSize !== "Folder") {
    metaTokens.push(formattedSize);
  }

  return {
    title,
    subtitle: metaTokens.join(" · ")
  };
}

export function describe(rawTitle: string, isFolder: boolean, formattedSize?: string): MediaDescription {
  const base = formatMedia(rawTitle, isFolder, formattedSize);
  const clean = (rawTitle || "").replace(/\.(mkv|mp4|avi|mov|wmv|ts|m4v|webm|flv)$/i, "");

  const info: MediaDescription = {
    title: base.title,
    subtitle: base.subtitle,
    resolution: "",
    year: "",
    episode: "",
    source: "",
    codec: "",
    hdr: "",
    dualAudio: false
  };

  if (isFolder) return info;

  // Resolution
  const res = clean.match(/\b(2160p|4K|1440p|1080p|720p|480p)\b/i);
  if (res) {
    const r = res[1].toUpperCase();
    info.resolution = (r === "2160P") ? "4K" : r;
  }

  // Episode
  const ep = clean.match(/\bS\d{1,2}E(\d{1,2})\b/i);
  if (ep) {
    info.episode = `E${ep[1]}`;
  }

  // Year
  const yr = clean.match(/\b(19\d{2}|20\d{2})\b/);
  if (yr && !ep) {
    info.year = yr[1];
  }

  // Source
  const src = clean.match(/\b(BluRay|BRRip|WEBRip|WEB-DL|HDTV)\b/i);
  if (src) info.source = src[1];

  // Codec
  if (/\b(HEVC|x265)\b/i.test(clean)) info.codec = "HEVC";
  else if (/\b(x264|AVC)\b/i.test(clean)) info.codec = "x264";

  // HDR
  if (/\b(HDR|HDR10|DV|Dolby Vision)\b/i.test(clean)) info.hdr = "HDR";

  // Dual audio
  if (/\bDual Audio\b/i.test(clean)) info.dualAudio = true;

  return info;
}
