const rpc = `https://rpc.helius.xyz/?api-key=${process.env.HELIUS_KEY}`;
const telegramApi = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendPhoto`;

const fetchPriceOfSolana = async () => {
  const priceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd', {
    method: 'GET',
  });
  const priceData = await priceResponse.json();
  return priceData.solana.usd; // Adjust this depending on the API response structure
};

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
      console.log("events data",webhook_data)
      let token = await getAsset(webhook_data[0].events.nft.nfts[0].mint);
      const solPrice = await fetchPriceOfSolana();
      const salePriceSOL = Number((webhook_data[0].events.nft.amount / 1000000000).toFixed(2));
      const salePriceUSD = (salePriceSOL * solPrice).toFixed(2);
      const formattedSalePriceUSD = Number(salePriceUSD).toLocaleString('en-US');
      const TXLink = `https://solscan.io/tx/${webhook_data[0].events.nft.signature}`;
      const buyer = webhook_data[0].events.nft.buyer;
      const buyerLink = `https://solscan.io/account/${buyer}`;
      const seller = webhook_data[0].events.nft.seller.slice(0, 4) + '..' + webhook_data[0].events.nft.seller.slice(-4);
      const imageUrl = token.content.files[0].uri;
      let captionText
      if (webhook_data[0].events.nft.type == 'NFT_SALE') {
        captionText = `*${token.content.metadata.name} has been bought!*\n\n` +
                      `💰 Price:* ${salePriceSOL} SOL ($${formattedSalePriceUSD})*\n` +
                      `👤 [Buyer](${buyerLink}) | [TX](${TXLink})\n`;
      } else {
        captionText = `*${token.content.metadata.name} was minted!*\n\n` +
                      `💰 Mint Price:* ${salePriceSOL} SOL ($${formattedSalePriceUSD})*\n` +
                      `👤 [Minter](${buyerLink}) | [TX](${TXLink})\n`;
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
