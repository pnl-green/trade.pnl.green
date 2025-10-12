// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
  name: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {
  // Placeholder API response used by Next.js starter to validate the API pipeline.
  res.status(200).json({ name: "John Doe" });
}
