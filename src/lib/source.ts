import { allDocs, allMetas } from 'content-collections';
import { loader } from 'fumadocs-core/source';
import { createMDXSource } from '@fumadocs/content-collections';

export const source = loader({
  baseUrl: '/docs',
  source: createMDXSource(allDocs, allMetas),
});

// import { docs } from '@/.source';
// import { loader } from 'fumadocs-core/source';

// // See https://fumadocs.vercel.app/docs/headless/source-api for more info
// export const source = loader({
//   // it assigns a URL to your pages
//   baseUrl: '/docs',
//   source: docs.toFumadocsSource(),
// });
