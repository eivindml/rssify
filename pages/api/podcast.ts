import type { NextApiRequest, NextApiResponse } from "next";
import { Podcast } from "podcast";
import fetch from "node-fetch";

async function api<T>(path: string): Promise<T> {
  return fetch("https://api.podme.com/web/api/v2" + path, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${process.env.PODME_TOKEN}`,
    },
  }).then((response) => {
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return response.json() as Promise<T>;
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.query.secret !== process.env.SECRET)
    return res.status(300).end("Access denied!");

  const response = await api<
    Array<{
      id: number;
      title: string;
      mediumImageUrl: string;
      description: string;
      dateAdded: string;
    }>
  >(`/episode/slug/${req.query.slug}`);

  const podcast = await api<{
    id: number;
    title: string;
    description: string;
    imageUrl: string;
  }>(`/podcast/slug/${req.query.slug}`);

  /* lets create an rss feed */
  /* TODO: Remove fields that are not used and not needed */
  const feed = new Podcast({
    title: podcast.title,
    description: podcast.description,
    feedUrl: "https://podme-to-rss.vercel.app/api/podcast", // TODO: Set this with ENV
    siteUrl: "https://podme-to-rss.vercel.app",
    imageUrl: podcast.imageUrl,
    docs: "http://example.com/rss/docs.html",
    author: podcast.title,
    managingEditor: "Dylan Greene",
    webMaster: "Dylan Greene",
    copyright: "2013 Dylan Greene",
    language: "no",
    categories: ["Category 1", "Category 2", "Category 3"],
    pubDate: "May 20, 2012 04:00:00 GMT",
    ttl: 60,
    itunesAuthor: podcast.title,
    itunesSubtitle: "I am a sub title",
    itunesSummary: podcast.description,
    itunesOwner: { name: podcast.title, email: "max@unsou.de" },
    itunesExplicit: false,
    itunesCategory: [
      {
        text: "Entertainment",
        subcats: [
          {
            text: "Television",
          },
        ],
      },
    ],
    itunesImage: podcast.imageUrl,
  });

  /* loop over data and add to feed */
  await asyncForEach(response, async (episode) => {
    const epDetails = await api<{
      title: string;
      description: string;
      streamUrl: string;
      podcastTitle: string;
      length: string;
    }>(`/episode/${episode.id}`);

    console.log(epDetails.streamUrl);

    /* TODO: Remove unused properties */
    feed.addItem({
      title: epDetails.title,
      description: epDetails.description,
      url: "http://example.com/article4?this&that", // link to the item
      guid: String(episode.id), // optional - defaults to url
      date: episode.dateAdded, // any format that js Date can parse.
      enclosure: {
        url: epDetails.streamUrl,
        type: "audio/x-m4a",
      },
      itunesTitle: epDetails.title,
      itunesAuthor: epDetails.podcastTitle,
      itunesExplicit: false,
      itunesSummary: episode.description,
      itunesDuration: epDetails.length,
      itunesImage: episode.mediumImageUrl,
    });
  });

  const xml = feed.buildXml();

  res.setHeader("Cache-Control", "s-maxage=43200");
  res.setHeader("Content-Type", "text/xml");
  res.status(200).end(xml);
}

async function asyncForEach<T>(
  array: Array<T>,
  callback: (item: T, index: number, array: Array<T>) => Promise<void>
) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}
