import  { writeFileSync } from "fs";

for (let i = 0; i < 12; ++i) {
  writeFileSync(
    `assets/tokens/${i}.json`,
    JSON.stringify({
      image:
        `https://raw.githubusercontent.com/diaozheng999/nft/master/assets/images/token-${i}.jpg`,
      description:
        "Thank you for coming to witness our wedding. May our love be strong and last forever.",
      name: `Simon & Ya Min #${i}`,
    })
  );
}
