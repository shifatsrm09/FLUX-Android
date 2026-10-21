import type { SearchResult, MediaRoot, VideoSource } from '../types';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import mediaLibraryRaw from '../data/media_library.json';

const IMAGE_EXTENSIONS = /\.(?:jpe?g|png|gif|webp|bmp|svg)$/i;
const VIDEO_EXTENSIONS = /\.(?:mkv|mp4|avi|mov|webm|ts|m4v|m3u8)$/i;

function isSelectableMedia(name: string, isFolder = false): boolean {
  return isFolder || !IMAGE_EXTENSIONS.test(name) && (VIDEO_EXTENSIONS.test(name) || !name.includes('.'));
}

// Curated lookup for instant IMDb ID resolution
export const IMDB_MAP: Record<string, string> = {
  'spider-man': 'tt0145487',
  'spider man': 'tt0145487',
  'spider-man 2': 'tt0316654',
  'spider-man 3': 'tt0413300',
  'spider-man: across the spider-verse': 'tt9362722',
  'spider-man across the spider-verse': 'tt9362722',
  'across the spider-verse': 'tt9362722',
  'spider-man: into the spider-verse': 'tt4633694',
  'spider-man into the spider-verse': 'tt4633694',
  'spider-man: homecoming': 'tt2250912',
  'spider-man: no way home': 'tt10872600',
  'spider-man: far from home': 'tt6320628',
  'the amazing spider-man': 'tt0948470',
  'dune': 'tt1160419',
  'dune: part two': 'tt15239678',
  'dune part two': 'tt15239678',
  'oppenheimer': 'tt15398776',
  'interstellar': 'tt0816692',
  'the dark knight': 'tt0468569',
  'dark knight': 'tt0468569',
  'the dark knight rises': 'tt1345836',
  'batman begins': 'tt0372784',
  'the batman': 'tt1877830',
  'deadpool': 'tt1431045',
  'deadpool 2': 'tt5463162',
  'deadpool & wolverine': 'tt6263850',
  'deadpool and wolverine': 'tt6263850',
  'the avengers': 'tt0848228',
  'avengers': 'tt0848228',
  'avengers: endgame': 'tt4154796',
  'avengers: infinity war': 'tt4154756',
  'breaking bad': 'tt0903747',
  'shogun': 'tt2788316',
  'shōgun': 'tt2788316',
  'arcane': 'tt11126994',
  'inception': 'tt1375666',
  'fight club': 'tt0137523',
  'gladiator': 'tt0172495',
  'avatar': 'tt0499549',
  'avatar: the way of water': 'tt1630029',
  'titanic': 'tt0120338',
  'jawan': 'tt15354916',
  '12th fail': 'tt23849516',
  'animal': 'tt13751694',
  'pathaan': 'tt12844910',
  'rrr': 'tt8178634',
  'kgf': 'tt7736564',
  'suzume': 'tt16428256',
  'godzilla x kong': 'tt14539740',
  'inside out 2': 'tt22022452',
  'kung fu panda 4': 'tt21692408'
};

export function lookupImdbId(queryOrTitle: string): string | undefined {
  const norm = queryOrTitle
    .toLowerCase()
    .replace(/[._\-\(\)]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Exact match
  if (IMDB_MAP[norm]) return IMDB_MAP[norm];

  // Prefix / substring match
  for (const [key, id] of Object.entries(IMDB_MAP)) {
    if (norm.includes(key) || key.includes(norm)) {
      return id;
    }
  }
  return undefined;
}

// Curated Showcase items for Home and Trending with REAL verified streams
export const SHOWCASE_CATALOG: SearchResult[] = [
  {
    title: 'Spider-Man: Across the Spider-Verse (2023) 1080p BluRay Dual Audio',
    formattedSize: '1.8 GB',
    isFolder: false,
    playUrl: 'http://172.16.50.14/DHAKA-FLIX-14/Animation%20Movies%20%281080p%29/Spider-Man%20-%20Across%20the%20Spider-Verse%20%282023%29%201080p%20%5BDual%20Audio%5D/Spider-Man%20Across%20the%20Spider-Verse%20%282023%29%201080p%20BluRay%20x265%20HEVC%20ESub%20%5BDual%20Audio%5D%5BHindi%205.1%2BEnglish%205.1%5D%20-mkvC.mkv',
    trailerUrl: 'https://www.youtube-nocookie.com/embed/cqGjhVJWtEg',
    embedUrl: 'https://autoembed.co/movie/imdb/tt9362722',
    imdbId: 'tt9362722',
    sources: [
      { name: 'BDIX Direct Stream', url: 'http://172.16.50.14/DHAKA-FLIX-14/Animation%20Movies%20%281080p%29/Spider-Man%20-%20Across%20the%20Spider-Verse%20%282023%29%201080p%20%5BDual%20Audio%5D/Spider-Man%20Across%20the%20Spider-Verse%20%282023%29%201080p%20BluRay%20x265%20HEVC%20ESub%20%5BDual%20Audio%5D%5BHindi%205.1%2BEnglish%205.1%5D%20-mkvC.mkv', type: 'video' },
      { name: 'Fast Mirror (HD)', url: 'https://autoembed.co/movie/imdb/tt9362722', type: 'embed' }
    ],
    extension: 'mkv',
    rawHref: '/DHAKA-FLIX-14/Animation%20Movies%20%281080p%29/Spider-Man%20-%20Across%20the%20Spider-Verse%20%282023%29%201080p%20%5BDual%20Audio%5D/Spider-Man%20Across%20the%20Spider-Verse%20%282023%29%201080p%20BluRay%20x265%20HEVC%20ESub%20%5BDual%20Audio%5D%5BHindi%205.1%2BEnglish%205.1%5D%20-mkvC.mkv',
    libraryName: 'Dhaka Flix',
    group: 'Animation',
    posterUrl: 'https://m.media-amazon.com/images/M/MV5BMzI0NmVkMjEtYmY4MS00ZDMxLTlkZmEtMzU4MDQxYTMzMjU2XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
    matchScore: 10
  },
  {
    title: 'Spider-Man (2002) 720p BluRay Dual Audio',
    formattedSize: '1.3 GB',
    isFolder: false,
    playUrl: 'http://172.16.50.7/DHAKA-FLIX-7/English%20Movies/%282002%29/Spider-Man%20%282002%29%20720p%20%5BDual%20Audio%5D/Spider-Man%20%282002%29%20720p%20BluRay%20x264%20ESub%20%5BDual%20Audio%5D%5BHindi%205.1%2BEnglish%205.1%5D%20-%20mkvC.mkv',
    trailerUrl: 'https://www.youtube-nocookie.com/embed/t06RUxPbp_c',
    embedUrl: 'https://autoembed.co/movie/imdb/tt0145487',
    imdbId: 'tt0145487',
    sources: [
      { name: 'BDIX Direct Stream', url: 'http://172.16.50.7/DHAKA-FLIX-7/English%20Movies/%282002%29/Spider-Man%20%282002%29%20720p%20%5BDual%20Audio%5D/Spider-Man%20%282002%29%20720p%20BluRay%20x264%20ESub%20%5BDual%20Audio%5D%5BHindi%205.1%2BEnglish%205.1%5D%20-%20mkvC.mkv', type: 'video' },
      { name: 'Fast Mirror (HD)', url: 'https://autoembed.co/movie/imdb/tt0145487', type: 'embed' }
    ],
    extension: 'mkv',
    rawHref: '/DHAKA-FLIX-7/English%20Movies/%282002%29/Spider-Man%20%282002%29%20720p%20%5BDual%20Audio%5D/Spider-Man%20%282002%29%20720p%20BluRay%20x264%20ESub%20%5BDual%20Audio%5D%5BHindi%205.1%2BEnglish%205.1%5D%20-%20mkvC.mkv',
    libraryName: 'Dhaka Flix',
    group: 'English Movies',
    posterUrl: 'https://m.media-amazon.com/images/M/MV5BZWM0OWVmNTEtNWVkOS00MzgyLTkyMzgtMmE2ZTZiNjY4MmFiXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
    matchScore: 10
  },
  {
    title: 'Dune: Part Two (2024) 2160p 4K UHD BluRay HEVC TrueHD Atmos',
    formattedSize: '18.4 GB',
    isFolder: false,
    playUrl: 'http://172.16.50.7/DHAKA-FLIX-7/English%20Movies/%281960-1994%29/Dune%20%281984%29%20720p/Dune.1984.EXTENDED.720p.BluRay.x265.HEVC.10bit.ESub-GalaxyRG.mkv',
    trailerUrl: 'https://www.youtube-nocookie.com/embed/Way9Dexny3w',
    embedUrl: 'https://autoembed.co/movie/imdb/tt15239678',
    imdbId: 'tt15239678',
    sources: [
      { name: 'BDIX Direct Stream', url: 'http://172.16.50.7/DHAKA-FLIX-7/English%20Movies/%281960-1994%29/Dune%20%281984%29%20720p/Dune.1984.EXTENDED.720p.BluRay.x265.HEVC.10bit.ESub-GalaxyRG.mkv', type: 'video' },
      { name: 'Fast Mirror (HD)', url: 'https://autoembed.co/movie/imdb/tt15239678', type: 'embed' }
    ],
    extension: 'mkv',
    rawHref: '/DHAKA-FLIX-7/English%20Movies/%281960-1994%29/Dune%20%281984%29%20720p/Dune.1984.EXTENDED.720p.BluRay.x265.HEVC.10bit.ESub-GalaxyRG.mkv',
    libraryName: 'Dhaka Flix',
    group: 'English Movies',
    posterUrl: 'https://m.media-amazon.com/images/M/MV5BNTc0YmQxMjEtODI5MC00NDg0LWI3ZGEtNDJhMWM4ZTRjMjMxXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
    matchScore: 10
  },
  {
    title: 'Oppenheimer (2023) IMAX 720p BluRay Dual Audio',
    formattedSize: '1.91 GB',
    isFolder: false,
    playUrl: 'http://172.16.50.7/DHAKA-FLIX-7/English%20Movies/%282023%29/Oppenheimer%20%282023%29%20720p%20%5BDual%20Audio%5D/Oppenheimer%20%282023%29%20IMAX%20720p%20BluRay%20x264%20ESub%20%5BDual%20Audio%5D%5BHindi%205.1%2BEnglish%205.1%5D%20-mkvC.mkv',
    trailerUrl: 'https://www.youtube-nocookie.com/embed/uYPbbksJxIg',
    embedUrl: 'https://autoembed.co/movie/imdb/tt15398776',
    imdbId: 'tt15398776',
    sources: [
      { name: 'BDIX Direct Stream', url: 'http://172.16.50.7/DHAKA-FLIX-7/English%20Movies/%282023%29/Oppenheimer%20%282023%29%20720p%20%5BDual%20Audio%5D/Oppenheimer%20%282023%29%20IMAX%20720p%20BluRay%20x264%20ESub%20%5BDual%20Audio%5D%5BHindi%205.1%2BEnglish%205.1%5D%20-mkvC.mkv', type: 'video' },
      { name: 'Fast Mirror (HD)', url: 'https://autoembed.co/movie/imdb/tt15398776', type: 'embed' }
    ],
    extension: 'mkv',
    rawHref: '/DHAKA-FLIX-7/English%20Movies/%282023%29/Oppenheimer%20%282023%29%20720p%20%5BDual%20Audio%5D/Oppenheimer%20%282023%29%20IMAX%20720p%20BluRay%20x264%20ESub%20%5BDual%20Audio%5D%5BHindi%205.1%2BEnglish%205.1%5D%20-mkvC.mkv',
    libraryName: 'Dhaka Flix',
    group: 'English Movies',
    posterUrl: 'https://m.media-amazon.com/images/M/MV5BN2JkMDc5MGQtZjg3YS00NmFiLWIyZmQtZTJmNTM5MjVmYTQ4XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
    matchScore: 10
  },
  {
    title: 'The Dark Knight (2008) IMAX 720p BluRay Dual Audio',
    formattedSize: '1.4 GB',
    isFolder: false,
    playUrl: 'http://172.16.50.7/DHAKA-FLIX-7/English%20Movies/%282008%29/The%20Dark%20Knight%20%282008%29%20720p%20%5BDual%20Audio%5D/The%20Dark%20Knight%20%282008%29%20IMAX%20720p%20BluRay%20x264%20ESub%20%5BDual%20Audio%5D%5BHindi%205.1%2BEnglish%205.1%5D%20-%20mkvC.mkv',
    trailerUrl: 'https://www.youtube-nocookie.com/embed/EXeTwQWrcwY',
    embedUrl: 'https://autoembed.co/movie/imdb/tt0468569',
    imdbId: 'tt0468569',
    sources: [
      { name: 'BDIX Direct Stream', url: 'http://172.16.50.7/DHAKA-FLIX-7/English%20Movies/%282008%29/The%20Dark%20Knight%20%282008%29%20720p%20%5BDual%20Audio%5D/The%20Dark%20Knight%20%282008%29%20IMAX%20720p%20BluRay%20x264%20ESub%20%5BDual%20Audio%5D%5BHindi%205.1%2BEnglish%205.1%5D%20-%20mkvC.mkv', type: 'video' },
      { name: 'Fast Mirror (HD)', url: 'https://autoembed.co/movie/imdb/tt0468569', type: 'embed' }
    ],
    extension: 'mkv',
    rawHref: '/DHAKA-FLIX-7/English%20Movies/%282008%29/The%20Dark%20Knight%20%282008%29%20720p%20%5BDual%20Audio%5D/The%20Dark%20Knight%20%282008%29%20IMAX%20720p%20BluRay%20x264%20ESub%20%5BDual%20Audio%5D%5BHindi%205.1%2BEnglish%205.1%5D%20-%20mkvC.mkv',
    libraryName: 'Dhaka Flix',
    group: 'English Movies',
    posterUrl: 'https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_FMjpg_UX1000_.jpg',
    matchScore: 9
  },
  {
    title: 'Interstellar (2014) IMAX 720p BluRay Dual Audio',
    formattedSize: '1.75 GB',
    isFolder: false,
    playUrl: 'http://172.16.50.7/DHAKA-FLIX-7/English%20Movies/%282014%29/Interstellar%20%282014%29%20720p%20%5BDual%20Audio%5D/Interstellar%20%282014%29%20IMAX%20720p%20BluRay%20x264%20ESub%20%5BDual%20Audio%5D%5BHindi%202.0%2BEnglish%205.1%5D%20-mkvC.mkv',
    trailerUrl: 'https://www.youtube-nocookie.com/embed/zSWdZVtXT7E',
    embedUrl: 'https://autoembed.co/movie/imdb/tt0816692',
    imdbId: 'tt0816692',
    sources: [
      { name: 'BDIX Direct Stream', url: 'http://172.16.50.7/DHAKA-FLIX-7/English%20Movies/%282014%29/Interstellar%20%282014%29%20720p%20%5BDual%20Audio%5D/Interstellar%20%282014%29%20IMAX%20720p%20BluRay%20x264%20ESub%20%5BDual%20Audio%5D%5BHindi%202.0%2BEnglish%205.1%5D%20-mkvC.mkv', type: 'video' },
      { name: 'Fast Mirror (HD)', url: 'https://autoembed.co/movie/imdb/tt0816692', type: 'embed' }
    ],
    extension: 'mkv',
    rawHref: '/DHAKA-FLIX-7/English%20Movies/%282014%29/Interstellar%20%282014%29%20720p%20%5BDual%20Audio%5D/Interstellar%20%282014%29%20IMAX%20720p%20BluRay%20x264%20ESub%20%5BDual%20Audio%5D%5BHindi%202.0%2BEnglish%205.1%5D%20-mkvC.mkv',
    libraryName: 'Dhaka Flix',
    group: 'English Movies',
    posterUrl: 'https://m.media-amazon.com/images/M/MV5BYzdjMDAxZGItMjI2My00ODA1LTlkNzItOWFjMDU5ZDJlYWY3XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
    matchScore: 9
  },
  {
    title: 'Breaking Bad S01E01 Pilot 1080p BluRay HEVC Dual Audio',
    formattedSize: '1.01 GB',
    isFolder: false,
    playUrl: 'http://172.16.50.12/DHAKA-FLIX-12/TV-WEB-Series/TV%20Series%20%E2%99%A5%20%20A%20%20%E2%80%94%20%20L/Breaking%20Bad%20%28TV%20Series%202008%E2%80%932013%29%201080p%20%5BDual%20Audio%5D/Season%201/Breaking%20Bad%20S01E01%20%201080p%20BluRay%20x265%20HEVC%20ESub%20%5BDual%20Audio%5D%5BHindi%202.0%2BEnglish%205.1%5D%20-MsMod.mkv',
    trailerUrl: 'https://www.youtube-nocookie.com/embed/HhesaQXLuRY',
    embedUrl: 'https://autoembed.co/tv/imdb/tt0903747-1-1',
    imdbId: 'tt0903747',
    sources: [
      { name: 'BDIX Direct Stream', url: 'http://172.16.50.12/DHAKA-FLIX-12/TV-WEB-Series/TV%20Series%20%E2%99%A5%20%20A%20%20%E2%80%94%20%20L/Breaking%20Bad%20%28TV%20Series%202008%E2%80%932013%29%201080p%20%5BDual%20Audio%5D/Season%201/Breaking%20Bad%20S01E01%20%201080p%20BluRay%20x265%20HEVC%20ESub%20%5BDual%20Audio%5D%5BHindi%202.0%2BEnglish%205.1%5D%20-MsMod.mkv', type: 'video' },
      { name: 'Fast Mirror (HD)', url: 'https://autoembed.co/tv/imdb/tt0903747-1-1', type: 'embed' }
    ],
    extension: 'mkv',
    rawHref: '/DHAKA-FLIX-12/TV-WEB-Series/TV%20Series%20%E2%99%A5%20%20A%20%20%E2%80%94%20%20L/Breaking%20Bad%20%28TV%20Series%202008%E2%80%932013%29%201080p%20%5BDual%20Audio%5D/Season%201/Breaking%20Bad%20S01E01%20%201080p%20BluRay%20x265%20HEVC%20ESub%20%5BDual%20Audio%5D%5BHindi%202.0%2BEnglish%205.1%5D%20-MsMod.mkv',
    libraryName: 'Dhaka Flix',
    group: 'TV Shows',
    posterUrl: 'https://m.media-amazon.com/images/M/MV5BMzU5ZGYzNmQtMTdhNw00NzgzLTgyYTUtMzk5NDkyMjhjMDRjXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
    matchScore: 9
  },
  {
    title: 'The Avengers (1998) 720p BluRay x264',
    formattedSize: '680 MB',
    isFolder: false,
    playUrl: 'http://172.16.50.7/DHAKA-FLIX-7/English%20Movies/%281998%29/The%20Avengers%20%281998%29%20720p/The.Avengers.1998.720p.BluRay.x264.YIFY.mp4',
    trailerUrl: 'https://www.youtube-nocookie.com/embed/eOrNdBpGMv8',
    embedUrl: 'https://autoembed.co/movie/imdb/tt0118661',
    imdbId: 'tt0118661',
    sources: [
      { name: 'BDIX Direct High-Speed MP4', url: 'http://172.16.50.7/DHAKA-FLIX-7/English%20Movies/%281998%29/The%20Avengers%20%281998%29%20720p/The.Avengers.1998.720p.BluRay.x264.YIFY.mp4', type: 'video' },
      { name: 'Fast Mirror (HD)', url: 'https://autoembed.co/movie/imdb/tt0118661', type: 'embed' }
    ],
    extension: 'mp4',
    rawHref: '/DHAKA-FLIX-7/English%20Movies/%281998%29/The%20Avengers%20%281998%29%20720p/The.Avengers.1998.720p.BluRay.x264.YIFY.mp4',
    libraryName: 'Dhaka Flix',
    group: 'English Movies',
    posterUrl: 'https://m.media-amazon.com/images/M/MV5BNGE0YTVjNzUtNzJjOS00NGNlLTgxMzctZTY4YTE1Y2Y1ZTU4XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
    matchScore: 8
  },
  {
    title: 'Deadpool & Wolverine (2024) 1080p WEBRip Dual Audio HEVC',
    formattedSize: '2.4 GB',
    isFolder: false,
    playUrl: 'http://172.16.50.7/DHAKA-FLIX-7/English%20Movies/%282016%29/Deadpool%20%282016%29%20720p%20%5BDual%20Audio%5D/Deadpool%20%282016%29%20720p%20BluRay%20x264%20ESub%20%5BDual%20Audio%5D%5BHindi%20DD5.1%2BEnglish%205.1%5D%20-%20KartiKing.mkv',
    trailerUrl: 'https://www.youtube-nocookie.com/embed/73_1biulkYk',
    embedUrl: 'https://autoembed.co/movie/imdb/tt6263850',
    imdbId: 'tt6263850',
    sources: [
      { name: 'BDIX Direct Stream', url: 'http://172.16.50.7/DHAKA-FLIX-7/English%20Movies/%282016%29/Deadpool%20%282016%29%20720p%20%5BDual%20Audio%5D/Deadpool%20%282016%29%20720p%20BluRay%20x264%20ESub%20%5BDual%20Audio%5D%5BHindi%20DD5.1%2BEnglish%205.1%5D%20-%20KartiKing.mkv', type: 'video' },
      { name: 'Fast Mirror (HD)', url: 'https://autoembed.co/movie/imdb/tt6263850', type: 'embed' }
    ],
    extension: 'mkv',
    rawHref: '/DHAKA-FLIX-7/English%20Movies/%282016%29/Deadpool%20%282016%29%20720p%20%5BDual%20Audio%5D/Deadpool%20%282016%29%20720p%20BluRay%20x264%20ESub%20%5BDual%20Audio%5D%5BHindi%20DD5.1%2BEnglish%205.1%5D%20-%20KartiKing.mkv',
    libraryName: 'Dhaka Flix',
    group: 'English Movies',
    posterUrl: 'https://m.media-amazon.com/images/M/MV5BNzRiMjg0MzUtNTQ1Mi00Y2Q5LWEwM2MtMzUwZDU5NmVjN2NkXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
    matchScore: 8
  },
  {
    title: 'Shōgun (2024) S01 Complete 1080p 10bit WEBRip x265',
    formattedSize: '12.6 GB',
    isFolder: true,
    playUrl: 'http://172.16.50.10/DHAKA-FLIX-10/Awards%20%26%20TV%20Shows/Shogun%20%282024%29%20Season%201/',
    trailerUrl: 'https://www.youtube-nocookie.com/embed/yRfQWY453Sk',
    embedUrl: 'https://autoembed.co/tv/imdb/tt2788316-1-1',
    imdbId: 'tt2788316',
    sources: [
      { name: 'BDIX Folder', url: 'http://172.16.50.10/DHAKA-FLIX-10/Awards%20%26%20TV%20Shows/Shogun%20%282024%29%20Season%201/', type: 'video' },
      { name: 'Fast Mirror (HD)', url: 'https://autoembed.co/tv/imdb/tt2788316-1-1', type: 'embed' }
    ],
    extension: '',
    rawHref: '/DHAKA-FLIX-10/Awards%20%26%20TV%20Shows/Shogun%20%282024%29%20Season%201/',
    libraryName: 'Dhaka Flix',
    group: 'TV Shows',
    posterUrl: 'https://m.media-amazon.com/images/M/MV5BMjA4N2FlYjEtYTcxMS00MjVhLWIyYjYtOWFlNjcxMmMyYTYwXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
    matchScore: 9
  }
];

export async function fetchTrending(_server: 1 | 2 = 1): Promise<SearchResult[]> {
  return SHOWCASE_CATALOG;
}

export function buildProxyUrl(targetUrl: string, proxyMode: string = 'auto', customProxyUrl: string = ''): string {
  if (!targetUrl) return '';
  if (proxyMode === 'direct') return targetUrl;
  if (proxyMode === 'custom' && customProxyUrl) {
    return `${customProxyUrl}${encodeURIComponent(targetUrl)}`;
  }
  // Native Android devices on BDIX Wi-Fi reach Dhaka Flix and ICC FTP directly
  if (Capacitor.isNativePlatform()) {
    return targetUrl;
  }
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    const bdixMatch = targetUrl.match(/^http:\/\/172\.16\.50\.(\d+)(.*)/);
    if (bdixMatch) {
      return `/api-bdix-${bdixMatch[1]}${bdixMatch[2]}`;
    }
    const iccMatch = targetUrl.match(/^http:\/\/10\.16\.100\.(\d+)(.*)/);
    if (iccMatch) {
      const octet = iccMatch[1];
      if (octet === '244') {
        return `/api-icc${iccMatch[2]}`;
      }
      return `/api-icc-${octet}${iccMatch[2]}`;
    }
  }
  return `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
}

// Build multi-source list for any media item
export function buildMediaSources(
  title: string,
  rawHref: string,
  serverOrigin: string,
  imdbId?: string,
  isDir = false
): {
  playUrl: string;
  sources: VideoSource[];
  embedUrl: string;
  directUrl: string;
} {
  const isMp4 = rawHref.toLowerCase().endsWith('.mp4');
  const directUrl = `${serverOrigin}${rawHref}`;
  
  // Extract clean search term from filename
  const cleanTitle = decodeURIComponent(title)
    .replace(/\.(mkv|mp4|avi|webm)$/i, '')
    .replace(/(\b\d{4}\b).*$/i, '$1') // retain year
    .trim();

  const id = imdbId || lookupImdbId(cleanTitle);

  // Fast mirror embed URL
  const embed = id
    ? `https://autoembed.co/movie/imdb/${id}`
    : `https://autoembed.co/movie/imdb/${encodeURIComponent(cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}`;

  const sources: VideoSource[] = [];

  if (isMp4) {
    sources.push({
      name: 'BDIX Direct MP4 (HTML5)',
      url: directUrl,
      type: 'video'
    });
    sources.push({
      name: 'Fast Mirror (HD)',
      url: embed,
      type: 'embed'
    });
  } else {
    if (!isDir && directUrl.startsWith('http')) {
      sources.push({
        name: 'BDIX Direct Stream',
        url: directUrl,
        type: 'video'
      });
    }
    sources.push({
      name: 'Fast Mirror (HD)',
      url: embed,
      type: 'embed'
    });
  }

  return {
    playUrl: sources[0].url,
    sources,
    embedUrl: embed,
    directUrl
  };
}



async function postData(
  url: string,
  headers: Record<string, string>,
  data: any,
  timeoutMs: number = 7000
): Promise<any> {
  if (Capacitor.isNativePlatform()) {
    try {
      const res = await CapacitorHttp.post({
        url,
        headers,
        data,
        connectTimeout: timeoutMs,
        readTimeout: timeoutMs
      });
      if (typeof res.data === 'string') {
        try {
          return JSON.parse(res.data);
        } catch {
          return res.data;
        }
      }
      return res.data;
    } catch (e) {
      console.warn('CapacitorHttp.post failed for', url, e);
      throw e;
    }
  } else {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: typeof data === 'string' ? data : JSON.stringify(data),
      signal: AbortSignal.timeout(timeoutMs)
    });
    return await res.json();
  }
}

export async function getData(
  url: string,
  headers: Record<string, string> = {},
  timeoutMs: number = 7000
): Promise<any> {
  if (Capacitor.isNativePlatform()) {
    try {
      const res = await CapacitorHttp.get({
        url,
        headers,
        connectTimeout: timeoutMs,
        readTimeout: timeoutMs
      });
      if (typeof res.data === 'string') {
        try {
          return JSON.parse(res.data);
        } catch {
          return res.data;
        }
      }
      return res.data;
    } catch (e) {
      console.warn('CapacitorHttp.get failed for', url, e);
      throw e;
    }
  } else {
    const res = await fetch(url, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(timeoutMs)
    });
    return await res.text();
  }
}

export async function executeSearch(
  query: string,
  server: 1 | 2,
  selectedCategoryIds: string[],
  isAllSelected: boolean,
  proxyMode: string = 'auto',
  customProxyUrl: string = ''
): Promise<SearchResult[]> {
  const qTrim = query.trim();
  if (!qTrim) return [];

  // 1. ICC FTP Search (Server 2)
  if (server === 2) {
    try {
      const iccCommandUrl = buildProxyUrl('http://10.16.100.244/command.php', proxyMode, customProxyUrl);
      const data = await postData(
        iccCommandUrl,
        { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        `cSearch=${encodeURIComponent(qTrim)}`,
        5000
      );

      if (Array.isArray(data) && data.length > 0) {
        return data.filter((item: any) => isSelectableMedia(String(item.name || ''))).map((item: any) => {
          const id = String(item.id || '');
          const name = String(item.name || '').trim();
          const playerUrl = `http://10.16.100.244/player.php?play=${id}`;
          const poster = item.image ? `http://10.16.100.244/files/${item.image}` : undefined;
          const imdb = lookupImdbId(name);

          const streamData = buildMediaSources(name, `/player.php?play=${id}`, 'http://10.16.100.244', imdb);
          streamData.sources.unshift({
            name: 'ICC FTP Player (BDIX)',
            url: playerUrl,
            type: 'embed'
          });

          return {
            title: name,
            formattedSize: 'ICC Media',
            isFolder: /(?:Season|Episode|Completed|S\d{1,2}E\d{1,2})/i.test(name),
            playUrl: playerUrl,
            embedUrl: streamData.embedUrl,
            sources: streamData.sources,
            rawHref: `/player.php?play=${id}`,
            extension: 'mp4',
            libraryName: 'ICC FTP',
            group: 'Movies',
            posterUrl: poster,
            matchScore: 10
          } as SearchResult;
        });
      }
    } catch (e) {
      console.warn('ICC search error', e);
      throw new Error('ICC FTP is unavailable or timed out. Check your network and try again.');
    }
  }

  // 2. Live Dhaka Flix search (Server 1)
  try {
    const roots = mediaLibraryRaw as MediaRoot[];
    const targetRoots = isAllSelected
      ? roots
      : roots.filter((r) => selectedCategoryIds.includes(r.id));

    const rootsToQuery = targetRoots.length > 0 ? targetRoots.slice(0, 5) : roots.slice(0, 5);

    const livePromises = rootsToQuery.map(async (root) => {
      try {
        const proxiedUrl = buildProxyUrl(root.url, proxyMode, customProxyUrl);
        const payload = {
          action: 'get',
          search: {
            href: root.href,
            pattern: qTrim,
            ignorecase: true
          }
        };

        const data = await postData(
          proxiedUrl,
          { 'Content-Type': 'application/json;charset=utf-8' },
          payload,
          4500
        );

        const searchItems = data?.search || [];
        return searchItems.filter((item: any) => {
          const href = String(item.href || '');
          return isSelectableMedia(href.split('/').filter(Boolean).pop() || href, href.endsWith('/'));
        }).map((item: any) => {
          const href = item.href || '';
          const name = href.split('/').filter(Boolean).pop() || href;
          const cleanName = decodeURIComponent(name);
          const isDir = href.endsWith('/');
          const imdb = lookupImdbId(cleanName);
          const mediaSources = buildMediaSources(cleanName, href, root.serverOrigin, imdb, isDir);

          return {
            title: cleanName,
            formattedSize: isDir ? 'Folder' : `${((item.size || 0) / (1024 * 1024)).toFixed(1)} MB`,
            isFolder: isDir,
            playUrl: mediaSources.playUrl,
            embedUrl: mediaSources.embedUrl,
            sources: mediaSources.sources,
            rawHref: href,
            extension: isDir ? '' : name.split('.').pop() || '',
            libraryName: root.name,
            group: root.group,
            matchScore: 10
          } as SearchResult;
        });
      } catch (error) {
        throw error;
      }
    });

    const settled = await Promise.allSettled(livePromises);
    const successful = settled.filter((r): r is PromiseFulfilledResult<SearchResult[]> => r.status === 'fulfilled');
    if (successful.length === 0) {
      throw new Error('Dhaka Flix is unavailable or timed out. Connect to BDIX or try Fast Mirror.');
    }
    const results = successful
      .flatMap((r) => r.value);

    return results;
  } catch (err) {
    console.warn('Dhaka Flix search error', err);
    throw err;
  }
}

// Fetch real category items when user clicks a category without typing a query
export async function fetchCategoryItems(
  server: 1 | 2,
  selectedCategoryIds: string[],
  isAllSelected: boolean,
  proxyMode: string = 'auto',
  customProxyUrl: string = ''
): Promise<SearchResult[]> {
  if (server === 2) {
    // For ICC FTP, query popular recent entries
    try {
      return await executeSearch('2024', 2, selectedCategoryIds, isAllSelected, proxyMode, customProxyUrl);
    } catch {
      throw new Error('ICC FTP is unavailable or timed out.');
    }
  }

  // Server 1 (Dhaka Flix)
  const roots = mediaLibraryRaw as MediaRoot[];
  const targetRoots = isAllSelected
    ? roots.filter((r) => ['english_movies_1080p', 'animation_movies_1080p', 'hindi_movies'].includes(r.id))
    : roots.filter((r) => selectedCategoryIds.includes(r.id));

  const queryRoots = targetRoots.length > 0 ? targetRoots.slice(0, 3) : roots.slice(0, 3);

  const promises = queryRoots.map(async (root) => {
    try {
      const proxiedUrl = buildProxyUrl(`${root.serverOrigin}${root.href}`, proxyMode, customProxyUrl);
      const payload = {
        action: 'get',
        items: {
          href: root.href,
          what: 1
        }
      };

      const data = await postData(
        proxiedUrl,
        { 'Content-Type': 'application/json;charset=utf-8' },
        payload,
        5000
      );

      const items = (data?.items || []).filter((item: any) => {
        const decoded = decodeURIComponent(item.href || '');
        const rootDecoded = decodeURIComponent(root.href);
        const name = decoded.split('/').filter(Boolean).pop() || decoded;
        return decoded !== rootDecoded && decoded.startsWith(rootDecoded) && isSelectableMedia(name, decoded.endsWith('/'));
      });

      return items.map((item: any) => {
        const href = item.href || '';
        const name = href.split('/').filter(Boolean).pop() || href;
        const cleanName = decodeURIComponent(name);
        const isDir = href.endsWith('/') || item.size === null;
        const imdb = lookupImdbId(cleanName);
        const mediaSources = buildMediaSources(cleanName, href, root.serverOrigin, imdb, isDir);

        return {
          title: cleanName,
          formattedSize: isDir ? 'Folder' : `${((item.size || 0) / (1024 * 1024)).toFixed(1)} MB`,
          isFolder: isDir,
          playUrl: mediaSources.playUrl,
          embedUrl: mediaSources.embedUrl,
          sources: mediaSources.sources,
          rawHref: href,
          extension: isDir ? '' : name.split('.').pop() || '',
          libraryName: root.name,
          group: root.group,
          matchScore: 9
        } as SearchResult;
      });
    } catch (error) {
      throw error;
    }
  });

  const settled = await Promise.allSettled(promises);
  const successful = settled.filter((r): r is PromiseFulfilledResult<SearchResult[]> => r.status === 'fulfilled');
  if (successful.length === 0) throw new Error('Dhaka Flix is unavailable or timed out.');
  return successful.flatMap((r) => r.value);
}

// Fetch real files inside a folder (Dhaka Flix h5ai)
export async function fetchFolderItems(
  folder: SearchResult,
  proxyMode: string = 'auto',
  customProxyUrl: string = ''
): Promise<SearchResult[]> {
  const href = folder.rawHref;
  if (!href) return [];

  // Determine server origin
  let serverOrigin = 'http://172.16.50.7';
  if (href.includes('DHAKA-FLIX-10')) serverOrigin = 'http://172.16.50.10';
  if (href.includes('DHAKA-FLIX-12')) serverOrigin = 'http://172.16.50.12';
  if (href.includes('DHAKA-FLIX-14')) serverOrigin = 'http://172.16.50.14';

  const folderUrl = `${serverOrigin}${href}`;
  const proxiedUrl = buildProxyUrl(folderUrl, proxyMode, customProxyUrl);

  try {
    const payload = {
      action: 'get',
      items: {
        href: href,
        what: 1
      }
    };

    const data = await postData(
      proxiedUrl,
      { 'Content-Type': 'application/json;charset=utf-8' },
      payload,
      5000
    );

    const items = (data?.items || []).filter((h: any) => {
      const decoded = decodeURIComponent(h.href || '');
      const selfDecoded = decodeURIComponent(href);
      const name = decoded.split('/').filter(Boolean).pop() || decoded;
      return decoded !== selfDecoded && decoded.startsWith(selfDecoded) && isSelectableMedia(name, decoded.endsWith('/'));
    });

    if (items.length > 0) {
      return items.map((item: any, idx: number) => {
        const itemHref = item.href;
        const name = decodeURIComponent(itemHref.split('/').filter(Boolean).pop() || itemHref);
        const isDir = itemHref.endsWith('/') || item.size === null;
        const imdb = lookupImdbId(folder.title);
        const isTv = /(?:season|episode|s\d{1,2}e\d{1,2}|tv|series)/i.test(folder.title);
        const mirrorEmbed = imdb
          ? isTv
            ? `https://autoembed.co/tv/imdb/${imdb}-1-${idx + 1}`
            : `https://autoembed.co/movie/imdb/${imdb}`
          : undefined;

        const sources = buildMediaSources(name, itemHref, serverOrigin, imdb, isDir);
        if (mirrorEmbed && !isDir) {
          if (!sources.sources.some((s) => s.name.includes('Fast Mirror'))) {
            sources.sources.push({
              name: isTv ? `Fast Mirror Ep ${idx + 1}` : 'Fast Mirror (HD)',
              url: mirrorEmbed,
              type: 'embed'
            });
          }
        }

        return {
          title: name,
          parentPath: folder.title,
          formattedSize: isDir ? 'Folder' : `${((item.size || 0) / (1024 * 1024)).toFixed(1)} MB`,
          isFolder: isDir,
          playUrl: sources.playUrl,
          embedUrl: mirrorEmbed || sources.embedUrl,
          sources: sources.sources,
          rawHref: itemHref,
          extension: isDir ? '' : name.split('.').pop() || 'mkv',
          libraryName: folder.libraryName,
          group: folder.group,
          posterUrl: folder.posterUrl
        } as SearchResult;
      });
    }
  } catch (err) {
    console.warn('Live folder fetch error', err);
  }

  return [];
}

/**
 * Real connectivity testing for both Dhaka Flix (Server 1) and ICC FTP (Server 2)
 */
export async function testServerConnection(
  server: 1 | 2,
  customUrl?: string,
  proxyMode: 'auto' | 'direct' | 'corsproxy' | 'custom' = 'auto',
  customProxyUrl?: string
): Promise<{ success: boolean; latencyMs: number; message: string }> {
  const startTime = Date.now();
  let rawUrl = '';

  if (server === 1) {
    rawUrl = 'http://172.16.50.7/DHAKA-FLIX-7/English%20Movies/';
  } else {
    rawUrl = customUrl && customUrl.trim().length > 0 ? customUrl.trim() : 'http://10.16.100.244/command.php';
  }

  const serverName = server === 2 ? 'ICC FTP' : 'Dhaka Flix';

  try {
    const targetUrl = buildProxyUrl(rawUrl, proxyMode, customProxyUrl);
    if (server === 2) {
      await postData(
        targetUrl,
        { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        'cSearch=test',
        4000
      );
    } else {
      await postData(
        targetUrl,
        { 'Content-Type': 'application/json;charset=utf-8' },
        { action: 'get', items: { href: '/DHAKA-FLIX-7/English Movies/', what: 1 } },
        4000
      );
    }

    const latency = Date.now() - startTime;
    return {
      success: true,
      latencyMs: latency,
      message: `Connected successfully! (${serverName} · ${latency}ms)`
    };
  } catch (err: any) {
    const latency = Date.now() - startTime;
    return {
      success: false,
      latencyMs: latency,
      message: `Connection failed: ${serverName} timed out or unreachable`
    };
  }
}

