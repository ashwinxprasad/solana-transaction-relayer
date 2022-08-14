// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  Message,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import bs58 from "bs58";
import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
  data: any;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  let clusterURL =
    "https://dawn-wild-mansion.solana-testnet.discover.quiknode.pro/8e3ffd4815d22093c073fa37348521cbe7d9ae57";
  let connection = new Connection(clusterURL);
  const payerPrivateKey = [
    64, 49, 21, 122, 173, 218, 147, 45, 207, 84, 138, 105, 6, 50, 18, 81, 174,
    246, 20, 171, 195, 135, 70, 222, 225, 154, 217, 74, 218, 186, 191, 197, 49,
    170, 69, 11, 200, 3, 223, 9, 39, 74, 201, 163, 68, 222, 53, 183, 52, 220,
    243, 79, 228, 240, 168, 172, 218, 155, 91, 56, 123, 136, 222, 143,
  ];
  const data = req.body;
  const payer = Keypair.fromSecretKey(Uint8Array.from(payerPrivateKey));
  const result = await relayTransaction(data, payer, connection);
  res.status(200).json({ data: result });
}

export interface RelayerIxData {
  message: string;
  signature: string;
  publicKey: string;
}

/**
 * Relay a given transaction data on to the blockchain, while paying for gas

 */
export const relayTransaction = async (
  data: RelayerIxData,
  payer: Keypair,
  connection: Connection
) => {
  const transaction = Transaction.populate(
    Message.from(Buffer.from(data.message, "base64"))
  );

  console.log(
    (await connection.getBalance(payer.publicKey)) / LAMPORTS_PER_SOL
  );

  console.log(
    (await connection.getBalance(new PublicKey(data.publicKey))) /
      LAMPORTS_PER_SOL
  );

  console.log(payer.publicKey.toString());
  console.log({ data });

  transaction.addSignature(
    new PublicKey(data.publicKey),
    Buffer.from(bs58.decode(data.signature))
  );

  const latestBlockHash = await connection.getLatestBlockhash();

  transaction.partialSign(payer);
  transaction.recentBlockhash = latestBlockHash.blockhash;

  const res = await connection.sendEncodedTransaction(
    transaction.serialize().toString("base64")
  );

  // TODO: Update to the latest API
  console.log("CONFIRMING", res);
  const confirmation = await connection.confirmTransaction({
    signature: res,
    blockhash: latestBlockHash.blockhash,
    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
  });
  return confirmation;
  // return confirmation;
};
