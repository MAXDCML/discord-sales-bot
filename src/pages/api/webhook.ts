const rpc = `https://rpc.helius.xyz/?api-key=${process.env.HELIUS_KEY}`;
const telegramApi = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendPhoto`;

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
      console.log("events data",webhook_data[0].events)
      let token = await getAsset(webhook_data[0].events.nft.nfts[0].mint);
      console.log("token", token)
      const salePrice = (webhook_data[0].events.nft.amount / 1000000000).toFixed(2);
      const buyer = webhook_data[0].events.nft.buyer.slice(0, 4) + '..' + webhook_data[0].events.nft.buyer.slice(-4);
      const seller = webhook_data[0].events.nft.seller.slice(0, 4) + '..' + webhook_data[0].events.nft.seller.slice(-4);
      const imageUrl = token.content.files[0].uri;
      let captionText
      if (webhook_data[0].events.nft.type == 'NFT_SALE') {
        captionText = `*${token.content.metadata.name} has been bought!*\n\n` +
                      `*Price:* ${salePrice} SOL\n` +
                      `*Buyer:* ${buyer}\n` +
                      `*Seller:* ${seller}`;
      } else {
        captionText = `*${token.content.metadata.name} was minted!*\n\n` +
                      `*Mint Price:* ${salePrice} SOL\n` +
                      `*Minted by:* ${buyer}\n`;
      }


      console.log("this ran")
      const response = await fetch(telegramApi, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          photo: imageUrl,
          caption: captionText,
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
