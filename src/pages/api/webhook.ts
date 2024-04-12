const rpc = `https://rpc.helius.xyz/?api-key=${process.env.HELIUS_KEY}`;
const telegramApi = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;

const getAsset = async (token: string) => {
  const response = await fetch(rpc, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'my-id',
      method: 'getAsset',
      params: { id: token },
    }),
  });
  const { result } = await response.json();
  return result;
};

export default async function handler(req: any, res: any) {
  try {
    if (req.method === "POST") {
      let webhook_data = req.body;
      let token = await getAsset(webhook_data[0].events.nft.nfts[0].mint);
      const salePrice = (webhook_data[0].events.nft.amount / 1000000000).toFixed(2);
      const buyer = webhook_data[0].events.nft.buyer.slice(0, 4) + '..' + webhook_data[0].events.nft.buyer.slice(-4);
      const seller = webhook_data[0].events.nft.seller.slice(0, 4) + '..' + webhook_data[0].events.nft.seller.slice(-4);
      const imageUrl = token.content.files[0].uri;
      const messageText = `*${token.content.metadata.name} has sold!*\n` +
                          `[Image](${imageUrl})\n` +
                          `*Sale Price:* ${salePrice} SOL\n` +
                          `*Buyer:* ${buyer}\n` +
                          `*Seller:* ${seller}`;

      console.log("this ran")
      const response = await fetch(telegramApi, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: messageText,
          parse_mode: "Markdown",
        }),
      });
      
      console.log(response);
      res.status(200).json("success");
    }
  } catch (err) {
    console.log(err);
  }
}
